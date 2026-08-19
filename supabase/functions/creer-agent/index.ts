// ============================================================================
//  PNDA — Matching Grant · Edge Function « creer-agent »
//  ---------------------------------------------------------------------------
//  Crée un compte agent (Supabase Auth) et son rattachement à une UPE.
//
//  POURQUOI CETTE FONCTION EXISTE
//  L'API admin de Supabase (auth.admin.createUser) exige la clé service_role,
//  qui contourne entièrement la RLS. Placer cette clé dans le navigateur
//  reviendrait à donner à n'importe quel visiteur du site un accès total en
//  lecture et en écriture sur toutes les fiches bénéficiaires. La clé reste
//  donc ici, côté serveur, où seule Supabase peut la lire.
//
//  CONTRÔLE D'ACCÈS
//  La fonction n'accorde rien d'elle-même : elle rejoue le jeton de
//  l'utilisateur appelant contre la base et n'agit que si est_coordination()
//  répond vrai. Un agent provincial reçoit 403.
//
//  Déploiement :  supabase functions deploy creer-agent
//  Aucune variable à configurer : SUPABASE_URL, SUPABASE_ANON_KEY et
//  SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement par la plateforme.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const UPES  = ['COORD_NAT', 'UPE_KWL', 'UPE_KAS', 'UPE_KAC'];
const ROLES = ['agent', 'superviseur', 'coordination'];
const MDP_MIN = 10;

/** Origines autorisées à appeler la fonction. Compléter au déploiement. */
const ORIGINES = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  Deno.env.get('ORIGINE_PUBLIQUE') ?? ''
].filter(Boolean);

function entetes(origin: string | null) {
  const autorise = origin && ORIGINES.some(o => origin === o || origin.endsWith('.github.io'));
  return {
    'Access-Control-Allow-Origin': autorise ? origin! : ORIGINES[0] ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

const reponse = (corps: unknown, statut: number, origin: string | null) =>
  new Response(JSON.stringify(corps), { status: statut, headers: entetes(origin) });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: entetes(origin) });
  if (req.method !== 'POST') return reponse({ erreur: 'Méthode non autorisée.' }, 405, origin);

  const jeton = req.headers.get('Authorization') ?? '';
  if (!jeton.startsWith('Bearer ')) {
    return reponse({ erreur: 'Authentification requise.' }, 401, origin);
  }

  const url  = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const svc  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── 1. Qui appelle ? On rejoue son jeton contre la base, sans privilège ────
  const appelant = createClient(url, anon, {
    global: { headers: { Authorization: jeton } },
    auth: { persistSession: false }
  });

  const { data: utilisateur, error: errUser } = await appelant.auth.getUser();
  if (errUser || !utilisateur?.user) {
    return reponse({ erreur: 'Session invalide ou expirée.' }, 401, origin);
  }

  // est_coordination() lit profils_agents pour le compte connecté : c'est la
  // base qui décide, pas cette fonction.
  const { data: estCoord, error: errCoord } = await appelant.rpc('est_coordination');
  if (errCoord) {
    return reponse({ erreur: 'Vérification des droits impossible : ' + errCoord.message }, 500, origin);
  }
  if (estCoord !== true) {
    return reponse({
      erreur: "Seule la Coordination Nationale peut créer un compte agent. "
            + "Votre compte est rattaché à une UPE provinciale."
    }, 403, origin);
  }

  // ── 2. Validation des entrées ──────────────────────────────────────────────
  let corps: Record<string, string>;
  try { corps = await req.json(); }
  catch { return reponse({ erreur: 'Corps de requête illisible.' }, 400, origin); }

  const nom      = (corps.nom ?? '').trim();
  const email    = (corps.email ?? '').trim().toLowerCase();
  const password = corps.password ?? '';
  const upe      = (corps.upe ?? '').trim();
  const role     = (corps.role ?? 'agent').trim();

  const soucis: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) soucis.push('adresse e-mail invalide');
  if (password.length < MDP_MIN) soucis.push(`mot de passe trop court (${MDP_MIN} caractères minimum)`);
  if (!UPES.includes(upe))   soucis.push('code UPE inconnu');
  if (!ROLES.includes(role)) soucis.push('rôle inconnu');
  if (soucis.length) return reponse({ erreur: 'Saisie refusée : ' + soucis.join(', ') + '.' }, 400, origin);

  // ── 3. Création, avec la clé service_role qui ne quitte jamais le serveur ──
  const admin = createClient(url, svc, { auth: { persistSession: false } });

  const { data: cree, error: errCree } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom: nom || email.split('@')[0] }
  });

  if (errCree) {
    const m = errCree.message ?? '';
    if (/already been registered|already exists/i.test(m)) {
      return reponse({ erreur: 'Un compte existe déjà avec cette adresse e-mail.' }, 409, origin);
    }
    return reponse({ erreur: 'Création du compte refusée : ' + m }, 400, origin);
  }

  // ── 4. Rattachement à l'UPE ────────────────────────────────────────────────
  const { error: errProfil } = await admin.from('profils_agents').upsert({
    user_id:  cree.user.id,
    nom:      nom || cree.user.email,
    upe_code: upe,
    role,
    actif:    true
  });

  if (errProfil) {
    // Un compte Auth sans profil ne voit rien et bloquerait une nouvelle
    // tentative avec la même adresse : on annule pour laisser la base propre.
    await admin.auth.admin.deleteUser(cree.user.id);
    return reponse({
      erreur: 'Rattachement à l\'UPE refusé, le compte a été annulé : ' + errProfil.message
    }, 500, origin);
  }

  return reponse({
    ok: true,
    user_id: cree.user.id,
    email: cree.user.email,
    upe_code: upe,
    role,
    message: `Compte créé et rattaché à ${upe} avec le rôle ${role}.`
  }, 200, origin);
});

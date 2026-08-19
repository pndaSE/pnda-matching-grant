/* ============================================================================
 * PNDA — Matching Grant · Console Suivi & Évaluation
 * ----------------------------------------------------------------------------
 * Lecture seule sur les fiches, plus la mise à jour du statut. Tout le
 * cloisonnement est appliqué par la base (RLS par UPE, migration 003) : ce
 * fichier ne filtre rien pour des raisons de sécurité, uniquement pour le
 * confort d'analyse. Un agent ne peut pas contourner son périmètre en
 * modifiant ce script.
 * ==========================================================================*/
(function () {
'use strict';

var CFG = window.PNDA_CONFIG || {};
var sb  = null;
var HORS_SERVEUR = (location.protocol === 'file:');

/* ═══════════════ 1. Icônes ═══════════════ */
var P = {
  chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  users:'<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  female:'<circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/>',
  bank:'<path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  brief:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  sprout:'<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  clip:'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  list:'<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alerte:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  horloge:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 2"/>',
  croix:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  copie:'<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  boite:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  dl:'<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  vide:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
};
function ico(n){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(P[n]||P.list)+'</svg>'; }

var LOGO = '<img src="./image/logo-pnda.png" alt="Logo PNDA" style="display:block; width:72px; height:72px; object-fit:contain; border-radius:12px;">';

/* ═══════════════ 2. Palettes ═══════════════
 * Ordre figé, jamais recyclé. Validé sur la surface #1b2537 :
 * pire paire adjacente ΔE 15.3 (protanopie) / 20.6 (vision normale),
 * contraste ≥ 3:1 pour les 7 teintes. Au-delà de 7 catégories, le reste
 * est replié dans « Autres » — on ne génère jamais une 8ᵉ couleur.
 */
var SERIE_DEFAUT = ['#559c00','#c44ebf','#b57700','#0d9999','#dd5403','#3480fc','#e3406b'];
var SERIE = SERIE_DEFAUT.slice();
var SOLO  = SERIE[0];   // série unique → une seule couleur pour toutes les barres

/**
 * Les teintes vivent dans la feuille de style (--s1 … --s7), pas ici : le thème
 * clair a ses propres pas, revalidés sur fond blanc. On les relit avant chaque
 * rendu pour que la bascule clair/sombre repeigne les graphiques sans recharger.
 * L'ordre ne change jamais : une série garde sa teinte d'un mode à l'autre.
 */
function lirePalette(){
  var cs = getComputedStyle(document.documentElement);
  SERIE = SERIE_DEFAUT.map(function (defaut, i) {
    return (cs.getPropertyValue('--s' + (i + 1)) || '').trim() || defaut;
  });
  SOLO = SERIE[0];
}

var STATUTS = {
  soumis:          { lbl:'Soumis',           col:'#94a3b8', ic:'boite'   },
  en_verification: { lbl:'En vérification',  col:'#fab219', ic:'horloge' },
  valide:          { lbl:'Validé',           col:'#0ca30c', ic:'check'   },
  rejete:          { lbl:'Rejeté',           col:'#d03b3b', ic:'croix'   },
  doublon:         { lbl:'Doublon',          col:'#ec835a', ic:'copie'   }
};
var TYPES = { association:'Association', cooperative:'Coopérative', entreprise:'Entreprise', prive:'Privé' };
var UPES  = { COORD_NAT:'Coordination Nationale', UPE_KWL:'UPE Kwilu', UPE_KAS:'UPE Kasaï', UPE_KAC:'UPE Kasaï Central' };
var PIECES= { id_electeur:"Carte d'électeur", id_passport:'Passeport', no_id:"Aucune pièce" };
var BANQUES = { equity_bcdc:'Equity BCDC', ecobank:'Ecobank', rawbank:'Rawbank', firstbankdrc:'First Bank RDC',
                uba:'UBA', accessbank:'Access Bank', tmb:'TMB', sofibank:'Sofibank', autre:'Autre' };

/* ═══════════════ 3. Utilitaires ═══════════════ */
var $  = function (s, r) { return (r || document).querySelector(s); };
var nf = new Intl.NumberFormat('fr-FR');
var nf1= new Intl.NumberFormat('fr-FR', { maximumFractionDigits:1 });
function n0(v){ return nf.format(Math.round(v || 0)); }
function n1(v){ return nf1.format(v || 0); }
function usd(cents){ return nf.format(Math.round((cents || 0) / 100)) + ' $'; }
function dateFr(d){ if(!d) return null; var x = new Date(d); return isNaN(x) ? null : x.toLocaleDateString('fr-FR'); }
function dateHeure(d){ if(!d) return null; var x = new Date(d); return isNaN(x) ? null : x.toLocaleString('fr-FR'); }
function ouiNon(v){ return v === true ? 'Oui' : v === false ? 'Non' : null; }
function pct(a, b){ return b ? Math.round(a / b * 1000) / 10 : 0; }
/** Les libellés viennent de la base : toujours insérés en texte, jamais en HTML. */
function texte(el, v){ el.textContent = (v === null || v === undefined) ? '' : String(v); return el; }
function creer(tag, cls, txt){
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

/* ═══════════════ 4. État ═══════════════ */
var ETAT = {
  profil: null, session: null,
  toutes: [],            // fiches visibles (déjà cadrées par la RLS)
  filtrees: [],
  geo: {},               // province → [territoires]
  tri: { col:'created_at', sens:-1 },
  page: 0, parPage: 50,
  filtres: { jours:0, du:'', au:'', province:'', territoire:'', upe:'', type:'', statut:'', texte:'' }
};

/* ═══════════════ 5. Connexion ═══════════════ */
function client(){
  if (sb) return sb;
  if (!window.supabase || !CFG.SUPABASE_URL) return null;
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY);
  return sb;
}

function messageConnexion(txt, type){
  var m = $('#msgConnexion');
  m.className = 'msg ' + (type || 'err') + ' on';
  m.innerHTML = ico(type === 'ok' ? 'check' : 'alerte');
  m.appendChild(creer('span', null, txt));
}

$('#formConnexion').addEventListener('submit', function (e) {
  e.preventDefault();
  var b = $('#btnConnexion');
  if (HORS_SERVEUR) {
    messageConnexion("Page ouverte en mode fichier local (file://). Le navigateur bloque la connexion à Supabase. "
      + "Lancez scripts\\3-servir-formulaire.cmd puis ouvrez http://localhost:5173/admin.html");
    return;
  }
  if (!client()) { messageConnexion("Configuration Supabase absente — vérifiez js/config.js."); return; }
  b.disabled = true; b.textContent = 'Connexion…';
  sb.auth.signInWithPassword({ email: $('#courriel').value.trim(), password: $('#motdepasse').value })
    .then(function (r) {
      if (r.error) throw r.error;
      $('#motdepasse').value = '';
      return demarrer(r.data.session);
    })
    .catch(function (err) {
      var m = (err && err.message) || 'Erreur inconnue';
      if (/Invalid login/i.test(m)) m = 'Adresse e-mail ou mot de passe incorrect.';
      if (/Email not confirmed/i.test(m)) m = "Compte non confirmé — la Coordination doit valider l'adresse.";
      messageConnexion(m);
    })
    .then(function () { b.disabled = false; b.textContent = 'Se connecter'; });
});

$('#btnDeconnexion').addEventListener('click', function () {
  sb.auth.signOut().then(function () { location.reload(); });
});

function demarrer(session){
  ETAT.session = session;
  return sb.from('profils_agents').select('nom, upe_code, role').eq('user_id', session.user.id).maybeSingle()
    .then(function (r) {
      if (r.error) throw r.error;
      ETAT.profil = r.data;
      if (!r.data) {
        messageConnexion("Ce compte est authentifié mais n'est rattaché à aucune UPE. "
          + "La Coordination Nationale doit créer la ligne correspondante dans profils_agents. "
          + "Sans elle, aucune fiche n'est visible.");
        return sb.auth.signOut();
      }
      $('#ecranConnexion').hidden = true;
      $('#ecranConnexion').style.display = 'none';
      $('#app').hidden = false;
      $('#marqueApp').innerHTML = LOGO;
      var nom = r.data.nom || session.user.email;
      $('#nomAgent').textContent = nom;
      $('#avatar').textContent = nom.trim().charAt(0).toUpperCase();
      var coord = r.data.role === 'coordination' || r.data.upe_code === 'COORD_NAT';
      $('#perimetre').textContent = (UPES[r.data.upe_code] || r.data.upe_code)
        + (coord ? ' — périmètre national' : ' — périmètre provincial');
      return chargerReferentiels().then(chargerFiches);
    });
}

/* ═══════════════ 6. Chargement des données ═══════════════ */
function chargerReferentiels(){
  return sb.from('territoires').select('libelle, province_code, provinces(libelle)').then(function (r) {
    ETAT.geo = {};
    (r.data || []).forEach(function (t) {
      var p = t.provinces && t.provinces.libelle;
      if (!p) return;
      (ETAT.geo[p] = ETAT.geo[p] || []).push(t.libelle);
    });
    remplirSelect($('#fProvince'), Object.keys(ETAT.geo).sort(), 'Toutes');
    remplirSelect($('#fUpe'), Object.keys(UPES).map(function (k) { return [k, UPES[k]]; }), 'Toutes');
    remplirSelect($('#fType'), Object.keys(TYPES).map(function (k) { return [k, TYPES[k]]; }), 'Tous');
    remplirSelect($('#fStatut'), Object.keys(STATUTS).map(function (k) { return [k, STATUTS[k].lbl]; }), 'Tous');
  });
}

function remplirSelect(sel, items, vide){
  sel.innerHTML = '';
  sel.appendChild(creer('option', null, vide)).value = '';
  items.forEach(function (it) {
    var v = Array.isArray(it) ? it[0] : it, l = Array.isArray(it) ? it[1] : it;
    var o = creer('option', null, l); o.value = v; sel.appendChild(o);
  });
}

function chargerFiches(){
  document.querySelectorAll('.carte, .kpis').forEach(function (e) { e.classList.add('rafraichit'); });
  return sb.from('enregistrements_op').select('*').order('created_at', { ascending:false }).limit(5000)
    .then(function (r) {
      if (r.error) throw r.error;
      ETAT.toutes = r.data || [];
      appliquer();
      document.querySelectorAll('.rafraichit').forEach(function (e) { e.classList.remove('rafraichit'); });
    })
    .catch(function (e) {
      $('#zoneTable').innerHTML = '';
      var d = creer('div', 'vide-etat');
      d.innerHTML = ico('alerte');
      d.appendChild(creer('p', null, 'Lecture impossible : ' + (e.message || e)));
      $('#zoneTable').appendChild(d);
    });
}

/* ═══════════════ 7. Filtres ═══════════════ */
function litFiltres(){
  var f = ETAT.filtres;
  f.du = $('#fDu').value; f.au = $('#fAu').value;
  f.province = $('#fProvince').value; f.territoire = $('#fTerritoire').value;
  f.upe = $('#fUpe').value; f.type = $('#fType').value; f.statut = $('#fStatut').value;
  f.texte = $('#fTexte').value.trim().toLowerCase();
}

function appliquer(){
  litFiltres();
  var f = ETAT.filtres, borne = null;
  if (f.jours > 0) { borne = new Date(); borne.setDate(borne.getDate() - f.jours); }

  ETAT.filtrees = ETAT.toutes.filter(function (x) {
    var d = new Date(x.created_at);
    if (borne && d < borne) return false;
    if (f.du && d < new Date(f.du + 'T00:00:00')) return false;
    if (f.au && d > new Date(f.au + 'T23:59:59')) return false;
    if (f.province   && x.geo_province   !== f.province) return false;
    if (f.territoire && x.geo_territoire !== f.territoire) return false;
    if (f.upe        && x.upe_saisie     !== f.upe) return false;
    if (f.type       && x.entite_type    !== f.type) return false;
    if (f.statut     && x.statut         !== f.statut) return false;
    if (f.texte) {
      var s = [x.reference, x.entite_nom, x.responsable_nom, x.responsable_postnom,
               x.responsable_prenom, x.responsable_telephone, x.geo_village, x.geo_secteur]
              .filter(Boolean).join(' ').toLowerCase();
      if (s.indexOf(f.texte) === -1) return false;
    }
    return true;
  });

  ETAT.page = 0;
  rendreKpis(); rendreGraphes(); rendreTable();
}

['#fDu','#fAu','#fProvince','#fUpe','#fType','#fStatut'].forEach(function (s) {
  $(s).addEventListener('change', appliquer);
});
$('#fProvince').addEventListener('change', function () {
  var p = $('#fProvince').value;
  remplirSelect($('#fTerritoire'), p ? (ETAT.geo[p] || []).slice().sort() : [], 'Tous');
});
$('#fTerritoire').addEventListener('change', appliquer);
var minuteur;
$('#fTexte').addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(appliquer, 220); });
$('#presets').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  Array.prototype.forEach.call(this.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
  ETAT.filtres.jours = +b.dataset.j;
  if (ETAT.filtres.jours) { $('#fDu').value = ''; $('#fAu').value = ''; }
  appliquer();
});
$('#btnRaz').addEventListener('click', function () {
  ['#fDu','#fAu','#fProvince','#fTerritoire','#fUpe','#fType','#fStatut','#fTexte'].forEach(function (s) { $(s).value = ''; });
  Array.prototype.forEach.call($('#presets').children, function (x) { x.setAttribute('aria-pressed', x.dataset.j === '0' ? 'true' : 'false'); });
  ETAT.filtres.jours = 0; appliquer();
});
$('#btnCreerAgent').addEventListener('click', function () {
  $('#voileAgent').classList.add('on');
  $('#panneauAgent').classList.add('on');
  $('#panneauAgent').setAttribute('aria-hidden', 'false');
  $('#agentNom').focus();
});
$('#btnFermerAgent').addEventListener('click', function () {
  fermerCreationAgent();
});
$('#voileAgent').addEventListener('click', fermerCreationAgent);
function fermerCreationAgent(){
  $('#voileAgent').classList.remove('on');
  $('#panneauAgent').classList.remove('on');
  $('#panneauAgent').setAttribute('aria-hidden', 'true');
  $('#formCreerAgent').reset();
  $('#msgAgent').style.display = 'none';
  $('#msgAgent').textContent = '';
}

function sqlRattachement(email, nom, upe, role){
  return "insert into public.profils_agents (user_id, nom, upe_code, role, actif)\n"
    + "select id, '" + nom.replace(/'/g, "''") + "', '" + upe + "', '" + role + "', true\n"
    + "from auth.users\n"
    + "where email = '" + email.replace(/'/g, "''") + "'\n"
    + "on conflict (user_id) do update set\n"
    + "  nom = excluded.nom,\n"
    + "  upe_code = excluded.upe_code,\n"
    + "  role = excluded.role,\n"
    + "  actif = true;";
}

function messageAgent(txt, type){
  var m = $('#msgAgent');
  m.textContent = txt;
  m.className = 'msg ' + (type === 'ok' ? 'ok' : 'err') + ' on';
  m.style.display = 'flex';
}

$('#formCreerAgent').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!client()) {
    messageAgent('Configuration Supabase absente — vérifiez le fichier de config.', 'err');
    return;
  }

  var nom = $('#agentNom').value.trim();
  var email = $('#agentEmail').value.trim();
  var password = $('#agentPassword').value;
  var upe = $('#agentUpe').value;
  var role = $('#agentRole').value;

  if (!email || !password || !upe) {
    messageAgent('Renseignez le nom, l’e-mail, le mot de passe et l’UPE.', 'err');
    return;
  }

  var btn = $('#btnSubmitAgent');
  btn.disabled = true;
  btn.textContent = 'Création…';

  // La création passe par l'Edge Function « creer-agent » : elle seule détient
  // la clé service_role, et elle vérifie que l'appelant relève bien de la
  // Coordination avant d'agir. Appeler auth.admin.createUser depuis ici
  // supposerait de publier cette clé dans le navigateur — elle contourne toute
  // la RLS, ce serait un accès total aux données bénéficiaires.
  try {
    var r = await sb.functions.invoke('creer-agent', {
      body: { nom: nom, email: email, password: password, upe: upe, role: role }
    });

    // supabase-js range le corps de la réponse d'erreur dans context : sans
    // cela on n'afficherait que « Edge Function returned a non-2xx status code ».
    var detail = null, statut = null;
    if (r.error && r.error.context) {
      statut = r.error.context.status || null;
      if (typeof r.error.context.json === 'function') {
        try { detail = await r.error.context.json(); } catch (e) { detail = null; }
      }
    }
    if (r.error) {
      var e2 = new Error((detail && detail.erreur) || r.error.message);
      e2.statut = statut;   // 404 = fonction absente, à distinguer d'un refus métier
      throw e2;
    }
    if (r.data && r.data.erreur) throw new Error(r.data.erreur);

    $('#agentPassword').value = '';
    messageAgent((r.data && r.data.message) || 'Compte créé et rattaché à l’UPE.', 'ok');
    setTimeout(fermerCreationAgent, 2200);
  } catch (err) {
    var msg = (err && err.message) || 'Erreur inconnue.';
    // 404 ou échec réseau = la fonction n'est pas déployée ; tout le reste est
    // une réponse métier de la fonction, qu'on affiche telle quelle.
    var deployee = (err && err.statut !== 404)
                && !/Failed to send|Failed to fetch|NetworkError/i.test(msg);
    messageAgent(
      deployee
        ? msg
        : "La fonction « creer-agent » ne répond pas — elle n'est probablement pas encore déployée "
          + "(supabase functions deploy creer-agent).\n\nEn attendant, créez le compte dans "
          + "Supabase → Authentication → Users, puis exécutez ce SQL :\n\n"
          + sqlRattachement(email, nom || email.split('@')[0], upe, role),
      'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Créer le compte';
  }
});

$('#btnCopierSql').addEventListener('click', function () {
  var email = $('#agentEmail').value.trim();
  var nom = $('#agentNom').value.trim();
  var upe = $('#agentUpe').value;
  var role = $('#agentRole').value;
  if (!email || !upe) {
    messageAgent('Renseignez au moins l’e-mail et l’UPE pour générer le SQL.', 'err');
    return;
  }
  var sql = sqlRattachement(email, nom || email.split('@')[0], upe, role);
  navigator.clipboard.writeText(sql).then(function () {
    messageAgent('SQL copié dans le presse-papiers.', 'ok');
  }).catch(function () {
    messageAgent('Copie impossible dans ce navigateur. Copiez ce SQL manuellement :\n\n' + sql, 'err');
  });
});
$('#btnActualiser').addEventListener('click', chargerFiches);
$('#btnImprimer').addEventListener('click', function () { window.print(); });

/* ═══════════════ 8. Indicateurs ═══════════════ */
function rendreKpis(){
  var d = ETAT.filtrees;
  var membres = 0, femmes = 0, hommes = 0, banque = 0, besoin = 0, stock = 0, valides = 0, respF = 0;
  d.forEach(function (x) {
    membres += x.nbr_membres || 0; femmes += x.nbr_femmes || 0; hommes += x.nbr_hommes || 0;
    if (x.compte_bancaire) banque++;
    besoin += x.besoin_estime_cents || 0;
    stock  += (+x.stock_mais_kg || 0) + (+x.stock_soja_kg || 0) + (+x.stock_mucuna_kg || 0);
    if (x.statut === 'valide') valides++;
    if (x.responsable_sexe === 'F') respF++;
  });

  var tuiles = [
    { ic:'clip',   c:'#7AC143', lb:'Fiches reçues', v:n0(d.length),
      sub: valides + ' validée' + (valides > 1 ? 's' : '') + ' · ' + pct(valides, d.length) + ' %' },
    { ic:'users',  c:'#008B8B', lb:'Membres recensés', v:n0(membres),
      sub: d.length ? 'moyenne ' + n1(membres / d.length) + ' par structure' : '—' },
    { ic:'female', c:'#D91B5C', lb:'Taux de féminisation', v:pct(femmes, femmes + hommes) + ' %',
      sub: n0(femmes) + ' femmes sur ' + n0(femmes + hommes) + ' membres genrés' },
    { ic:'user',   c:'#92278F', lb:'Direction féminine', v:pct(respF, d.length) + ' %',
      sub: n0(respF) + ' structure' + (respF > 1 ? 's' : '') + ' dirigée' + (respF > 1 ? 's' : '') + ' par une femme' },
    { ic:'bank',   c:'#F5A623', lb:'Structures bancarisées', v:pct(banque, d.length) + ' %',
      sub: n0(banque) + ' avec compte fonctionnel' },
    { ic:'wallet', c:'#F26522', lb:"Besoin d'investissement", v:usd(besoin),
      sub: d.length ? 'moyenne ' + usd(besoin / d.length) + ' par structure' : '—' },
    { ic:'box',    c:'#3480fc', lb:'Stock semencier déclaré', v:n0(stock) + ' kg',
      sub:'maïs + soja + mucuna' }
  ];

  var h = $('#kpis'); h.innerHTML = '';
  tuiles.forEach(function (t, i) {
    var e = creer('div', 'kpi');
    e.style.setProperty('--c', t.c);
    e.style.animationDelay = (i * 35) + 'ms';
    var lb = creer('div', 'lb'); lb.innerHTML = ico(t.ic); lb.appendChild(creer('span', null, t.lb));
    e.appendChild(lb);
    e.appendChild(creer('div', 'v', t.v));
    e.appendChild(creer('div', 'sub', t.sub));
    h.appendChild(e);
  });
}

/* ═══════════════ 9. Primitives graphiques (SVG, sans dépendance) ═══════════════ */
var TT = $('#tooltip');
function bulle(html, ev){
  TT.innerHTML = html;
  TT.classList.add('on');
  var r = TT.getBoundingClientRect();
  var x = Math.min(ev.clientX + 14, window.innerWidth - r.width - 10);
  var y = Math.max(10, Math.min(ev.clientY - r.height - 12, window.innerHeight - r.height - 10));
  TT.style.left = x + 'px'; TT.style.top = y + 'px';
}
function cacheBulle(){ TT.classList.remove('on'); }
function ligneTT(couleur, nom, valeur){
  return '<div class="r"><i style="background:' + couleur + '"></i>'
       + '<b>' + valeur + '</b><span>' + echapper(nom) + '</span></div>';
}
function echapper(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

/** Échelle « ronde » : 4 à 5 graduations lisibles. */
function graduations(max){
  if (max <= 0) return { max:1, pas:1, ticks:[0,1] };
  var brut = max / 4, mag = Math.pow(10, Math.floor(Math.log10(brut)));
  var pas = [1,2,2.5,5,10].map(function (m) { return m * mag; }).find(function (p) { return p >= brut; }) || mag * 10;
  var haut = Math.ceil(max / pas) * pas, t = [];
  for (var v = 0; v <= haut + 1e-9; v += pas) t.push(v);
  return { max:haut, pas:pas, ticks:t };
}

/** Barre à extrémité arrondie 4 px, ancrée sur la ligne de base. */
function cheminBarre(x, y, w, h, r, horizontal){
  r = Math.max(0, Math.min(r, horizontal ? Math.min(w, h/2) : Math.min(h, w/2)));
  if (h <= 0 || w <= 0) return '';
  if (!horizontal) {
    return 'M' + x + ',' + (y+h) + ' V' + (y+r) + ' Q' + x + ',' + y + ' ' + (x+r) + ',' + y
         + ' H' + (x+w-r) + ' Q' + (x+w) + ',' + y + ' ' + (x+w) + ',' + (y+r) + ' V' + (y+h) + ' Z';
  }
  return 'M' + x + ',' + y + ' H' + (x+w-r) + ' Q' + (x+w) + ',' + y + ' ' + (x+w) + ',' + (y+r)
       + ' V' + (y+h-r) + ' Q' + (x+w) + ',' + (y+h) + ' ' + (x+w-r) + ',' + (y+h) + ' H' + x + ' Z';
}

var SVGNS = 'http://www.w3.org/2000/svg';
function el(t, a){
  var e = document.createElementNS(SVGNS, t);
  for (var k in a) if (a[k] !== null && a[k] !== undefined) e.setAttribute(k, a[k]);
  return e;
}

/**
 * Carte de graphique : en-tête, légende (dès 2 séries), SVG et jumeau tabulaire.
 * Le jumeau garantit que toute valeur reste lisible sans survol ni couleur.
 */
function carte(hote, o){
  hote.style.setProperty('--c', o.couleur);
  hote.style.setProperty('--tint', o.teinte || 'rgba(122,193,67,.12)');
  hote.innerHTML = '';
  var tete = creer('div', 'carte-tete');
  var ic = creer('div', 'ic'); ic.innerHTML = ico(o.icone); tete.appendChild(ic);
  var bloc = creer('div');
  bloc.appendChild(creer('h2', null, o.titre));
  bloc.appendChild(creer('small', null, o.sous));
  tete.appendChild(bloc);
  var fin = creer('div', 'fin');
  var bt = creer('button', 'btn sm ghost', 'Tableau');
  fin.appendChild(bt); tete.appendChild(fin);
  hote.appendChild(tete);

  var corps = creer('div', 'carte-corps');
  if (o.legende && o.legende.length > 1) {
    var lg = creer('div', 'legende');
    o.legende.forEach(function (s) {
      var e = creer('span');
      var i = creer('i', s.trait ? 'trait' : null); i.style.background = s.couleur;
      e.appendChild(i); e.appendChild(creer('span', null, s.nom));
      lg.appendChild(e);
    });
    corps.appendChild(lg);
  }
  var zoneSvg = creer('div'); corps.appendChild(zoneSvg);
  var jumeau = creer('div', 'jumeau'); corps.appendChild(jumeau);
  hote.appendChild(corps);

  bt.addEventListener('click', function () {
    var on = jumeau.classList.toggle('on');
    zoneSvg.style.display = on ? 'none' : '';
    bt.textContent = on ? 'Graphique' : 'Tableau';
  });
  return { svg: zoneSvg, jumeau: jumeau };
}

function remplirJumeau(hote, entetes, lignes){
  hote.innerHTML = '';
  if (!lignes.length) { hote.appendChild(creer('p', null, 'Aucune donnée.')); return; }
  var t = creer('table'), thead = creer('thead'), tr = creer('tr');
  entetes.forEach(function (h) { tr.appendChild(creer('th', null, h)); });
  thead.appendChild(tr); t.appendChild(thead);
  var tb = creer('tbody');
  lignes.forEach(function (l) {
    var r = creer('tr');
    l.forEach(function (c) { r.appendChild(creer('td', null, c)); });
    tb.appendChild(r);
  });
  t.appendChild(tb); hote.appendChild(t);
}

function messageVide(hote){
  hote.innerHTML = '';
  var d = creer('div', 'vide-etat');
  d.innerHTML = ico('vide');
  d.appendChild(creer('p', null, 'Aucune fiche pour ce filtre.'));
  hote.appendChild(d);
}

/**
 * Barres verticales — série unique (une seule couleur) ou séries empilées /
 * groupées (palette catégorielle + légende).
 */
function grapheBarres(zone, cfg){
  zone.innerHTML = '';
  var L = zone.clientWidth || 460;
  if (!cfg.categories.length) { messageVide(zone); return; }

  var mg = { h:14, d:12, b:38, g:46 };
  var H = cfg.hauteur || 250;
  var pw = L - mg.g - mg.d, ph = H - mg.h - mg.b;

  var totaux = cfg.categories.map(function (_, i) {
    return cfg.empile ? cfg.series.reduce(function (s, se) { return s + (se.valeurs[i] || 0); }, 0)
                      : Math.max.apply(null, cfg.series.map(function (se) { return se.valeurs[i] || 0; }));
  });
  var ech = graduations(Math.max.apply(null, totaux.concat([0])));
  var y = function (v) { return mg.h + ph - (v / ech.max) * ph; };

  var svg = el('svg', { class:'viz', width:L, height:H, viewBox:'0 0 ' + L + ' ' + H });

  ech.ticks.forEach(function (t) {
    svg.appendChild(el('line', { class:'grid', x1:mg.g, x2:L - mg.d, y1:y(t), y2:y(t) }));
    var tx = el('text', { class:'tick', x:mg.g - 8, y:y(t) + 4, 'text-anchor':'end' });
    tx.textContent = n0(t); svg.appendChild(tx);
  });
  svg.appendChild(el('line', { class:'axe', x1:mg.g, x2:L - mg.d, y1:y(0), y2:y(0) }));

  var pas = pw / cfg.categories.length;
  var GAP = 2;                                   // écart de surface entre remplissages
  var lgBloc = Math.min(pas - 16, 64);
  var multi = !cfg.empile && cfg.series.length > 1;

  cfg.categories.forEach(function (cat, i) {
    var x0 = mg.g + i * pas + (pas - lgBloc) / 2;

    if (cfg.empile) {
      var cum = 0;
      cfg.series.forEach(function (se, k) {
        var v = se.valeurs[i] || 0; if (!v) return;
        var hb = (v / ech.max) * ph;
        var yb = y(cum + v);
        var dernier = !cfg.series.slice(k + 1).some(function (s2) { return (s2.valeurs[i] || 0) > 0; });
        var hh = Math.max(1, hb - GAP);
        var p = el('path', { class:'mark', d:cheminBarre(x0, yb, lgBloc, hh, dernier ? 4 : 0, false), fill:se.couleur });
        svg.appendChild(p);
        zoneSurvol(svg, x0, yb, lgBloc, hh, cat, cfg.series, i, cfg.unite);
        cum += v;
      });
      var tot = totaux[i];
      if (tot > 0) {
        var lt = el('text', { class:'lbl', x:x0 + lgBloc / 2, y:y(tot) - 7, 'text-anchor':'middle' });
        lt.textContent = n0(tot); svg.appendChild(lt);
      }
    } else {
      var lgU = multi ? (lgBloc - GAP * (cfg.series.length - 1)) / cfg.series.length : lgBloc;
      cfg.series.forEach(function (se, k) {
        var v = se.valeurs[i] || 0;
        var hb = Math.max(v > 0 ? 2 : 0, (v / ech.max) * ph);
        var xb = x0 + k * (lgU + GAP);
        if (hb > 0) svg.appendChild(el('path', {
          class:'mark', d:cheminBarre(xb, y(v), lgU, hb, 4, false), fill:se.couleur }));
        zoneSurvol(svg, xb, y(v), lgU, hb, cat, cfg.series, i, cfg.unite);
        // étiquette directe seulement si elle tient sous la barre
        if (!multi && v > 0 && lgU >= 26) {
          var t2 = el('text', { class:'lbl', x:xb + lgU / 2, y:y(v) - 7, 'text-anchor':'middle' });
          t2.textContent = n0(v); svg.appendChild(t2);
        }
      });
    }

    var tc = el('text', { class:'cat', x:mg.g + i * pas + pas / 2, y:H - mg.b + 20, 'text-anchor':'middle' });
    tc.textContent = cat.length > 15 ? cat.slice(0, 14) + '…' : cat;
    var ti = el('title'); ti.textContent = cat; tc.appendChild(ti);
    svg.appendChild(tc);
  });

  zone.appendChild(svg);
}

/** Zone de survol : au moins 24 px de large, marge de 2 px autour de la marque. */
function zoneSurvol(svg, x, y, w, h, cat, series, i, unite){
  var lw = Math.max(w + 4, 24), lx = x + w / 2 - lw / 2;
  var z = el('rect', { class:'zone', x:lx, y:0, width:lw, height:+svg.getAttribute('height'), tabindex:'0' });
  var contenu = '<div class="t">' + echapper(cat) + '</div>'
    + series.map(function (s) {
        return ligneTT(s.couleur, s.nom, n0(s.valeurs[i] || 0) + (unite ? ' ' + unite : ''));
      }).join('');
  z.addEventListener('pointermove', function (e) { bulle(contenu, e); });
  z.addEventListener('pointerleave', cacheBulle);
  z.addEventListener('focus', function (e) {
    var r = z.getBoundingClientRect();
    bulle(contenu, { clientX:r.left + r.width / 2, clientY:r.top + 40 });
  });
  z.addEventListener('blur', cacheBulle);
  svg.appendChild(z);
}

/** Barres horizontales — toujours une série unique. */
function grapheBarresH(zone, cfg){
  zone.innerHTML = '';
  var L = zone.clientWidth || 460;
  if (!cfg.lignes.length) { messageVide(zone); return; }
  var lignes = cfg.lignes.slice(0, 10);
  var hL = 30, H = lignes.length * hL + 24;
  var gauche = 118, droite = 54;
  var max = Math.max.apply(null, lignes.map(function (l) { return l.v; }).concat([1]));
  var svg = el('svg', { class:'viz', width:L, height:H, viewBox:'0 0 ' + L + ' ' + H });
  var pw = L - gauche - droite;

  lignes.forEach(function (l, i) {
    var y = 10 + i * hL, hb = 15;
    var w = Math.max(l.v > 0 ? 2 : 0, (l.v / max) * pw);
    var tc = el('text', { class:'cat', x:gauche - 10, y:y + 12, 'text-anchor':'end' });
    tc.textContent = l.k.length > 16 ? l.k.slice(0, 15) + '…' : l.k;
    var ti = el('title'); ti.textContent = l.k; tc.appendChild(ti); svg.appendChild(tc);
    if (w > 0) svg.appendChild(el('path', {
      class:'mark', d:cheminBarre(gauche, y, w, hb, 4, true), fill:cfg.couleur || SOLO }));
    var tv = el('text', { class:'lbl', x:gauche + w + 8, y:y + 12 });
    tv.textContent = n0(l.v) + (cfg.unite ? ' ' + cfg.unite : ''); svg.appendChild(tv);

    var z = el('rect', { class:'zone', x:0, y:y - 6, width:L, height:Math.max(hb + 12, 24), tabindex:'0' });
    var c = '<div class="t">' + echapper(l.k) + '</div>'
          + ligneTT(cfg.couleur || SOLO, cfg.serie || 'Fiches', n0(l.v) + (cfg.unite ? ' ' + cfg.unite : ''));
    z.addEventListener('pointermove', function (e) { bulle(c, e); });
    z.addEventListener('pointerleave', cacheBulle);
    z.addEventListener('focus', function () { var r = z.getBoundingClientRect(); bulle(c, { clientX:r.left + 200, clientY:r.top + 30 }); });
    z.addEventListener('blur', cacheBulle);
    svg.appendChild(z);
  });
  zone.appendChild(svg);
}

/** Courbe temporelle — série unique, réticule vertical qui accroche la date. */
function grapheTemps(zone, cfg){
  zone.innerHTML = '';
  var L = zone.clientWidth || 460;
  if (cfg.points.length < 2) { messageVide(zone); return; }
  var mg = { h:14, d:16, b:34, g:46 }, H = 250;
  var pw = L - mg.g - mg.d, ph = H - mg.h - mg.b;
  var ech = graduations(Math.max.apply(null, cfg.points.map(function (p) { return p.y; })));
  var X = function (i) { return mg.g + (cfg.points.length === 1 ? pw / 2 : i / (cfg.points.length - 1) * pw); };
  var Y = function (v) { return mg.h + ph - (v / ech.max) * ph; };

  var svg = el('svg', { class:'viz', width:L, height:H, viewBox:'0 0 ' + L + ' ' + H });
  var defs = el('defs');
  var g = el('linearGradient', { id:'gAire', x1:'0', y1:'0', x2:'0', y2:'1' });
  g.appendChild(el('stop', { offset:'0%', 'stop-color':SOLO, 'stop-opacity':'.42' }));
  g.appendChild(el('stop', { offset:'100%', 'stop-color':SOLO, 'stop-opacity':'0' }));
  defs.appendChild(g); svg.appendChild(defs);

  ech.ticks.forEach(function (t) {
    svg.appendChild(el('line', { class:'grid', x1:mg.g, x2:L - mg.d, y1:Y(t), y2:Y(t) }));
    var tx = el('text', { class:'tick', x:mg.g - 8, y:Y(t) + 4, 'text-anchor':'end' });
    tx.textContent = n0(t); svg.appendChild(tx);
  });
  svg.appendChild(el('line', { class:'axe', x1:mg.g, x2:L - mg.d, y1:Y(0), y2:Y(0) }));

  var d = cfg.points.map(function (p, i) { return (i ? 'L' : 'M') + X(i) + ',' + Y(p.y); }).join(' ');
  svg.appendChild(el('path', { d:d + ' L' + X(cfg.points.length - 1) + ',' + Y(0) + ' L' + X(0) + ',' + Y(0) + ' Z',
                               fill:'url(#gAire)' }));
  svg.appendChild(el('path', { d:d, fill:'none', stroke:SOLO, 'stroke-width':2,
                               'stroke-linejoin':'round', 'stroke-linecap':'round' }));

  // Graduations de dates : on garde la dernière, puis on retire en remontant
  // toute étiquette trop proche de la précédente — sinon « 03 août » et
  // « 17 août » se chevauchent en bout d'axe.
  var ECART = 62;
  var dernier = cfg.points.length - 1;
  var gardes = [dernier];
  for (var i = dernier - 1; i >= 0; i--) {
    if (X(gardes[gardes.length - 1]) - X(i) >= ECART) gardes.push(i);
  }
  gardes.forEach(function (i) {
    var t = el('text', { class:'tick', x:X(i), y:H - mg.b + 20, 'text-anchor':'middle' });
    t.textContent = cfg.points[i].lbl; svg.appendChild(t);
  });

  // point final direct-labellisé — jamais un chiffre sur chaque point
  var der = cfg.points[cfg.points.length - 1];
  svg.appendChild(el('circle', { cx:X(cfg.points.length - 1), cy:Y(der.y), r:4.5, fill:SOLO,
                                 stroke:'var(--viz-surface)', 'stroke-width':2 }));

  var reticule = el('line', { x1:0, x2:0, y1:mg.h, y2:mg.h + ph, stroke:'rgba(255,255,255,.35)',
                              'stroke-width':1, opacity:0 });
  var pastille = el('circle', { r:5, fill:SOLO, stroke:'var(--viz-surface)', 'stroke-width':2, opacity:0 });
  svg.appendChild(reticule); svg.appendChild(pastille);

  var capt = el('rect', { x:mg.g, y:mg.h, width:pw, height:ph, fill:'transparent', style:'cursor:crosshair' });
  capt.addEventListener('pointermove', function (e) {
    var b = svg.getBoundingClientRect();
    var rel = (e.clientX - b.left - mg.g) / pw;
    var i = Math.max(0, Math.min(cfg.points.length - 1, Math.round(rel * (cfg.points.length - 1))));
    var p = cfg.points[i];
    reticule.setAttribute('x1', X(i)); reticule.setAttribute('x2', X(i)); reticule.setAttribute('opacity', 1);
    pastille.setAttribute('cx', X(i)); pastille.setAttribute('cy', Y(p.y)); pastille.setAttribute('opacity', 1);
    bulle('<div class="t">' + echapper(p.titre) + '</div>' + ligneTT(SOLO, cfg.serie, n0(p.y)), e);
  });
  capt.addEventListener('pointerleave', function () {
    reticule.setAttribute('opacity', 0); pastille.setAttribute('opacity', 0); cacheBulle();
  });
  svg.appendChild(capt);
  zone.appendChild(svg);
}

/** Statuts — barre segmentée, couleur réservée + icône + mot. */
function grapheStatuts(zone, jumeau, comptes, total){
  zone.innerHTML = '';
  if (!total) { messageVide(zone); return; }
  var L = zone.clientWidth || 460, H = 34, GAP = 2;
  var svg = el('svg', { class:'viz', width:L, height:H, viewBox:'0 0 ' + L + ' ' + H });
  var cles = Object.keys(STATUTS).filter(function (k) { return comptes[k]; });
  var x = 0;
  cles.forEach(function (k, i) {
    var w = Math.max(3, comptes[k] / total * L - (i < cles.length - 1 ? GAP : 0));
    svg.appendChild(el('path', {
      class:'mark',
      d: cheminBarre(x, 4, w, 24, i === 0 || i === cles.length - 1 ? 4 : 0, true),
      fill: STATUTS[k].col
    }));
    var z = el('rect', { class:'zone', x:x, y:0, width:Math.max(w, 24), height:H, tabindex:'0' });
    var c = '<div class="t">' + echapper(STATUTS[k].lbl) + '</div>'
          + ligneTT(STATUTS[k].col, 'fiches', n0(comptes[k]) + ' · ' + pct(comptes[k], total) + ' %');
    z.addEventListener('pointermove', function (e) { bulle(c, e); });
    z.addEventListener('pointerleave', cacheBulle);
    svg.appendChild(z);
    x += w + GAP;
  });
  zone.appendChild(svg);

  var lst = creer('div');
  lst.style.cssText = 'display:flex;flex-wrap:wrap;gap:9px;margin-top:15px';
  Object.keys(STATUTS).forEach(function (k) {
    var p = creer('span', 'puce ' + k);
    p.innerHTML = ico(STATUTS[k].ic);
    p.appendChild(creer('span', null, STATUTS[k].lbl + ' · ' + n0(comptes[k] || 0)));
    lst.appendChild(p);
  });
  zone.appendChild(lst);

  remplirJumeau(jumeau, ['Statut', 'Fiches', 'Part'],
    Object.keys(STATUTS).map(function (k) {
      return [STATUTS[k].lbl, n0(comptes[k] || 0), pct(comptes[k] || 0, total) + ' %'];
    }));
}

/* ═══════════════ 10. Agrégations & rendu des graphiques ═══════════════ */
function grouper(rows, cle){
  var m = {};
  rows.forEach(function (r) { var k = cle(r) || 'Non renseigné'; m[k] = (m[k] || 0) + 1; });
  return m;
}
function versLignes(m){
  return Object.keys(m).map(function (k) { return { k:k, v:m[k] }; })
    .sort(function (a, b) { return b.v - a.v; });
}

function rendreGraphes(){
  lirePalette();
  var d = ETAT.filtrees;

  /* A — fiches par province : une seule série, donc une seule couleur */
  (function () {
    var c = carte($('#cFiches'), { titre:'Fiches par province', sous:'Répartition géographique des enregistrements',
      icone:'pin', couleur:'#7AC143', teinte:'rgba(122,193,67,.14)' });
    var m = grouper(d, function (r) { return r.geo_province; });
    var cats = Object.keys(m).sort();
    grapheBarres(c.svg, { categories:cats, series:[{ nom:'Fiches', couleur:SOLO, valeurs:cats.map(function (k) { return m[k]; }) }] });
    remplirJumeau(c.jumeau, ['Province', 'Fiches'], cats.map(function (k) { return [k, n0(m[k])]; }));
  })();

  /* C — soumissions dans le temps : une seule série, réticule */
  (function () {
    var c = carte($('#cTemps'), { titre:'Soumissions dans le temps', sous:'Volume de fiches reçues par période',
      icone:'clock', couleur:'#008B8B', teinte:'rgba(0,139,139,.14)' });
    var parJour = {};
    d.forEach(function (r) { var k = (r.created_at || '').slice(0, 10); if (k) parJour[k] = (parJour[k] || 0) + 1; });
    var cles = Object.keys(parJour).sort();
    var groupeParSemaine = cles.length > 45;
    var pts = [];
    if (groupeParSemaine) {
      var sem = {};
      cles.forEach(function (k) {
        var dt = new Date(k); dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
        var ks = dt.toISOString().slice(0, 10);
        sem[ks] = (sem[ks] || 0) + parJour[k];
      });
      pts = Object.keys(sem).sort().map(function (k) {
        return { y:sem[k], lbl:new Date(k).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }),
                 titre:'Semaine du ' + new Date(k).toLocaleDateString('fr-FR') };
      });
    } else {
      pts = cles.map(function (k) {
        return { y:parJour[k], lbl:new Date(k).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }),
                 titre:new Date(k).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) };
      });
    }
    grapheTemps(c.svg, { points:pts, serie:groupeParSemaine ? 'Fiches / semaine' : 'Fiches / jour' });
    remplirJumeau(c.jumeau, [groupeParSemaine ? 'Semaine' : 'Jour', 'Fiches'],
      pts.map(function (p) { return [p.titre, n0(p.y)]; }));
  })();

  /* B — type d'entité par province : 4 séries empilées, légende obligatoire */
  (function () {
    var cles = Object.keys(TYPES);
    var legende = cles.map(function (t, i) { return { nom:TYPES[t], couleur:SERIE[i] }; });
    var c = carte($('#cType'), { titre:"Type d'entité par province", sous:'Structure juridique des bénéficiaires',
      icone:'brief', couleur:'#92278F', teinte:'rgba(146,39,143,.14)', legende:legende });
    var provs = Array.from(new Set(d.map(function (r) { return r.geo_province || 'Non renseigné'; }))).sort();
    var series = cles.map(function (t, i) {
      return { nom:TYPES[t], couleur:SERIE[i],
               valeurs:provs.map(function (p) {
                 return d.filter(function (r) { return (r.geo_province || 'Non renseigné') === p && r.entite_type === t; }).length;
               }) };
    });
    grapheBarres(c.svg, { categories:provs, series:series, empile:true });
    remplirJumeau(c.jumeau, ['Province'].concat(cles.map(function (t) { return TYPES[t]; })).concat(['Total']),
      provs.map(function (p, i) {
        var vals = series.map(function (s) { return s.valeurs[i]; });
        return [p].concat(vals.map(n0)).concat([n0(vals.reduce(function (a, b) { return a + b; }, 0))]);
      }));
  })();

  /* D — membres par sexe : 2 séries groupées */
  (function () {
    var legende = [{ nom:'Femmes', couleur:SERIE[0] }, { nom:'Hommes', couleur:SERIE[1] }];
    var c = carte($('#cSexe'), { titre:'Membres par sexe et province', sous:'Effectifs déclarés dans les fiches',
      icone:'users', couleur:'#D91B5C', teinte:'rgba(217,27,92,.14)', legende:legende });
    var provs = Array.from(new Set(d.map(function (r) { return r.geo_province || 'Non renseigné'; }))).sort();
    var som = function (p, ch) {
      return d.filter(function (r) { return (r.geo_province || 'Non renseigné') === p; })
              .reduce(function (s, r) { return s + (r[ch] || 0); }, 0);
    };
    var series = [
      { nom:'Femmes', couleur:SERIE[0], valeurs:provs.map(function (p) { return som(p, 'nbr_femmes'); }) },
      { nom:'Hommes', couleur:SERIE[1], valeurs:provs.map(function (p) { return som(p, 'nbr_hommes'); }) }
    ];
    grapheBarres(c.svg, { categories:provs, series:series, unite:'membres' });
    remplirJumeau(c.jumeau, ['Province', 'Femmes', 'Hommes', '% femmes'],
      provs.map(function (p, i) {
        var f = series[0].valeurs[i], h = series[1].valeurs[i];
        return [p, n0(f), n0(h), pct(f, f + h) + ' %'];
      }));
  })();

  /* E — filières : série unique, barres horizontales */
  (function () {
    var c = carte($('#cFilieres'), { titre:'Filières exploitées', sous:'Nombre de structures par filière déclarée',
      icone:'sprout', couleur:'#F5A623', teinte:'rgba(245,166,35,.14)' });
    var m = {};
    d.forEach(function (r) { (r.filieres || []).forEach(function (f) { m[f] = (m[f] || 0) + 1; }); });
    var lignes = versLignes(m);
    // au-delà de 10 filières on replie la queue, on ne fabrique jamais de couleur
    if (lignes.length > 10) {
      var reste = lignes.slice(9).reduce(function (s, l) { return s + l.v; }, 0);
      lignes = lignes.slice(0, 9).concat([{ k:'Autres filières', v:reste }]);
    }
    grapheBarresH(c.svg, { lignes:lignes, serie:'Structures', unite:'' });
    remplirJumeau(c.jumeau, ['Filière', 'Structures'], lignes.map(function (l) { return [l.k, n0(l.v)]; }));
  })();

  /* F — statuts */
  (function () {
    var c = carte($('#cStatuts'), { titre:'Statut des fiches', sous:"État d'avancement de la vérification",
      icone:'shield', couleur:'#F26522', teinte:'rgba(242,101,34,.14)' });
    var comptes = {};
    d.forEach(function (r) { comptes[r.statut] = (comptes[r.statut] || 0) + 1; });
    grapheStatuts(c.svg, c.jumeau, comptes, d.length);
  })();
}

/* ═══════════════ 11. Tableau des fiches ═══════════════ */
var COLONNES = [
  { k:'reference',      t:'Référence',  txt:1, f:function (r) { return r.reference; } },
  { k:'created_at',     t:'Reçue le',   txt:0, f:function (r) { return dateFr(r.created_at); } },
  { k:'entite_nom',     t:'Structure',  txt:1, f:function (r) { return r.entite_nom; } },
  { k:'entite_type',    t:'Type',       txt:1, f:function (r) { return TYPES[r.entite_type]; } },
  { k:'geo_province',   t:'Province',   txt:1, f:function (r) { return r.geo_province; } },
  { k:'geo_territoire', t:'Territoire', txt:1, f:function (r) { return r.geo_territoire; } },
  { k:'nbr_membres',    t:'Membres',    txt:0, f:function (r) { return r.nbr_membres == null ? '—' : n0(r.nbr_membres); } },
  { k:'pctF',           t:'% femmes',   txt:0, f:function (r) {
      var f = r.nbr_femmes || 0, h = r.nbr_hommes || 0; return (f + h) ? pct(f, f + h) + ' %' : '—'; } },
  { k:'compte_bancaire',t:'Compte',     txt:1, f:function (r) { return r.compte_bancaire ? 'Oui' : 'Non'; } },
  { k:'statut',         t:'Statut',     txt:1, f:null }
];

function valeurTri(r, k){
  if (k === 'pctF') { var f = r.nbr_femmes || 0, h = r.nbr_hommes || 0; return (f + h) ? f / (f + h) : -1; }
  if (k === 'compte_bancaire') return r.compte_bancaire ? 1 : 0;
  var v = r[k];
  if (v === null || v === undefined) return '';
  return typeof v === 'number' ? v : String(v).toLowerCase();
}

function rendreTable(){
  var d = ETAT.filtrees.slice().sort(function (a, b) {
    var va = valeurTri(a, ETAT.tri.col), vb = valeurTri(b, ETAT.tri.col);
    return va < vb ? -ETAT.tri.sens : va > vb ? ETAT.tri.sens : 0;
  });
  $('#sousTable').textContent = n0(d.length) + ' fiche' + (d.length > 1 ? 's' : '')
    + ' sur ' + n0(ETAT.toutes.length) + ' visibles dans votre périmètre';

  var zone = $('#zoneTable'); zone.innerHTML = '';
  if (!d.length) { messageVide(zone); $('#pagination').hidden = true; return; }

  var pages = Math.ceil(d.length / ETAT.parPage);
  ETAT.page = Math.min(ETAT.page, pages - 1);
  var vue = d.slice(ETAT.page * ETAT.parPage, (ETAT.page + 1) * ETAT.parPage);

  var t = creer('table', 'fiches'), thead = creer('thead'), tr = creer('tr');
  COLONNES.forEach(function (c) {
    var th = creer('th', null, c.t);
    if (ETAT.tri.col === c.k) th.setAttribute('aria-sort', ETAT.tri.sens > 0 ? 'ascending' : 'descending');
    var fl = creer('span', 'fl', ETAT.tri.col === c.k ? (ETAT.tri.sens > 0 ? '▲' : '▼') : '↕');
    th.appendChild(fl);
    th.addEventListener('click', function () {
      if (ETAT.tri.col === c.k) ETAT.tri.sens *= -1;
      else { ETAT.tri.col = c.k; ETAT.tri.sens = 1; }
      rendreTable();
    });
    tr.appendChild(th);
  });
  thead.appendChild(tr); t.appendChild(thead);

  var tb = creer('tbody');
  vue.forEach(function (r) {
    var l = creer('tr');
    COLONNES.forEach(function (c) {
      var td = creer('td', c.txt ? 'txt' : null);
      if (c.k === 'statut') {
        var s = STATUTS[r.statut] || STATUTS.soumis;
        var p = creer('span', 'puce ' + r.statut);
        p.innerHTML = ico(s.ic); p.appendChild(creer('span', null, s.lbl));
        td.appendChild(p);
      } else if (c.k === 'reference') {
        td.appendChild(creer('span', 'ref', r.reference));
      } else {
        td.textContent = c.f(r) || '—';
      }
      l.appendChild(td);
    });
    l.addEventListener('click', function () { ouvrirFiche(r); });
    tb.appendChild(l);
  });
  t.appendChild(tb); zone.appendChild(t);

  $('#pagination').hidden = pages <= 1;
  $('#infoPage').textContent = 'Page ' + (ETAT.page + 1) + ' sur ' + pages
    + ' — fiches ' + (ETAT.page * ETAT.parPage + 1) + ' à ' + Math.min((ETAT.page + 1) * ETAT.parPage, d.length);
  $('#btnPrec').disabled = ETAT.page === 0;
  $('#btnSuiv').disabled = ETAT.page >= pages - 1;
}
$('#btnPrec').addEventListener('click', function () { ETAT.page--; rendreTable(); window.scrollTo({ top:document.body.scrollHeight, behavior:'smooth' }); });
$('#btnSuiv').addEventListener('click', function () { ETAT.page++; rendreTable(); window.scrollTo({ top:document.body.scrollHeight, behavior:'smooth' }); });

/* ═══════════════ 12. Panneau détail ═══════════════ */
var SECTIONS_FICHE = [
  { t:'B — Identification géographique', ic:'pin', ch:[
    ['Province','geo_province'], ['Territoire / Ville','geo_territoire'], ['Secteur / Commune','geo_secteur'],
    ['Village / Quartier','geo_village'], ['Territoire du siège','geo_commune'],
    ['Coordonnées GPS', function (r) {
      if (r.gps_lat == null && r.gps_long == null) return null;
      var c6 = function (v) { return v == null ? '—' : (+v).toFixed(6); };
      return c6(r.gps_lat) + ' ; ' + c6(r.gps_long) + (r.gps_alt != null ? ' ; ' + Math.round(r.gps_alt) + ' m' : '');
    }]
  ]},
  { t:'C — Responsable', ic:'user', ch:[
    ['Nom complet', function (r) { return [r.responsable_nom, r.responsable_postnom, r.responsable_prenom].filter(Boolean).join(' '); }],
    ['Sexe', function (r) { return r.responsable_sexe === 'F' ? 'Femme' : r.responsable_sexe === 'M' ? 'Homme' : null; }],
    ['Date de naissance', function (r) { return dateFr(r.responsable_date_naissance); }],
    ["Pièce d'identité", function (r) { return PIECES[r.responsable_type_piece]; }],
    ['Numéro de pièce','responsable_num_piece'], ['Téléphone','responsable_telephone'], ['E-mail','responsable_email']
  ]},
  { t:'D — Structure et activités', ic:'brief', ch:[
    ['Nom légal','entite_nom'], ['Type', function (r) { return TYPES[r.entite_type]; }],
    ['Patente', function (r) { return ouiNon(r.patente); }], ['N° patente','patente_no'],
    ['RCCM', function (r) { return ouiNon(r.rccm); }], ['N° RCCM','rccm_no'],
    ['Identification nationale', function (r) { return ouiNon(r.idnat); }], ['N° ID Nat','idnat_no'],
    ['Numéro d\'impôt', function (r) { return ouiNon(r.impot); }], ['N° impôt','impot_no'],
    ['Statuts notariés', function (r) { return ouiNon(r.statuts_notaries); }],
    ['Règlement d\'ordre intérieur', function (r) { return ouiNon(r.roi); }],
    ['Autorisation de fonctionnement', function (r) { return ouiNon(r.autorisation_fonctionnement); }],
    ['Membre d\'une faîtière', function (r) { return ouiNon(r.faitiere); }], ['Faîtière','faitiere_nom'],
    ['Organisme de structuration','organisme_structuration'],
    ['Date de structuration', function (r) { return dateFr(r.date_structuration); }],
    ['Visite SENASEM', function (r) { return ouiNon(r.visite_senasem); }],
    ['Dernière visite SENASEM', function (r) { return dateFr(r.date_visite_senasem); }],
    ['Dernière assemblée générale', function (r) { return dateFr(r.date_derniere_ag); }],
    ['Membres', function (r) { return r.nbr_membres == null ? null : n0(r.nbr_membres); }],
    ['Dont femmes', function (r) { return r.nbr_femmes == null ? null : n0(r.nbr_femmes); }],
    ['Dont hommes', function (r) { return r.nbr_hommes == null ? null : n0(r.nbr_hommes); }],
    ['Dont personnes à mobilité réduite', function (r) { return r.nbr_pmr == null ? null : n0(r.nbr_pmr); }],
    ['Dont personnes autochtones', function (r) { return r.nbr_autochtones == null ? null : n0(r.nbr_autochtones); }],
    ['Employés', function (r) { return r.nbr_staff == null ? null : n0(r.nbr_staff); }],
    ['À former au SIGI', function (r) { return r.nbr_staff_forme_sigi == null ? null : n0(r.nbr_staff_forme_sigi); }],
    ['Champ communautaire (ha)', function (r) { return r.superficie_champ_ha == null ? null : n1(r.superficie_champ_ha); }],
    ['Filières', function (r) { return (r.filieres || []).join(', '); }], ['Autre filière','filiere_autre'],
    ['Production dernière saison (kg)', function (r) { return r.quantite_produite_kg == null ? null : n0(r.quantite_produite_kg); }]
  ]},
  { t:'E — Informations bancaires', ic:'bank', ch:[
    ['Compte bancaire', function (r) { return ouiNon(r.compte_bancaire); }],
    ['Banque', function (r) { return BANQUES[r.banque_code] || r.banque_code; }], ['Autre banque','banque_autre'],
    ['Documents du compte', function (r) { return ouiNon(r.documents_compte); }],
    ['Numéro de compte','compte_numero'], ['Intitulé du compte','compte_intitule'], ['Code SWIFT','compte_swift']
  ]},
  { t:'F — Stocks et logistique', ic:'box', ch:[
    ['Lieu de commercialisation', function (r) { return ouiNon(r.lieu_commercialisation); }],
    ['Capacité de transport', function (r) { return ouiNon(r.capacite_transport); }],
    ['Stock maïs (kg)', function (r) { return r.stock_mais_kg == null ? null : n0(r.stock_mais_kg); }],
    ['Projection maïs (kg)', function (r) { return r.projection_mais_kg == null ? null : n0(r.projection_mais_kg); }],
    ['Stock soja (kg)', function (r) { return r.stock_soja_kg == null ? null : n0(r.stock_soja_kg); }],
    ['Projection soja (kg)', function (r) { return r.projection_soja_kg == null ? null : n0(r.projection_soja_kg); }],
    ['Stock mucuna (kg)', function (r) { return r.stock_mucuna_kg == null ? null : n0(r.stock_mucuna_kg); }],
    ['Projection mucuna (kg)', function (r) { return r.projection_mucuna_kg == null ? null : n0(r.projection_mucuna_kg); }],
    ['Parc à bois (ha)', function (r) { return r.superficie_parc_bois_ha == null ? null : n1(r.superficie_parc_bois_ha); }],
    ['Projection parc à bois (ha)', function (r) { return r.projection_parc_bois_ha == null ? null : n1(r.projection_parc_bois_ha); }]
  ]},
  { t:'G — Subvention', ic:'gift', ch:[
    ['Contrainte principale','contrainte_principale'],
    ['Besoin estimé', function (r) { return r.besoin_estime_cents == null ? null : usd(r.besoin_estime_cents); }],
    ["Nature de l'investissement",'nature_investissement']
  ]},
  { t:'H — Autres informations', ic:'clip', ch:[
    ['Fraude antérieure', function (r) { return ouiNon(r.fraude_anterieure); }],
    ['Formation SENASEM', function (r) { return ouiNon(r.formation_senasem); }],
    ['Appui PNDA antérieur', function (r) { return ouiNon(r.appui_pnda); }], ['Nature de l\'appui','appui_pnda_precision'],
    ['Déclarant','declarant_nom'], ['Fait à','declaration_lieu'],
    ['Date de déclaration', function (r) { return dateFr(r.declaration_date); }],
    ['Unité de saisie', function (r) { return UPES[r.upe_saisie] || r.upe_saisie; }]
  ]}
];

function ouvrirFiche(r){
  $('#ficheTitre').textContent = r.entite_nom || 'Fiche sans nom';
  $('#ficheRef').textContent = r.reference;
  var c = $('#ficheCorps'); c.innerHTML = '';

  // Validation en premier : c'est l'action attendue à l'ouverture
  var boite = creer('div', 'sect');
  var h4 = creer('h4'); h4.innerHTML = ico('shield'); h4.appendChild(creer('span', null, 'Vérification et validation'));
  boite.appendChild(h4);
  var vb = creer('div', 'valide-box');
  var rangee = creer('div', 'rangee');
  Object.keys(STATUTS).forEach(function (k) {
    var b = creer('button', 'btn sm' + (r.statut === k ? ' primary' : ''));
    b.dataset.statut = k;
    b.innerHTML = ico(STATUTS[k].ic); b.appendChild(creer('span', null, STATUTS[k].lbl));
    b.addEventListener('click', function () { changerStatut(r, k, ta.value, vb, rangee, trace); });
    rangee.appendChild(b);
  });
  vb.appendChild(rangee);
  var lbl = creer('label', null, 'Observations');
  lbl.style.cssText = 'display:block;font-size:.76rem;color:#94a3b8;margin-bottom:5px';
  vb.appendChild(lbl);
  var ta = creer('textarea'); ta.value = r.observations || '';
  ta.placeholder = 'Motif du rejet, pièce manquante, doublon constaté…';
  vb.appendChild(ta);
  var trace = creer('p', null, r.valide_le
    ? 'Dernière décision le ' + dateHeure(r.valide_le)
    : 'Aucune décision enregistrée pour cette fiche.');
  trace.style.cssText = 'font-size:.73rem;color:#94a3b8;margin-top:9px';
  vb.appendChild(trace);
  boite.appendChild(vb);
  c.appendChild(boite);

  // Pièces jointes — URL signée, valable 5 minutes
  if (r.document_legal_path || r.rib_path) {
    var sp = creer('div', 'sect');
    var h = creer('h4'); h.innerHTML = ico('file'); h.appendChild(creer('span', null, 'Pièces jointes'));
    sp.appendChild(h);
    [['Documents légaux', r.document_legal_path, CFG.BUCKET_DOCUMENTS],
     ["Relevé d'identité bancaire", r.rib_path, CFG.BUCKET_RIB]].forEach(function (p) {
      if (!p[1]) return;
      var d = creer('div', 'pj');
      d.innerHTML = ico('file');
      d.appendChild(creer('span', null, p[0]));
      var a = creer('a', null, 'Ouvrir'); a.href = '#'; a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function (e) {
        e.preventDefault(); a.textContent = 'Préparation…';
        sb.storage.from(p[2]).createSignedUrl(p[1], 300).then(function (res) {
          if (res.error || !res.data) { a.textContent = 'Accès refusé'; return; }
          a.textContent = 'Ouvrir'; window.open(res.data.signedUrl, '_blank', 'noopener');
        });
      });
      d.appendChild(a); sp.appendChild(d);
    });
    c.appendChild(sp);
  }

  SECTIONS_FICHE.forEach(function (s) {
    var sec = creer('div', 'sect');
    var h = creer('h4'); h.innerHTML = ico(s.ic); h.appendChild(creer('span', null, s.t));
    sec.appendChild(h);
    var dl = creer('dl');
    var vides = 0;
    s.ch.forEach(function (ch) {
      var v = typeof ch[1] === 'function' ? ch[1](r) : r[ch[1]];
      if (v === '' || v === null || v === undefined) { vides++; v = null; }
      var l = creer('div', 'lig');
      l.appendChild(creer('dt', null, ch[0]));
      l.appendChild(creer('dd', v === null ? 'vide' : null, v === null ? 'Non renseigné' : String(v)));
      dl.appendChild(l);
    });
    sec.appendChild(dl);
    c.appendChild(sec);
  });

  $('#panneau').classList.add('on');
  $('#panneau').setAttribute('aria-hidden', 'false');
  $('#voile').classList.add('on');
}

/**
 * Le panneau n'est PAS reconstruit après enregistrement : on met à jour les
 * boutons et la ligne de traçabilité sur place, pour que la confirmation reste
 * lisible. Un rendu complet effacerait le message au bout de quelques instants.
 */
function changerStatut(r, statut, observations, boite, rangee, trace){
  var ancien = boite.querySelector('.msg');
  if (ancien) ancien.remove();
  var msg = creer('div', 'msg ok on');
  msg.innerHTML = '<span class="spin"></span>';
  msg.appendChild(creer('span', null, 'Enregistrement…'));
  boite.appendChild(msg);
  Array.prototype.forEach.call(rangee.children, function (b) { b.disabled = true; });

  sb.from('enregistrements_op')
    .update({ statut: statut, observations: observations || null })
    .eq('id', r.id).select().maybeSingle()
    .then(function (res) {
      if (res.error) throw res.error;
      if (!res.data) throw new Error('Fiche hors de votre périmètre — mise à jour refusée par la base.');
      Object.assign(r, res.data);
      var i = ETAT.toutes.findIndex(function (x) { return x.id === r.id; });
      if (i > -1) ETAT.toutes[i] = Object.assign({}, ETAT.toutes[i], res.data);

      Array.prototype.forEach.call(rangee.children, function (b) {
        b.disabled = false;
        b.classList.toggle('primary', b.dataset.statut === res.data.statut);
      });
      trace.textContent = 'Dernière décision le ' + dateHeure(res.data.valide_le);
      msg.className = 'msg ok on';
      msg.innerHTML = ico('check');
      msg.appendChild(creer('span', null,
        'Statut « ' + STATUTS[statut].lbl + ' » enregistré le ' + dateHeure(res.data.valide_le) + '.'));
      appliquer();   // les compteurs et graphiques suivent, le panneau reste ouvert
    })
    .catch(function (e) {
      Array.prototype.forEach.call(rangee.children, function (b) { b.disabled = false; });
      msg.className = 'msg err on';
      msg.innerHTML = ico('alerte');
      msg.appendChild(creer('span', null, 'Échec : ' + (e.message || e)));
    });
}

function fermerFiche(){
  $('#panneau').classList.remove('on');
  $('#panneau').setAttribute('aria-hidden', 'true');
  $('#voile').classList.remove('on');
}
$('#btnFermerFiche').addEventListener('click', fermerFiche);
$('#voile').addEventListener('click', fermerFiche);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerFiche(); });

/* ═══════════════ 13. Exports ═══════════════ */
function telecharger(nom, contenu, mime){
  var url = URL.createObjectURL(new Blob([contenu], { type:mime }));
  var a = document.createElement('a'); a.href = url; a.download = nom; a.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}
function csv(lignes){
  var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
  return '﻿' + lignes.map(function (l) { return l.map(q).join(';'); }).join('\r\n');
}
var horodatage = function () { return new Date().toISOString().slice(0, 10); };

$('#btnExport').addEventListener('click', function () {
  var champs = ['reference','statut','created_at','geo_province','geo_territoire','geo_secteur','geo_village',
    'gps_lat','gps_long','responsable_nom','responsable_postnom','responsable_prenom','responsable_sexe',
    'responsable_telephone','responsable_email','entite_nom','entite_type','idnat_no','rccm_no',
    'nbr_membres','nbr_femmes','nbr_hommes','nbr_pmr','nbr_autochtones','nbr_staff','superficie_champ_ha',
    'quantite_produite_kg','compte_bancaire','banque_code','compte_numero','stock_mais_kg','projection_mais_kg',
    'stock_soja_kg','projection_soja_kg','stock_mucuna_kg','projection_mucuna_kg','superficie_parc_bois_ha',
    'contrainte_principale','nature_investissement','fraude_anterieure','formation_senasem','appui_pnda',
    'declarant_nom','declaration_lieu','declaration_date','upe_saisie','observations'];
  var lignes = [champs.concat(['filieres','besoin_estime_usd'])];
  ETAT.filtrees.forEach(function (r) {
    lignes.push(champs.map(function (c) {
      var v = r[c];
      if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
      return v;
    }).concat([(r.filieres || []).join(' | '), r.besoin_estime_cents == null ? '' : (r.besoin_estime_cents / 100)]));
  });
  telecharger('PNDA_MatchingGrant_fiches_' + horodatage() + '.csv', csv(lignes), 'text/csv;charset=utf-8');
});

$('#btnSynthese').addEventListener('click', function () {
  var m = {};
  ETAT.filtrees.forEach(function (r) {
    var k = (r.geo_province || 'Non renseignée') + '§' + (r.upe_saisie || 'non_defini');
    var a = m[k] || (m[k] = { fiches:0, membres:0, femmes:0, hommes:0, banque:0, besoin:0,
                              valide:0, mais:0, soja:0, mucuna:0, assoc:0, coop:0, entr:0, prive:0 });
    a.fiches++; a.membres += r.nbr_membres || 0; a.femmes += r.nbr_femmes || 0; a.hommes += r.nbr_hommes || 0;
    if (r.compte_bancaire) a.banque++;
    if (r.statut === 'valide') a.valide++;
    a.besoin += r.besoin_estime_cents || 0;
    a.mais += +r.stock_mais_kg || 0; a.soja += +r.stock_soja_kg || 0; a.mucuna += +r.stock_mucuna_kg || 0;
    if (r.entite_type === 'association') a.assoc++;
    if (r.entite_type === 'cooperative') a.coop++;
    if (r.entite_type === 'entreprise')  a.entr++;
    if (r.entite_type === 'prive')       a.prive++;
  });
  var l = [['Province','UPE','Fiches','Validées','Associations','Coopératives','Entreprises','Privés',
            'Membres','Femmes','Hommes','% femmes','Avec compte bancaire','% bancarisées',
            'Stock maïs (kg)','Stock soja (kg)','Stock mucuna (kg)','Besoin estimé (USD)']];
  Object.keys(m).sort().forEach(function (k) {
    var a = m[k], p = k.split('§');
    l.push([p[0], UPES[p[1]] || p[1], a.fiches, a.valide, a.assoc, a.coop, a.entr, a.prive,
            a.membres, a.femmes, a.hommes, pct(a.femmes, a.femmes + a.hommes),
            a.banque, pct(a.banque, a.fiches), a.mais, a.soja, a.mucuna, a.besoin / 100]);
  });
  telecharger('PNDA_MatchingGrant_synthese_' + horodatage() + '.csv', csv(l), 'text/csv;charset=utf-8');
});

/* ═══════════════ 14. Démarrage ═══════════════ */
$('#marqueLogin').innerHTML = LOGO;
$('#icTable').innerHTML = ico('list');
if (window.PNDA_boutonTheme) window.PNDA_boutonTheme($('#zoneTheme'), 'btn sm ghost');

// La bascule de thème change les teintes des marques : on redessine.
window.addEventListener('pnda:theme', function () {
  if (!$('#app').hidden) rendreGraphes();
});

var redim;
window.addEventListener('resize', function () {
  clearTimeout(redim);
  redim = setTimeout(function () { if (!$('#app').hidden) rendreGraphes(); }, 220);
});

if (HORS_SERVEUR) {
  messageConnexion("Page ouverte en mode fichier local (file://). Le navigateur isole ce type de page et "
    + "refuse toute connexion à Supabase. Lancez scripts\\3-servir-formulaire.cmd puis ouvrez "
    + "http://localhost:5173/admin.html");
} else if (client()) {
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) demarrer(r.data.session);
  });
}
})();

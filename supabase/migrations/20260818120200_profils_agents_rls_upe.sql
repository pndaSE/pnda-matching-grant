-- ============================================================================
--  PNDA — Matching Grant
--  Migration 003 : profils agents + cloisonnement des données par UPE
--
--  Avant  : tout agent authentifié voyait toutes les fiches.
--  Après  : un agent ne voit que les fiches de son UPE ; la Coordination
--           Nationale voit l'ensemble. S'applique aux fiches, aux pièces
--           jointes et à la vue de synthèse.
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Rattachement d'un compte à une UPE
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.profils_agents (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  nom         text,
  upe_code    text not null references public.upe(code),
  role        text not null default 'agent'
                check (role in ('agent','superviseur','coordination')),
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profils_agents is
  'Rattachement compte Supabase Auth → UPE. Sans ligne ici, un compte authentifié ne voit rien.';

create index if not exists idx_profils_upe on public.profils_agents (upe_code);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Fonctions d'aide
--    SECURITY DEFINER : indispensable. Sans cela, la policy sur
--    enregistrements_op interrogerait profils_agents, dont la policy
--    interrogerait à son tour... → récursion infinie côté Postgres.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.upe_courante()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select upe_code
  from public.profils_agents
  where user_id = auth.uid() and actif
$$;

create or replace function public.est_coordination()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = 'coordination' or upe_code = 'COORD_NAT'
     from public.profils_agents
     where user_id = auth.uid() and actif),
    false)
$$;

comment on function public.upe_courante()   is 'Code UPE du compte connecté, NULL si non rattaché';
comment on function public.est_coordination() is 'Vrai si le compte connecté relève de la Coordination Nationale';

grant execute on function public.upe_courante(), public.est_coordination() to authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. RLS sur les profils : chacun lit le sien, la Coordination lit tout
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profils_agents enable row level security;

drop policy if exists "profil_lecture_propre" on public.profils_agents;
create policy "profil_lecture_propre"
  on public.profils_agents for select to authenticated
  using (user_id = auth.uid() or public.est_coordination());

grant select on public.profils_agents to authenticated;
-- Aucune policy INSERT/UPDATE/DELETE : les rattachements se font depuis le
-- tableau de bord Supabase ou via la clé service_role, jamais depuis le
-- navigateur. Un agent ne peut donc pas se réaffecter à une autre UPE.


-- ────────────────────────────────────────────────────────────────────────────
-- 4. RLS des fiches — remplace les policies « tout le monde voit tout »
--    Les politiques sont renommées ici ; on les drop donc explicitement pour
--    rendre la migration réexécutable sans erreur en cas de rerun.
-- ────────────────────────────────────────────────────────────────────────────
drop policy if exists "fiche_lecture_agents" on public.enregistrements_op;
drop policy if exists "fiche_maj_agents"     on public.enregistrements_op;
drop policy if exists "fiche_lecture_upe"    on public.enregistrements_op;
drop policy if exists "fiche_maj_upe"        on public.enregistrements_op;

create policy "fiche_lecture_upe"
  on public.enregistrements_op for select to authenticated
  using (public.est_coordination() or upe_saisie = public.upe_courante());

-- Le WITH CHECK reprend la même condition : un agent ne peut pas déplacer une
-- fiche vers une autre UPE pour la faire sortir de son périmètre.
create policy "fiche_maj_upe"
  on public.enregistrements_op for update to authenticated
  using      (public.est_coordination() or upe_saisie = public.upe_courante())
  with check (public.est_coordination() or upe_saisie = public.upe_courante());


-- ────────────────────────────────────────────────────────────────────────────
-- 5. La vue de synthèse doit respecter la RLS
--    Par défaut une vue s'exécute avec les droits de son PROPRIÉTAIRE et
--    contourne donc la RLS des tables sous-jacentes : sans security_invoker,
--    un agent du Kwilu lirait les agrégats de toutes les provinces.
-- ────────────────────────────────────────────────────────────────────────────
alter view public.v_synthese_enregistrements set (security_invoker = on);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. Traçabilité de la validation — posée côté serveur, pas côté navigateur
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_stamp_validation()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.statut is distinct from old.statut then
    new.valide_par := auth.uid();
    new.valide_le  := now();
  end if;
  -- Champs non modifiables par un agent : la fiche reste fidèle à la saisie.
  new.reference      := old.reference;
  new.consent_accept := old.consent_accept;
  new.payload        := old.payload;
  new.created_at     := old.created_at;
  return new;
end $$;

drop trigger if exists trg_enreg_validation on public.enregistrements_op;
create trigger trg_enreg_validation
  before update on public.enregistrements_op
  for each row execute function public.tg_stamp_validation();


-- ────────────────────────────────────────────────────────────────────────────
-- 7. Pièces jointes — même cloisonnement
--    Le chemin de dépôt est « <année>/<UPE>/<référence>/<champ>.<ext> » :
--    le 2ᵉ segment porte donc le code UPE.
-- ────────────────────────────────────────────────────────────────────────────
drop policy if exists "pj_lecture_agents" on storage.objects;
drop policy if exists "pj_lecture_upe"    on storage.objects;
create policy "pj_lecture_upe"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('documents-legaux','rib')
    and (public.est_coordination()
         or (storage.foldername(name))[2] = public.upe_courante())
  );

commit;

-- ============================================================================
--  RATTACHEMENT DES COMPTES — à exécuter après avoir créé les utilisateurs
--  dans Supabase → Authentication → Users.
--
--  insert into public.profils_agents (user_id, nom, upe_code, role)
--  select id, 'Nom Prénom', 'UPE_KWL', 'agent'
--  from auth.users where email = 'agent.kwilu@pnda.cd';
--
--  Codes UPE : COORD_NAT · UPE_KWL · UPE_KAS · UPE_KAC
--  Rôles     : agent · superviseur · coordination
--
--  ⚠ Un compte sans ligne dans profils_agents se connecte mais ne voit
--    aucune fiche. C'est volontaire : l'accès est explicite, jamais implicite.
-- ============================================================================

-- ============================================================================
--  PNDA — Matching Grant
--  Migration 001 : schéma principal, contraintes, index, RLS, stockage
--  Projet Supabase : splqfwjlndatyvuhycyu
--  Généré le 18 août 2026
-- ============================================================================
--  Convention : montants stockés en CENTS (bigint), conformément à la règle
--  monétaire du projet. Jamais de float/double pour la monnaie.
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Types énumérés
-- ────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.statut_fiche as enum ('soumis','en_verification','valide','rejete','doublon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.type_entite as enum ('association','cooperative','entreprise','prive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sexe as enum ('F','M');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.type_piece as enum ('id_electeur','id_passport','no_id');
exception when duplicate_object then null; end $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Référentiels
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.upe (
  code        text primary key,
  libelle     text not null,
  province    text,
  actif       boolean not null default true
);
comment on table public.upe is 'Unités Provinciales d''Exécution + Coordination Nationale';

create table if not exists public.provinces (
  code        text primary key,
  libelle     text not null,
  upe_code    text references public.upe(code)
);

create table if not exists public.territoires (
  id            bigserial primary key,
  province_code text not null references public.provinces(code) on delete cascade,
  libelle       text not null,
  est_ville     boolean not null default false,
  unique (province_code, libelle)
);

create table if not exists public.secteurs (
  id            bigserial primary key,
  territoire_id bigint not null references public.territoires(id) on delete cascade,
  libelle       text not null,
  unique (territoire_id, libelle)
);

create table if not exists public.banques (
  code     text primary key,
  libelle  text not null,
  actif    boolean not null default true
);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Table principale : fiches d'enregistrement
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.enregistrements_op (
  id                          uuid primary key default gen_random_uuid(),
  reference                   text not null unique,
  statut                      public.statut_fiche not null default 'soumis',

  -- Section A : consentement
  consent_accept              boolean not null,

  -- Section B : identification géographique
  geo_province                text,
  geo_territoire              text,
  geo_secteur                 text,
  geo_village                 text,
  geo_commune                 text,
  gps_lat                     numeric(10,6),
  gps_long                    numeric(10,6),
  gps_alt                     numeric(8,2),

  -- Section C : responsable
  responsable_nom             text,
  responsable_postnom         text,
  responsable_prenom          text,
  responsable_sexe            public.sexe,
  responsable_date_naissance  date,
  responsable_type_piece      public.type_piece,
  responsable_num_piece       text,
  responsable_telephone       text,
  responsable_email           text,

  -- Section D : structure et activités
  entite_nom                  text,
  entite_type                 public.type_entite,
  patente                     boolean,
  patente_no                  text,
  rccm                        boolean,
  rccm_no                     text,
  idnat                       boolean,
  idnat_no                    text,
  impot                       boolean,
  impot_no                    text,
  statuts_notaries            boolean,
  roi                         boolean,
  autorisation_fonctionnement boolean,
  document_legal_path         text,
  faitiere                    boolean,
  faitiere_nom                text,
  organisme_structuration     text,
  date_structuration          date,
  visite_senasem              boolean,
  date_visite_senasem         date,
  date_derniere_ag            date,
  nbr_membres                 integer,
  nbr_femmes                  integer,
  nbr_hommes                  integer,
  nbr_pmr                     integer,
  nbr_autochtones             integer,
  nbr_staff                   integer,
  nbr_staff_forme_sigi        integer,
  superficie_champ_ha         numeric(10,2),
  filieres                    text[],
  filiere_autre               text,
  quantite_produite_kg        numeric(12,2),

  -- Section E : informations bancaires
  compte_bancaire             boolean,
  banque_code                 text references public.banques(code),
  banque_autre                text,
  documents_compte            boolean,
  compte_numero               text,
  compte_intitule             text,
  compte_swift                text,
  rib_path                    text,

  -- Section F : informations complémentaires
  lieu_commercialisation      boolean,
  capacite_transport          boolean,
  stock_mais_kg               numeric(12,2),
  projection_mais_kg          numeric(12,2),
  stock_soja_kg               numeric(12,2),
  projection_soja_kg          numeric(12,2),
  stock_mucuna_kg             numeric(12,2),
  projection_mucuna_kg        numeric(12,2),
  superficie_parc_bois_ha     numeric(10,2),
  projection_parc_bois_ha     numeric(10,2),

  -- Section G : subvention
  contrainte_principale       text,
  besoin_estime_cents         bigint,          -- USD en cents
  nature_investissement       text,

  -- Section H : autres informations
  fraude_anterieure           boolean,
  formation_senasem           boolean,
  appui_pnda                  boolean,
  appui_pnda_precision        text,
  declarant_nom               text,
  declaration_lieu            text,
  declaration_date            date,
  upe_saisie                  text references public.upe(code),

  -- Traçabilité
  payload                     jsonb,           -- copie brute de la saisie
  source                      text not null default 'formulaire_web',
  observations                text,
  valide_par                  uuid references auth.users(id),
  valide_le                   timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  -- Contrôles de cohérence
  constraint chk_consent          check (consent_accept = true),
  constraint chk_effectifs        check (
      nbr_membres is null
      or coalesce(nbr_femmes,0) + coalesce(nbr_hommes,0) <= nbr_membres),
  constraint chk_nombres_positifs check (
      coalesce(nbr_membres,0) >= 0 and coalesce(nbr_femmes,0) >= 0
      and coalesce(nbr_hommes,0) >= 0 and coalesce(nbr_pmr,0) >= 0
      and coalesce(nbr_autochtones,0) >= 0 and coalesce(nbr_staff,0) >= 0),
  constraint chk_besoin_positif   check (besoin_estime_cents is null or besoin_estime_cents >= 0),
  constraint chk_gps              check (
      (gps_lat is null or gps_lat between -90 and 90)
      and (gps_long is null or gps_long between -180 and 180))
);

comment on table  public.enregistrements_op is 'Fiches d''enregistrement des OP/AVEC — Matching Grant PNDA';
comment on column public.enregistrements_op.besoin_estime_cents is 'Montant en cents USD (bigint) — jamais de float';
comment on column public.enregistrements_op.payload is 'Copie brute JSON de la saisie, pour audit et rejeu';

-- Index
create index if not exists idx_enreg_province   on public.enregistrements_op (geo_province);
create index if not exists idx_enreg_upe        on public.enregistrements_op (upe_saisie);
create index if not exists idx_enreg_statut     on public.enregistrements_op (statut);
create index if not exists idx_enreg_created    on public.enregistrements_op (created_at desc);
create index if not exists idx_enreg_entite     on public.enregistrements_op (lower(entite_nom));
create index if not exists idx_enreg_telephone  on public.enregistrements_op (responsable_telephone);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. Déclencheurs
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_enreg_updated_at on public.enregistrements_op;
create trigger trg_enreg_updated_at
  before update on public.enregistrements_op
  for each row execute function public.tg_touch_updated_at();

-- Génère une référence si le client n'en fournit pas : MG-AAAAMM-XXXXX
create or replace function public.tg_reference_defaut()
returns trigger language plpgsql as $$
begin
  if new.reference is null or btrim(new.reference) = '' then
    new.reference := 'MG-' || to_char(now(),'YYYYMM') || '-' ||
                     upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  end if;
  return new;
end $$;

drop trigger if exists trg_enreg_reference on public.enregistrements_op;
create trigger trg_enreg_reference
  before insert on public.enregistrements_op
  for each row execute function public.tg_reference_defaut();


-- ────────────────────────────────────────────────────────────────────────────
-- 5. Vue de synthèse (S&E)
-- ────────────────────────────────────────────────────────────────────────────
create or replace view public.v_synthese_enregistrements as
select
  coalesce(geo_province,'Non renseignée')          as province,
  coalesce(upe_saisie,'non_defini')                as upe,
  statut,
  count(*)                                          as nb_fiches,
  count(*) filter (where entite_type = 'cooperative') as nb_cooperatives,
  count(*) filter (where entite_type = 'association') as nb_associations,
  count(*) filter (where entite_type = 'entreprise')  as nb_entreprises,
  count(*) filter (where entite_type = 'prive')       as nb_prives,
  count(*) filter (where compte_bancaire)             as nb_avec_compte,
  count(*) filter (where responsable_sexe = 'F')      as nb_resp_femmes,
  sum(coalesce(nbr_membres,0))                       as total_membres,
  sum(coalesce(nbr_femmes,0))                        as total_membres_femmes,
  sum(coalesce(stock_mais_kg,0))                     as stock_mais_kg,
  sum(coalesce(stock_soja_kg,0))                     as stock_soja_kg,
  sum(coalesce(besoin_estime_cents,0)) / 100.0       as besoin_estime_usd
from public.enregistrements_op
group by 1,2,3;

comment on view public.v_synthese_enregistrements is 'Indicateurs S&E agrégés par province, UPE et statut';


-- ────────────────────────────────────────────────────────────────────────────
-- 6. Sécurité — Row Level Security
--    Modèle retenu : soumission publique anonyme, lecture réservée aux
--    agents authentifiés (Supabase Auth).
-- ────────────────────────────────────────────────────────────────────────────
alter table public.enregistrements_op enable row level security;
alter table public.upe          enable row level security;
alter table public.provinces    enable row level security;
alter table public.territoires  enable row level security;
alter table public.secteurs     enable row level security;
alter table public.banques      enable row level security;

-- Référentiels : lecture ouverte (nécessaire au formulaire public)
do $$
declare t text;
begin
  foreach t in array array['upe','provinces','territoires','secteurs','banques'] loop
    execute format('drop policy if exists "ref_lecture_publique" on public.%I', t);
    execute format(
      'create policy "ref_lecture_publique" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- Fiches : INSERT autorisé au public, rien d'autre
drop policy if exists "fiche_insertion_publique" on public.enregistrements_op;
create policy "fiche_insertion_publique"
  on public.enregistrements_op
  for insert to anon
  with check (consent_accept = true and statut = 'soumis');

-- Fiches : lecture / mise à jour réservées aux utilisateurs authentifiés
drop policy if exists "fiche_lecture_agents" on public.enregistrements_op;
create policy "fiche_lecture_agents"
  on public.enregistrements_op
  for select to authenticated
  using (true);

drop policy if exists "fiche_maj_agents" on public.enregistrements_op;
create policy "fiche_maj_agents"
  on public.enregistrements_op
  for update to authenticated
  using (true) with check (true);

-- Aucune policy DELETE : la suppression est impossible via l'API publique.

-- Privilèges explicites
grant usage  on schema public to anon, authenticated;
grant select on public.upe, public.provinces, public.territoires,
                public.secteurs, public.banques to anon, authenticated;
grant insert on public.enregistrements_op to anon;
grant select, update on public.enregistrements_op to authenticated;
grant select on public.v_synthese_enregistrements to authenticated;
revoke all on public.v_synthese_enregistrements from anon;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. Stockage des pièces jointes
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents-legaux','documents-legaux', false, 10485760,
   array['application/pdf','image/jpeg','image/png','image/webp']),
  ('rib','rib', false, 10485760,
   array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- Dépôt public autorisé, lecture réservée aux agents
drop policy if exists "pj_depot_public" on storage.objects;
create policy "pj_depot_public"
  on storage.objects for insert to anon
  with check (bucket_id in ('documents-legaux','rib'));

drop policy if exists "pj_lecture_agents" on storage.objects;
create policy "pj_lecture_agents"
  on storage.objects for select to authenticated
  using (bucket_id in ('documents-legaux','rib'));

commit;

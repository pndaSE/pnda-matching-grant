-- ============================================================================
--  PNDA — Matching Grant
--  Migration 004 : types de structure PNDA, déclaration d'activités,
--                  pièce d'identité « Autre »
--
--  Le formulaire devient sélectif : la structure déclare ses activités et
--  seuls les blocs correspondants lui sont présentés. Une PME qui ne multiplie
--  pas de semences ne se voit plus demander ses stocks semenciers ni ses
--  visites SENASEM.
--
--  ⚠ À exécuter D'UN SEUL BLOC dans le SQL Editor, mais SANS l'envelopper
--    dans une transaction : « alter type … add value » interdit d'utiliser la
--    nouvelle valeur dans la transaction qui la crée. Les instructions sont
--    donc autonomes et toutes réexécutables sans erreur.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Types de structure reconnus par le PNDA
--    Les anciennes valeurs (association, entreprise) sont conservées : des
--    fiches déjà saisies les portent, et PostgreSQL ne sait pas retirer une
--    valeur d'un type énuméré. Le formulaire ne les propose simplement plus.
-- ────────────────────────────────────────────────────────────────────────────
alter type public.type_entite add value if not exists 'avec';
alter type public.type_entite add value if not exists 'op';
alter type public.type_entite add value if not exists 'union';
alter type public.type_entite add value if not exists 'pme';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Pièce d'identité : cas « Autre pièce », à préciser en clair
-- ────────────────────────────────────────────────────────────────────────────
alter type public.type_piece add value if not exists 'autre';

alter table public.enregistrements_op
  add column if not exists responsable_piece_autre text;

comment on column public.enregistrements_op.responsable_piece_autre is
  'Nature de la pièce quand responsable_type_piece = autre (permis, carte de service…)';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Activités déclarées — commandent l'affichage du formulaire
-- ────────────────────────────────────────────────────────────────────────────
alter table public.enregistrements_op
  add column if not exists activites text[];

comment on column public.enregistrements_op.activites is
  'Familles d''activités : semences, production, transformation, commercialisation. '
  'Détermine les blocs présentés à la saisie ; les blocs masqués restent NULL.';

-- Garde-fou : pas de valeur inventée côté client.
alter table public.enregistrements_op
  drop constraint if exists chk_activites;
alter table public.enregistrements_op
  add constraint chk_activites check (
    activites is null
    or activites <@ array['semences','production','transformation','commercialisation']::text[]
  );

create index if not exists idx_enreg_activites
  on public.enregistrements_op using gin (activites);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Transformation et conservation
-- ────────────────────────────────────────────────────────────────────────────
alter table public.enregistrements_op
  add column if not exists equipement_transformation boolean;

comment on column public.enregistrements_op.equipement_transformation is
  'Renseigné uniquement si « transformation » figure dans activites';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Contrôle
-- ────────────────────────────────────────────────────────────────────────────
--  select unnest(enum_range(null::public.type_entite));
--    → association, cooperative, entreprise, prive, avec, op, union, pme
--  select unnest(enum_range(null::public.type_piece));
--    → id_electeur, id_passport, no_id, autre
--  select column_name from information_schema.columns
--   where table_name = 'enregistrements_op'
--     and column_name in ('activites','responsable_piece_autre','equipement_transformation');
--    → 3 lignes
--
--  Répartition des activités une fois des fiches saisies :
--  select unnest(activites) as activite, count(*)
--  from public.enregistrements_op where activites is not null
--  group by 1 order by 2 desc;
-- ============================================================================

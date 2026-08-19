-- ============================================================================
--  PNDA — Matching Grant
--  Contrôles à exécuter APRÈS les migrations 001 et 002.
--  À coller dans le SQL Editor de Supabase. Aucune écriture, lecture seule.
-- ============================================================================

-- 1. Les tables attendues existent-elles ?
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('enregistrements_op','upe','provinces','territoires','secteurs','banques')
order by 1;
-- Attendu : 6 lignes

-- 2. Volumétrie des référentiels
select
  (select count(*) from public.upe)          as upe,          -- attendu 4
  (select count(*) from public.provinces)    as provinces,    -- attendu 3
  (select count(*) from public.territoires)  as territoires,  -- attendu 11
  (select count(*) from public.secteurs)     as secteurs,     -- attendu 47
  (select count(*) from public.banques)      as banques;      -- attendu 9

-- 3. RLS active sur toutes les tables publiques ?
select relname as table_name, relrowsecurity as rls_active
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by 1;
-- Attendu : rls_active = true partout

-- 4. Policies en place
select tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public','storage')
order by tablename, policyname;
-- Attendu, sur enregistrements_op :
--   fiche_insertion_publique  INSERT  {anon}
--   fiche_lecture_agents      SELECT  {authenticated}
--   fiche_maj_agents          UPDATE  {authenticated}
--   (aucune policy DELETE — la suppression via l'API est impossible)

-- 5. Privilèges du rôle anonyme sur la table des fiches
select privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_name = 'enregistrements_op'
order by 1;
-- Attendu : INSERT uniquement. Si SELECT apparaît, exécuter :
--   revoke select on public.enregistrements_op from anon;

-- 6. Buckets de stockage
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('documents-legaux','rib');
-- Attendu : public = false, file_size_limit = 10485760

-- 7. Découpage administratif reconstitué — À FAIRE VALIDER
select p.libelle as province, t.libelle as territoire, t.est_ville,
       count(s.id) as nb_secteurs,
       string_agg(s.libelle, ', ' order by s.libelle) as secteurs
from public.provinces p
join public.territoires t on t.province_code = p.code
left join public.secteurs s on s.territoire_id = t.id
group by 1,2,3
order by 1,2;

-- 8. Dernières fiches reçues (nécessite d'être connecté comme agent)
select reference, created_at, statut, geo_province, entite_nom,
       nbr_membres, upe_saisie
from public.enregistrements_op
order by created_at desc
limit 20;

-- 9. Tableau de bord S&E
select * from public.v_synthese_enregistrements order by province, upe;

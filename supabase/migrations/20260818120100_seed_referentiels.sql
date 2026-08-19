-- ============================================================================
--  PNDA — Matching Grant
--  Migration 002 : référentiels (UPE, découpage administratif, banques)
--
--  ⚠ Le rattachement Province → Territoire/Ville → Secteur a été reconstitué
--     à partir du questionnaire Word de juillet 2026, qui listait les 47
--     secteurs à plat. À FAIRE VALIDER par la Coordination Nationale avant
--     déploiement terrain : corriger ici puis rejouer cette migration.
-- ============================================================================

begin;

-- UPE ------------------------------------------------------------------------
insert into public.upe (code, libelle, province) values
  ('COORD_NAT', 'Coordination Nationale — Kinshasa', null),
  ('UPE_KWL', 'UPE Kwilu', 'Kwilu'),
  ('UPE_KAS', 'UPE Kasaï', 'Kasaï'),
  ('UPE_KAC', 'UPE Kasaï Central', 'Kasaï Central')
on conflict (code) do update set libelle = excluded.libelle, province = excluded.province;

-- Provinces ------------------------------------------------------------------
insert into public.provinces (code, libelle, upe_code) values
  ('KAC', 'Kasaï Central', 'UPE_KAC'),
  ('KAS', 'Kasaï', 'UPE_KAS'),
  ('KWL', 'Kwilu', 'UPE_KWL')
on conflict (code) do update set libelle = excluded.libelle, upe_code = excluded.upe_code;

-- Territoires / Villes -------------------------------------------------------
insert into public.territoires (province_code, libelle, est_ville) values
  ('KAC', 'Kananga (Ville)', true),
  ('KAC', 'Demba', false),
  ('KAC', 'Dibaya', false),
  ('KAC', 'Luiza', false),
  ('KAS', 'Tshikapa (Ville)', true),
  ('KAS', 'Luebo', false),
  ('KAS', 'Mweka', false),
  ('KWL', 'Kikwit (Ville)', true),
  ('KWL', 'Bulungu', false),
  ('KWL', 'Gungu', false),
  ('KWL', 'Idiofa', false)
on conflict (province_code, libelle) do update set est_ville = excluded.est_ville;

-- Secteurs / Chefferies / Cités / Communes -----------------------------------
insert into public.secteurs (territoire_id, libelle)
select t.id, s.libelle
from (values
  ('KAC', 'Kananga (Ville)', 'Ndesha'),
  ('KAC', 'Kananga (Ville)', 'Lukonga'),
  ('KAC', 'Kananga (Ville)', 'Nganza'),
  ('KAC', 'Kananga (Ville)', 'Katoka'),
  ('KAC', 'Kananga (Ville)', 'Kananga'),
  ('KAC', 'Demba', 'Bakuanyambi'),
  ('KAC', 'Demba', 'Luangatshimu'),
  ('KAC', 'Demba', 'Lunyeka'),
  ('KAC', 'Dibaya', 'Dibanda'),
  ('KAC', 'Dibaya', 'Dibataie'),
  ('KAC', 'Dibaya', 'Dipanda'),
  ('KAC', 'Dibaya', 'Kasangidi'),
  ('KAC', 'Luiza', 'Bapende'),
  ('KAC', 'Luiza', 'Kabambaie'),
  ('KAC', 'Luiza', 'Kalunga'),
  ('KAC', 'Luiza', 'Lueta'),
  ('KAC', 'Luiza', 'Mbambaie'),
  ('KAS', 'Tshikapa (Ville)', 'Dibumba I'),
  ('KAS', 'Tshikapa (Ville)', 'Dibumba II'),
  ('KAS', 'Tshikapa (Ville)', 'Kanzala'),
  ('KAS', 'Tshikapa (Ville)', 'Mabondo'),
  ('KAS', 'Tshikapa (Ville)', 'Mbumba'),
  ('KAS', 'Tshikapa (Ville)', 'Tshikapa'),
  ('KAS', 'Luebo', 'Luebo - Wedi'),
  ('KAS', 'Luebo', 'Luebo Kabambaie'),
  ('KAS', 'Luebo', 'Luebo Lulengele'),
  ('KAS', 'Mweka', 'Bakuba'),
  ('KAS', 'Mweka', 'Kampangu'),
  ('KAS', 'Mweka', 'Kapungu'),
  ('KWL', 'Kikwit (Ville)', 'Kazamba'),
  ('KWL', 'Kikwit (Ville)', 'Lukemi'),
  ('KWL', 'Kikwit (Ville)', 'Lukolela'),
  ('KWL', 'Kikwit (Ville)', 'Nzinda'),
  ('KWL', 'Bulungu', 'Imbongo'),
  ('KWL', 'Bulungu', 'Kipuka'),
  ('KWL', 'Bulungu', 'Kwenge'),
  ('KWL', 'Bulungu', 'Tshibungu'),
  ('KWL', 'Gungu', 'Gungu'),
  ('KWL', 'Gungu', 'Kilamba'),
  ('KWL', 'Gungu', 'Lukamba'),
  ('KWL', 'Gungu', 'Mungindu'),
  ('KWL', 'Gungu', 'Kalanganda'),
  ('KWL', 'Gungu', 'Kanga'),
  ('KWL', 'Idiofa', 'Diofa'),
  ('KWL', 'Idiofa', 'Tshibote'),
  ('KWL', 'Idiofa', 'Musanga-Idiofa'),
  ('KWL', 'Idiofa', 'Kipuku')
) as s(province_code, territoire, libelle)
join public.territoires t
  on t.province_code = s.province_code and t.libelle = s.territoire
on conflict (territoire_id, libelle) do nothing;

-- Banques --------------------------------------------------------------------
insert into public.banques (code, libelle) values
  ('equity_bcdc', 'Equity BCDC'),
  ('ecobank', 'Ecobank'),
  ('rawbank', 'Rawbank'),
  ('firstbankdrc', 'First Bank RDC'),
  ('uba', 'UBA'),
  ('accessbank', 'Access Bank'),
  ('tmb', 'TMB'),
  ('sofibank', 'Sofibank'),
  ('autre', 'Autre')
on conflict (code) do update set libelle = excluded.libelle;

commit;

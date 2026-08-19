/* ============================================================================
 * PNDA — Matching Grant
 * Configuration du client Supabase (front-end)
 * ----------------------------------------------------------------------------
 * La clé ci-dessous est la clé PUBLIABLE (publishable / anon). Elle est conçue
 * pour être exposée dans le navigateur : elle ne donne aucun droit en dehors de
 * ce que les policies RLS autorisent (ici : INSERT d'une fiche + dépôt d'une
 * pièce jointe, aucune lecture).
 *
 * ⛔ Ne JAMAIS placer ici la clé "service_role" ni le mot de passe de la base :
 *    elles contournent la RLS. Elles restent côté serveur uniquement.
 * ==========================================================================*/

window.PNDA_CONFIG = {
  SUPABASE_URL:  "https://splqfwjlndatyvuhycyu.supabase.co",
  SUPABASE_KEY:  "sb_publishable_7-Y0MArgDBbjiuQ2Lnyesg_KMClhAOl",

  TABLE:            "enregistrements_op",
  BUCKET_DOCUMENTS: "documents-legaux",
  BUCKET_RIB:       "rib",

  // File d'attente hors-ligne (terrain) : conserve les fiches non transmises
  // dans le navigateur et les rejoue automatiquement au retour du réseau.
  FILE_ATTENTE:        true,
  CLE_FILE_ATTENTE:    "pnda_mg_file_attente",
  MAX_TENTATIVES:      3,
  DELAI_RETRY_MS:      2500
};

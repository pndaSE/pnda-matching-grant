# PNDA — Matching Grant

Base de données et formulaire d'enregistrement des Organisations de Producteurs
(AVEC, OP, Union, Coopérative) dans le cadre du Projet National de Développement
Agricole. Provinces couvertes : Kwilu, Kasaï, Kasaï Central.

Projet Supabase : `splqfwjlndatyvuhycyu` — région à vérifier dans le tableau de bord.

---

## Arborescence

```
pnda-matching-grant/
├── .github/workflows/pages.yml                  publication automatique du site
├── supabase/
│   ├── config.toml                              configuration CLI
│   ├── verification.sql                         contrôles post-migration
│   ├── functions/creer-agent/index.ts           création de comptes agents
│   └── migrations/
│       ├── 20260818120000_init_matching_grant.sql   schéma, RLS, stockage
│       ├── 20260818120100_seed_referentiels.sql     UPE, géographie, banques
│       └── 20260818120200_profils_agents_rls_upe.sql  cloisonnement par UPE
├── web/
│   ├── index.html                               formulaire (8 sections A→H)
│   ├── admin.html                               console Suivi & Évaluation
│   ├── image/logo-pnda.png                      logo officiel
│   └── js/
│       ├── config.js                            URL + clé publiable
│       ├── theme.js                             bascule clair / sombre
│       ├── submit.js                            envoi vers Supabase
│       ├── admin.js                             tableau de bord S&E
│       └── vendor/supabase.umd.js               client supabase-js 2.112.3
├── scripts/
│   ├── 1-lier-projet.cmd                        supabase login + link
│   ├── 2-appliquer-migrations.cmd               supabase db push
│   ├── 3-servir-formulaire.cmd                  serveur local (auto-détection)
│   ├── 4-init-git.cmd                           dépôt local + marche à suivre GitHub
│   ├── 5-deployer-fonction.cmd                  déploiement de l'Edge Function
│   ├── 6-identite-github.cmd                    résout les refus 403 à la poussée
│   └── serveur.ps1                              serveur PowerShell sans dépendance
├── .env.example                                 modèle de variables
└── .gitignore
```

---

## Mise en route

### Étape 1 — Appliquer le schéma

**Sans installer d'outil (recommandé) :** ouvrir Supabase → *SQL Editor* → *New query*,
puis coller et exécuter dans l'ordre :

1. `supabase/migrations/20260818120000_init_matching_grant.sql`
2. `supabase/migrations/20260818120100_seed_referentiels.sql`

Contrôler ensuite avec `supabase/verification.sql`.

**Avec la CLI :** lancer `scripts/1-lier-projet.cmd` puis `scripts/2-appliquer-migrations.cmd`
(le mot de passe de la base est demandé — il n'est stocké nulle part dans ce dossier).

### Étape 2 — Tester le formulaire

Lancer `scripts/3-servir-formulaire.cmd` puis ouvrir <http://localhost:5173>.

**Ne pas ouvrir `web/index.html` en double-clic.** Le navigateur traite les pages
`file://` comme des origines uniques et refuse toute connexion à Supabase :

```
Unsafe attempt to load URL … 'file:' URLs are treated as unique security origins.
```

Le formulaire détecte ce cas et affiche un avertissement en haut de page ; la
saisie, les exports et l'impression restent utilisables, mais le bouton
*Transmettre* explique quoi faire au lieu d'échouer silencieusement.

Le script cherche un moteur dans l'ordre `python` → `py -3` → PowerShell. Si
Python n'est pas installé, `scripts/serveur.ps1` prend le relais : il n'utilise
que `HttpListener`, présent dans toute installation Windows, sans droits
administrateur. Pour changer de port :

```
powershell -ExecutionPolicy Bypass -File scripts\serveur.ps1 -Port 5174
```

### Étape 3 — Créer les comptes agents et les rattacher à une UPE

Deux gestes, pas un seul :

1. Créer le compte dans Supabase → *Authentication* → *Users* → *Add user*
   (l'inscription libre est désactivée dans `config.toml`).
2. Le rattacher à une UPE, sinon il se connecte mais ne voit **aucune** fiche :

```sql
insert into public.profils_agents (user_id, nom, upe_code, role)
select id, 'Nom Prénom', 'UPE_KWL', 'agent'
from auth.users where email = 'agent.kwilu@pnda.cd';
```

Codes UPE : `COORD_NAT` · `UPE_KWL` · `UPE_KAS` · `UPE_KAC`.
Rôles : `agent` · `superviseur` · `coordination`.

L'accès est explicite, jamais implicite : un compte non rattaché ne voit rien,
et la console le lui dit clairement au lieu d'afficher un tableau vide.

### Étape 4 — Ouvrir la console S&E

<http://localhost:5173/admin.html> — connexion avec l'e-mail et le mot de passe
du compte agent.

La console couvre : sept indicateurs (fiches, membres, féminisation, direction
féminine, bancarisation, besoin d'investissement, stock semencier), six
graphiques, une rangée de filtres unique qui cadre l'ensemble (période, province,
territoire, UPE, type d'entité, statut, recherche), le tableau des fiches trié et
paginé, la fiche complète en panneau latéral avec les pièces jointes, la
validation (soumis → en vérification → validé / rejeté / doublon) et deux exports
CSV — données filtrées et synthèse par province/UPE.

---

## Publication : dépôt GitHub et liens publics

### Le dépôt

`scripts/4-init-git.cmd` prépare le dépôt local et le premier commit, puis
affiche la marche à suivre. La création du dépôt sur GitHub et la poussée
restent à votre main : elles demandent vos identifiants.

```
git remote add origin https://github.com/VOTRE-COMPTE/pnda-matching-grant.git
git push -u origin main
```

**Si la poussée est refusée en 403** — message du type
`Permission to X/depot.git denied to Y` — ce n'est pas un problème de Git mais
d'identité : Windows a mémorisé les identifiants d'un autre compte GitHub et
Git les réutilise. `scripts/6-identite-github.cmd` diagnostique et propose
d'oublier l'identifiant mémorisé, puis inscrit le nom du compte dans l'adresse
du dépôt pour que GitHub cible le bon. Pensez aussi à vous déconnecter de
github.com dans le navigateur : sinon la fenêtre de connexion réutilise la
session ouverte sans rien demander.

Puis, une seule fois : dépôt → *Settings* → *Pages* → Source = **GitHub Actions**.

### Les deux liens

Après la première publication (≈ 2 minutes), l'onglet *Actions* affiche l'URL :

| Usage | Lien |
|---|---|
| Formulaire d'enregistrement — à diffuser aux UPE | `https://VOTRE-COMPTE.github.io/pnda-matching-grant/` |
| Console Suivi & Évaluation — réservée aux agents | `https://VOTRE-COMPTE.github.io/pnda-matching-grant/admin.html` |

Chaque poussée sur `main` qui touche `web/` republie le site. Le workflow refuse
de publier s'il détecte une chaîne ressemblant à une clé de service dans `web/`.

La console n'est pas « secrète » — son URL est devinable. Ce qui la protège,
c'est l'authentification Supabase et la RLS par UPE, pas l'obscurité du lien.

### Après la première publication

1. Supabase → *Authentication* → *URL Configuration* : ajouter
   `https://VOTRE-COMPTE.github.io` aux **Site URL** et **Redirect URLs**.
2. Autoriser cette origine pour l'Edge Function :
   `supabase secrets set ORIGINE_PUBLIQUE=https://VOTRE-COMPTE.github.io`

---

## Création des comptes agents

`scripts/5-deployer-fonction.cmd` déploie l'Edge Function `creer-agent`. Le
bouton **Créer un agent** de la console devient alors opérationnel : il crée le
compte Auth et son rattachement à l'UPE en une fois.

**Pourquoi une fonction et pas un appel direct depuis le navigateur.**
`auth.admin.createUser` exige la clé `service_role`, qui contourne toute la RLS.
La placer dans `web/js/config.js` reviendrait à publier, sur un site accessible à
tous, un accès complet en lecture et en écriture aux fiches bénéficiaires —
identité, téléphone, numéro de pièce, coordonnées bancaires. La clé reste donc
chez Supabase, et la fonction vérifie elle-même, en rejouant le jeton de
l'appelant contre la base, que celui-ci relève bien de la Coordination
Nationale. Un agent provincial reçoit un refus.

Si la fonction n'est pas encore déployée, le modal le détecte et bascule sur la
procédure manuelle : création dans *Authentication → Users*, puis le SQL de
rattachement, généré et copiable en un clic.

Tant que la fonction n'est pas déployée, la voie manuelle reste la seule.

---

## Modèle de sécurité

| Rôle | Fiches | Référentiels | Pièces jointes |
|---|---|---|---|
| `anon` (formulaire public) | INSERT seulement | lecture | dépôt seulement |
| agent d'une UPE | lecture + mise à jour **de son UPE** | lecture | son UPE |
| Coordination Nationale | lecture + mise à jour de tout | lecture | tout |
| service_role (serveur) | tout | tout | tout |

Points vérifiés par les tests :

- une fiche sans consentement est rejetée par la policy `fiche_insertion_publique` ;
- le rôle anonyme ne peut ni lire, ni modifier, ni supprimer une fiche — même en
  forgeant la requête, la clé publiable ne lui donne que `INSERT` ;
- le statut ne peut pas être forcé à `valide` depuis le navigateur ;
- un agent du Kwilu ne lit pas les fiches du Kasaï, **ni dans la table ni dans la
  vue de synthèse** — c'est ce que garantit `security_invoker` sur la vue ; sans
  cette option une vue s'exécute avec les droits de son propriétaire et
  contourne la RLS ;
- un agent ne peut pas déplacer une fiche vers une autre UPE pour la sortir de
  son périmètre (le `WITH CHECK` le refuse) ;
- la référence, le consentement, le `payload` et la date de création sont
  restaurés par un déclencheur : un agent ne peut pas réécrire la saisie ;
- `valide_par` et `valide_le` sont posés côté serveur, pas par le navigateur ;
- aucune policy `DELETE` n'existe : la suppression est impossible via l'API.

**Ce qui ne doit jamais entrer dans `web/`** : la clé `service_role` et le mot de
passe de la base. Ils contournent la RLS. `.gitignore` bloque déjà `.env`.

---

## Conventions

- Montants stockés en **cents** (`bigint`) : `besoin_estime_cents`. Jamais de
  `float` ni de `double` pour la monnaie. Devise : USD (`$`).
- Libellés d'interface en français (RDC).
- Colonne `payload` (`jsonb`) : copie brute de la saisie, pour audit et rejeu.
- Aucune suppression physique : le statut passe à `rejete` ou `doublon`.

## Thème clair et thème sombre

Les deux pages ont un bouton de bascule dans l'en-tête, à trois positions :
**Auto** (suit le réglage du système), **Clair**, **Sombre**. Le choix est
mémorisé sur le poste ; le sombre reste le défaut, c'est l'identité du logiciel.
Le clair sert aux bureaux d'archivage très éclairés et rend l'impression plus
naturelle.

`js/theme.js` est chargé dans le `<head>`, avant le rendu, pour éviter le flash
blanc à l'ouverture d'une page en mode sombre.

Le clair n'est pas une inversion automatique du sombre : surfaces, ombres,
textes d'accent et **teintes de données** sont repris un par un. La console
relit les variables CSS `--s1 … --s7` avant chaque rendu, donc la bascule
repeint les graphiques sans recharger la page.

## Couleurs des graphiques

Le décor de la console (en-tête, boutons, accents) reprend les couleurs modules
du projet. Les **marques de données**, elles, utilisent une palette dérivée des
mêmes teintes mais recalées pour le fond sombre — les couleurs de marque brutes
échouent aux contrôles daltonisme : `#7AC143` et `#F5A623` côte à côte mesurent
ΔE 2.7 en protanopie, pour un seuil de 8.

Palette retenue, dans cet ordre (jamais recyclée, jamais de 8ᵉ couleur générée) :

```
#559c00  #c44ebf  #b57700  #0d9999  #dd5403  #3480fc  #e3406b
```

Validée sur la surface `#1b2537` : pire paire adjacente ΔE 15.3 (protanopie),
20.6 (vision normale), contraste ≥ 3:1 pour les sept.

Le thème clair a ses **propres pas**, sur les mêmes teintes et dans le même
ordre — le vert reste le vert, la 3ᵉ série reste ambre, l'identité d'une série
ne change pas d'un mode à l'autre :

```
#529605  #ce4aca  #af7303  #039f9f  #d65101  #3b85ff  #e52964
```

Validée sur surface blanche : ΔE 16.1 (deutéranopie), 20.9 (vision normale),
contraste ≥ 3:1 pour les sept.

Les statuts utilisent une palette réservée, identique dans les deux modes,
distincte des séries et toujours accompagnée d'une icône et d'un mot — jamais la
couleur seule. Sur fond clair, `warning` et `serious` passent sous 3:1 : c'est
documenté et assumé, l'icône et le libellé portent le sens. Chaque graphique a
un jumeau tabulaire (bouton *Tableau*) : aucune valeur n'est accessible
uniquement au survol.

### Piège rencontré

Une data-URI SVG placée dans une propriété personnalisée
(`--fleche:url("data:image/svg+xml,<svg …>")`) fait **avorter le parsage de
toute la feuille de style** à partir de ce point, sans erreur visible : la page
s'affiche sans aucun style au-delà. Les flèches des listes déroulantes sont donc
déclarées en `background-image` ordinaire, surchargée dans le bloc du thème
clair.

---

## Fonctionnement hors ligne

Le formulaire détecte l'absence de réseau et conserve la fiche sur le poste
(`localStorage`), puis la retransmet automatiquement au retour de la connexion.
Un badge en bas à droite indique l'état et le nombre de fiches en attente.

**Limite connue :** les pièces jointes ne sont pas mises en file d'attente (volume
trop important pour le stockage navigateur). Une fiche transmise depuis la file
arrive sans ses documents — il faut les rattacher ensuite depuis la console agent,
ou saisir la fiche en ligne.

---

## Points en attente de décision

1. **Découpage administratif** — le rattachement Province → Territoire/Ville →
   Secteur a été reconstitué : le questionnaire Word listait les 47 secteurs à plat,
   sans hiérarchie. Le résultat est dans la migration 002 et dans l'objet `GEO` de
   `web/index.html` (les deux doivent rester alignés). À faire valider par la
   Coordination Nationale avant déploiement terrain.

2. **Anti-abus** — le formulaire étant public, rien n'empêche aujourd'hui l'envoi
   massif de fiches. À arbitrer : Turnstile/hCaptcha, une Edge Function de contrôle,
   ou le passage en soumission authentifiée par agent UPE.

3. **Détection de doublons** — aucune contrainte d'unicité sur le couple
   (nom de l'entité, province). Le statut `doublon` existe mais le rapprochement
   reste manuel pour l'instant.

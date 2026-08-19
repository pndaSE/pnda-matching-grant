/* ============================================================================
 * PNDA — Matching Grant
 * Transmission d'une fiche vers Supabase (insertion + pièces jointes)
 * ----------------------------------------------------------------------------
 * Chargé APRÈS le moteur du formulaire : il accède aux liaisons globales
 * `data`, `FILES`, `SECTIONS` et `payload()` déclarées dans index.html.
 *
 * Modèle de sécurité : la clé publiable n'autorise que l'INSERT (policy
 * "fiche_insertion_publique"). Aucune lecture n'est possible depuis le
 * navigateur — on n'appelle donc jamais .select() après l'insert.
 * ==========================================================================*/
(function () {
  'use strict';

  var CFG = window.PNDA_CONFIG || {};
  var client = null;

  // Le navigateur traite chaque fichier ouvert en « file:// » comme une origine
  // unique : tout appel réseau (Supabase REST et Storage) est refusé avant même
  // de partir. La page doit être servie en http:// — voir scripts/3-servir-formulaire.cmd
  var HORS_SERVEUR = (location.protocol === 'file:');

  function sb() {
    if (client) return client;
    if (!window.supabase || !CFG.SUPABASE_URL || !CFG.SUPABASE_KEY) return null;
    client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return client;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 1. Correspondance formulaire → colonnes de la base
   * ───────────────────────────────────────────────────────────────────────*/
  var SEXE = { '1': 'F', '2': 'M' };
  var UPE  = {
    'Coordination Nationale — Kinshasa': 'COORD_NAT',
    'UPE Kwilu':         'UPE_KWL',
    'UPE Kasaï':         'UPE_KAS',
    'UPE Kasaï Central': 'UPE_KAC'
  };

  var oui  = function (v) { return v === 'oui' ? true : (v === 'non' ? false : null); };
  var txt  = function (v) { return (v === undefined || v === null || v === '') ? null : String(v).trim(); };
  var num  = function (v) { var n = parseFloat(v); return isFinite(n) ? n : null; };
  var ent  = function (v) { var n = parseInt(v, 10); return isFinite(n) ? n : null; };
  var dat  = function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null; };
  /** Montant USD → cents (bigint). Aucun float ne subsiste en base. */
  var cents = function (v) { var n = parseFloat(v); return isFinite(n) ? Math.round(n * 100) : null; };

  function versLigne(d, reference, chemins) {
    return {
      reference: reference,
      consent_accept: oui(d.consent_accept) === true,

      geo_province:   txt(d.geo_level_1),
      geo_territoire: txt(d.geo_level_2),
      geo_secteur:    txt(d.geo_level_3),
      geo_village:    txt(d.geo_level_4),
      geo_commune:    txt(d.geo_level_5),
      gps_lat:        num(d.gps_lat),
      gps_long:       num(d.gps_long),
      gps_alt:        num(d.gps_alt),

      responsable_nom:            txt(d.supplier_last_name),
      responsable_postnom:        txt(d.supplier_middle_name),
      responsable_prenom:         txt(d.supplier_first_name),
      responsable_sexe:           SEXE[d.supplier_gender] || null,
      responsable_date_naissance: dat(d.supplier_date_of_birth),
      responsable_type_piece:     txt(d.supplier_id_type),
      responsable_num_piece:      txt(d.supplier_id_number),
      responsable_telephone:      txt(d.supplier_phone_number),
      responsable_email:          txt(d.supplier_email),

      entite_nom:                  txt(d.entity_name),
      entite_type:                 txt(d.entity_type),
      patente:                     oui(d.patente),
      patente_no:                  txt(d.patente_no),
      rccm:                        oui(d.rccm),
      rccm_no:                     txt(d.rccm_no),
      idnat:                       oui(d.idnat),
      idnat_no:                    txt(d.idnat_no),
      impot:                       oui(d.impot),
      impot_no:                    txt(d.impot_no),
      statuts_notaries:            oui(d.status_not),
      roi:                         oui(d.roi),
      autorisation_fonctionnement: oui(d.fonc_aut),
      document_legal_path:         chemins.document || null,
      faitiere:                    oui(d.faitiere),
      faitiere_nom:                txt(d.faitiere_nom),
      organisme_structuration:     txt(d.organisme_structuration),
      date_structuration:          dat(d.date_structuration),
      visite_senasem:              oui(d.visite_senasem),
      date_visite_senasem:         dat(d.date_visite_senasem),
      date_derniere_ag:            dat(d.date_derniere_ag),
      nbr_membres:                 ent(d.nbr_membres),
      nbr_femmes:                  ent(d.nbr_femmes),
      nbr_hommes:                  ent(d.nbr_hommes),
      nbr_pmr:                     ent(d.nbr_pmr),
      nbr_autochtones:             ent(d.nbr_autochtones),
      nbr_staff:                   ent(d.nbr_staff),
      nbr_staff_forme_sigi:        ent(d.nbr_staff_forme_IDEA),
      superficie_champ_ha:         num(d.superficie_champ_communautaire),
      filieres:                    (d.filiere && d.filiere.length) ? d.filiere : null,
      filiere_autre:               txt(d.filiere_autre),
      quantite_produite_kg:        num(d.quantite_produite),

      compte_bancaire:  oui(d.bank_account),
      banque_code:      d.bank_account === 'oui' ? txt(d.which_bank) : null,
      banque_autre:     txt(d.which_bank_other_autre),
      documents_compte: oui(d.account_doc),
      compte_numero:    txt(d.bank_account_no),
      compte_intitule:  txt(d.bank_account_name),
      compte_swift:     txt(d.bank_account_swift),
      rib_path:         chemins.rib_doc || null,

      lieu_commercialisation:  oui(d.avoir_lieu_commercialisation),
      capacite_transport:      oui(d.capacite_transport),
      stock_mais_kg:           num(d.stock_mais),
      projection_mais_kg:      num(d.projection_mais_kg),
      stock_soja_kg:           num(d.stock_soja),
      projection_soja_kg:      num(d.projection_soja_kg),
      stock_mucuna_kg:         num(d.stock_mukuna),
      projection_mucuna_kg:    num(d.projection_mukuna_kg),
      superficie_parc_bois_ha: num(d.stock_manioc_ml),
      projection_parc_bois_ha: num(d.projection_manioc_ml),

      contrainte_principale: txt(d.agrix_ptech),
      besoin_estime_cents:   cents(d.besoin_estime),
      nature_investissement: txt(d.nature_investissement),

      fraude_anterieure:    oui(d.culpabilite),
      formation_senasem:    oui(d.formation_multiplication),
      appui_pnda:           oui(d.appui_PNDA),
      appui_pnda_precision: txt(d.appui_PNDA_precision),
      declarant_nom:        txt(d.declarant_nom),
      declaration_lieu:     txt(d.declaration_lieu),
      declaration_date:     dat(d.declaration_date),
      upe_saisie:           UPE[d.upe_saisie] || null,

      payload: d,
      source:  'formulaire_web'
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 2. Envoi des pièces jointes
   * ───────────────────────────────────────────────────────────────────────*/
  function extension(nom) {
    var i = nom.lastIndexOf('.');
    return i > -1 ? nom.slice(i).toLowerCase() : '';
  }

  function deposer(bucket, dossier, champ, fichier) {
    var chemin = dossier + '/' + champ + extension(fichier.name);
    return sb().storage.from(bucket).upload(chemin, fichier, {
      cacheControl: '3600', upsert: false, contentType: fichier.type || undefined
    }).then(function (r) {
      if (r.error) throw new Error('Pièce jointe « ' + champ + ' » : ' + r.error.message);
      return chemin;
    });
  }

  function deposerPieces(reference, upeCode) {
    var dossier  = new Date().getFullYear() + '/' + (upeCode || 'non_defini') + '/' + reference;
    var chemins  = {};
    var chaine   = Promise.resolve();
    [['document', CFG.BUCKET_DOCUMENTS], ['rib_doc', CFG.BUCKET_RIB]].forEach(function (p) {
      var champ = p[0], bucket = p[1];
      if (!FILES[champ]) return;
      chaine = chaine.then(function () {
        return deposer(bucket, dossier, champ, FILES[champ])
          .then(function (c) { chemins[champ] = c; });
      });
    });
    return chaine.then(function () { return chemins; });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 3. File d'attente hors-ligne
   *    Les fiches non transmises sont conservées dans le navigateur et
   *    rejouées automatiquement au retour du réseau.
   *    ⚠ Les pièces jointes ne sont PAS mises en file d'attente (volume) :
   *      elles doivent être rattachées lors d'une saisie en ligne.
   * ───────────────────────────────────────────────────────────────────────*/
  function lireFile() {
    if (!CFG.FILE_ATTENTE) return [];
    try { return JSON.parse(localStorage.getItem(CFG.CLE_FILE_ATTENTE) || '[]'); }
    catch (e) { return []; }
  }
  function ecrireFile(f) {
    if (!CFG.FILE_ATTENTE) return;
    try { localStorage.setItem(CFG.CLE_FILE_ATTENTE, JSON.stringify(f)); } catch (e) {}
  }
  function empiler(ligne) { var f = lireFile(); f.push(ligne); ecrireFile(f); return f.length; }

  // Verrou : sans lui, deux évènements « online » rapprochés (celui du
  // navigateur et celui d'un rafraîchissement manuel) rejouent la même fiche
  // deux fois et créent des doublons en base.
  var vidageEnCours = false;

  function viderFile() {
    if (vidageEnCours) return Promise.resolve(0);
    var f = lireFile();
    if (!f.length || !sb() || !navigator.onLine) return Promise.resolve(0);

    vidageEnCours = true;
    // On retire immédiatement les fiches de la file : celles qui échouent y
    // sont replacées à la fin. Un second appel ne voit donc plus rien à envoyer.
    ecrireFile([]);

    var restantes = [], envoyees = 0;
    return f.reduce(function (p, ligne) {
      return p.then(function () {
        return sb().from(CFG.TABLE).insert(ligne).then(function (r) {
          if (r.error) restantes.push(ligne); else envoyees++;
        }).catch(function () { restantes.push(ligne); });
      });
    }, Promise.resolve()).then(function () {
      ecrireFile(restantes);
      vidageEnCours = false;
      majBandeauReseau();
      return envoyees;
    }, function (e) {
      ecrireFile(f);          // échec global : on restaure la file intacte
      vidageEnCours = false;
      majBandeauReseau();
      throw e;
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 4. Interface
   * ───────────────────────────────────────────────────────────────────────*/
  var I = {
    ok:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    ko:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    net:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>'
  };

  function bandeau(etat, titre, detail) {
    var z = document.getElementById('zoneEnvoi');
    if (!z) return;
    z.innerHTML = '<div class="envoi ' + etat + '">' + I[etat === 'ok' ? 'ok' : etat === 'ko' ? 'ko' : 'wait'] +
                  '<div><b>' + titre + '</b>' + (detail || '') + '</div></div>';
  }

  function majBandeauReseau() {
    var el = document.getElementById('netBadge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'netBadge'; el.className = 'net no-print';
      document.body.appendChild(el);
    }
    if (HORS_SERVEUR) {
      el.className = 'net no-print off';
      el.innerHTML = I.ko + '<span>Mode fichier local — transmission impossible</span>';
      return;
    }
    var enAttente = lireFile().length;
    var enLigne   = navigator.onLine;
    el.className  = 'net no-print ' + (enLigne ? 'on' : 'off');
    el.innerHTML  = I.net + '<span>' + (enLigne ? 'En ligne' : 'Hors ligne') +
                    (enAttente ? ' — ' + enAttente + ' fiche(s) en attente' : '') + '</span>';
  }

  /** Avertissement permanent en haut de page quand on est en file://. */
  function avertirHorsServeur() {
    if (!HORS_SERVEUR || document.getElementById('avertFile')) return;
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    var d = document.createElement('div');
    d.id = 'avertFile';
    d.className = 'envoi ko no-print';
    d.style.marginTop = '18px';
    d.innerHTML = I.ko +
      '<div><b>Page ouverte en mode fichier local — la transmission ne fonctionnera pas</b>' +
      "L'adresse commence par <code>file://</code>. Le navigateur isole ce type de page et " +
      'refuse toute connexion à Supabase.<br>Lancez <code>scripts\\3-servir-formulaire.cmd</code> ' +
      "puis ouvrez <code>http://localhost:5173</code>. La saisie, les exports et l'impression " +
      'restent utilisables ici.</div>';
    var header = wrap.querySelector('header.top');
    if (header && header.nextSibling) wrap.insertBefore(d, header.nextSibling);
    else wrap.appendChild(d);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 5. Transmission
   * ───────────────────────────────────────────────────────────────────────*/
  function transmettre() {
    var bouton = document.getElementById('rSend');
    var ref    = document.getElementById('refCode').textContent;
    var upeCode = UPE[data.upe_saisie] || 'non_defini';

    if (HORS_SERVEUR) {
      bandeau('ko', 'Le formulaire doit être ouvert via un serveur local',
        "Cette page a été ouverte directement depuis le disque (<code>file://</code>). " +
        "Le navigateur bloque alors tout échange avec Supabase.<br><br>" +
        "<b>Solution :</b> fermez cet onglet et double-cliquez sur " +
        "<code>scripts\\3-servir-formulaire.cmd</code>, puis ouvrez " +
        "<code>http://localhost:5173</code>.<br><br>" +
        "En attendant, la saisie reste utilisable : les boutons " +
        "<b>Export JSON</b>, <b>Export CSV</b> et <b>Imprimer</b> fonctionnent normalement.");
      return;
    }

    if (oui(data.consent_accept) !== true) {
      bandeau('ko', 'Consentement manquant',
        "La fiche ne peut pas être transmise sans le consentement de la Section A.");
      return;
    }
    if (!sb()) {
      bandeau('ko', 'Configuration Supabase absente',
        "Vérifiez js/config.js et le chargement de js/vendor/supabase.umd.js.");
      return;
    }

    bouton.disabled = true;
    bandeau('wait', 'Transmission en cours…', 'Envoi de la fiche <code>' + ref + '</code> vers la base PNDA.');

    var horsLigne = !navigator.onLine;
    if (horsLigne) {
      var n = empiler(versLigne(data, ref, {}));
      bouton.disabled = false;
      majBandeauReseau();
      bandeau('wait', 'Enregistré hors ligne',
        'Aucune connexion détectée. La fiche <code>' + ref + '</code> est conservée sur ce poste (' + n +
        ' en attente) et sera transmise automatiquement au retour du réseau. ' +
        'Les pièces jointes devront être rattachées lors d\'une saisie en ligne.');
      return;
    }

    deposerPieces(ref, upeCode)
      .then(function (chemins) {
        return sb().from(CFG.TABLE).insert(versLigne(data, ref, chemins));
      })
      .then(function (r) {
        if (r.error) throw new Error(r.error.message);
        bandeau('ok', 'Fiche transmise avec succès',
          'Référence <code>' + ref + '</code> enregistrée dans la base PNDA le ' +
          new Date().toLocaleString('fr-FR') + '. Conservez cette référence pour tout suivi.');
        bouton.innerHTML = I.ok + 'Fiche transmise';
        document.getElementById('rBack').disabled = true;
      })
      .catch(function (e) {
        var n = empiler(versLigne(data, ref, {}));
        majBandeauReseau();
        bouton.disabled = false;
        bandeau('ko', 'Transmission impossible',
          (e && e.message ? e.message : 'Erreur inconnue') +
          '<br>La fiche a été placée en file d\'attente (' + n +
          ') et sera renvoyée automatiquement. Vous pouvez aussi exporter le JSON en secours.');
      });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 6. Points d'entrée
   * ───────────────────────────────────────────────────────────────────────*/
  window.PNDA_brancherEnvoi = function () {
    var b = document.getElementById('rSend');
    if (b) b.onclick = transmettre;
    majBandeauReseau();
  };

  window.addEventListener('online',  function () {
    majBandeauReseau();
    if (!HORS_SERVEUR) viderFile();
  });
  window.addEventListener('offline', majBandeauReseau);
  document.addEventListener('DOMContentLoaded', function () {
    avertirHorsServeur();
    majBandeauReseau();
    if (!HORS_SERVEUR && navigator.onLine) viderFile();
  });
  avertirHorsServeur();
  majBandeauReseau();
})();

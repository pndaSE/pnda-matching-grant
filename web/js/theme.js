/* ============================================================================
 * PNDA — Matching Grant · bascule clair / sombre
 * ----------------------------------------------------------------------------
 * Trois états : « auto » (suit le réglage du système), « clair », « sombre ».
 * Le choix est mémorisé sur le poste. Le mode sombre reste le défaut : c'est
 * l'identité visuelle du logiciel, le clair sert aux bureaux très éclairés et
 * à l'impression.
 *
 * À charger AVANT le rendu (dans <head>) pour éviter le clignotement blanc au
 * chargement d'une page en mode sombre.
 * ==========================================================================*/
(function () {
  'use strict';

  var CLE = 'pnda_theme';
  var ETATS = ['auto', 'clair', 'sombre'];

  function lu(){
    try { var v = localStorage.getItem(CLE); return ETATS.indexOf(v) > -1 ? v : 'auto'; }
    catch (e) { return 'auto'; }
  }
  function ecrire(v){ try { localStorage.setItem(CLE, v); } catch (e) {} }

  /** Mode effectivement appliqué, une fois « auto » résolu. */
  function effectif(mode){
    if (mode !== 'auto') return mode;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
      ? 'clair' : 'sombre';
  }

  function appliquer(mode){
    var racine = document.documentElement;
    if (mode === 'auto') racine.removeAttribute('data-theme');
    else racine.setAttribute('data-theme', mode);
    racine.style.colorScheme = effectif(mode) === 'clair' ? 'light' : 'dark';
    window.dispatchEvent(new CustomEvent('pnda:theme', { detail:{ mode:mode, effectif:effectif(mode) } }));
  }

  var courant = lu();
  appliquer(courant);

  // Suivre le système tant que l'utilisateur n'a rien choisi explicitement
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var suivre = function () { if (courant === 'auto') appliquer('auto'); };
    if (mq.addEventListener) mq.addEventListener('change', suivre);
    else if (mq.addListener) mq.addListener(suivre);
  }

  var ICONES = {
    auto:   '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>',
    clair:  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    sombre: '<path d="M12 3a6.36 6.36 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'
  };
  var LIBELLE = { auto:'Auto', clair:'Clair', sombre:'Sombre' };

  function svg(nom){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
         + 'stroke-linecap="round" stroke-linejoin="round">' + ICONES[nom] + '</svg>';
  }

  function majBouton(b){
    b.innerHTML = svg(courant);
    var e = document.createElement('span');
    e.textContent = LIBELLE[courant];
    b.appendChild(e);
    b.title = 'Thème : ' + LIBELLE[courant]
            + (courant === 'auto' ? ' (suit le système : ' + effectif('auto') + ')' : '')
            + ' — cliquer pour changer';
    b.setAttribute('aria-label', b.title);
  }

  /** Insère le bouton de bascule dans un conteneur existant. */
  window.PNDA_boutonTheme = function (hote, classes){
    if (!hote) return null;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = classes || 'btn sm ghost';
    b.id = 'btnTheme';
    majBouton(b);
    b.addEventListener('click', function () {
      courant = ETATS[(ETATS.indexOf(courant) + 1) % ETATS.length];
      ecrire(courant); appliquer(courant); majBouton(b);
    });
    hote.appendChild(b);
    return b;
  };

  window.PNDA_theme = {
    get mode(){ return courant; },
    get effectif(){ return effectif(courant); }
  };
})();

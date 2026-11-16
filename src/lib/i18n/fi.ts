import type { en } from './en';

export const fi: Record<keyof typeof en, string> = {
  appName: 'Mastodon Tools',
  columnInteractions: 'Suosikit ja tehostukset',
  columnMentions: 'Maininnat',
  columnMessages: 'Yksityisviestit',
  columnPosts: 'Lähetetyt julkaisut',
  empty: 'Ei vielä mitään',
  noAccounts: 'Yhtään tiliä ei ole vielä liitetty',
  accounts: 'Tilit',
  addAccount: 'Lisää tili',
  serverLabel: 'Palvelin',
  serverPlaceholder: 'mastodon.example',
  connect: 'Yhdistä',
  remove: 'Poista',
  loginAgain: 'Kirjaudu uudelleen',
  loginAgainHint: 'Sovellus tarvitsee uusia oikeuksia',
  errorInvalidInstance: 'Anna palvelimen osoite, esim. mastodon.example',
  errorLoginFailed: 'Kirjautuminen epäonnistui. Yritä uudelleen.',
};

<script lang="ts">
  import { COLUMN_ICONS } from '$lib/columnIcons';
  import { COLUMN_TITLES, COLUMNS } from '$lib/feeds.svelte';
  import { t } from '$lib/i18n';
  import ConnectForm from './ConnectForm.svelte';
  import Logo from './Logo.svelte';
</script>

<main class="welcome">
  <div class="card">
    <Logo size={72} />
    <h2>{t('appName')}</h2>
    <p class="lead">{t('welcomeLead')}</p>
    <ul>
      {#each COLUMNS as id (id)}
        {@const Icon = COLUMN_ICONS[id]}
        <li><Icon size={18} aria-hidden="true" /> {t(COLUMN_TITLES[id])}</li>
      {/each}
    </ul>
    <ConnectForm />
    <p class="privacy">{t('welcomePrivacy')}</p>
  </div>
</main>

<style>
  .welcome {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    place-items: center;
    padding: 1.5rem 1rem;
  }
  .card {
    width: min(26rem, 100%);
    padding: 2rem 1.5rem;
    background: var(--ctp-mantle);
    border: 1px solid var(--ctp-surface0);
    border-radius: 0.9rem;
    text-align: center;
  }
  h2 {
    margin: 0.5rem 0 0.25rem;
    font-size: 1.4rem;
    color: var(--ctp-mauve);
  }
  .lead {
    margin: 0 0 1.25rem;
    color: var(--ctp-subtext1);
  }
  ul {
    list-style: none;
    margin: 0 0 1.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    background: var(--ctp-surface0);
    border-radius: 0.5rem;
    text-align: left;
  }
  li :global(svg) {
    color: var(--ctp-mauve);
    flex: none;
  }
  .privacy {
    margin: 1.25rem 0 0;
    font-size: 0.8rem;
    color: var(--ctp-overlay1);
  }
</style>

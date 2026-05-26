<script lang="ts">
  /**
   * Root component — view router + global UI.
   *
   * Each view is a self-contained Svelte file under src/views/.
   * The view store from $lib/state determines what mounts.
   */
  import { view } from '$lib/state';
  import Splash from '$views/Splash.svelte';
  import Auth from '$views/Auth.svelte';
  import Menu from '$views/Menu.svelte';
  import Toast from '$components/ui/Toast.svelte';
  import AppShell from '$components/layout/AppShell.svelte';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { audio } from '$lib/audio';

  // Lazily activate AudioEngine on first user gesture (browser requirement).
  onMount(() => {
    const activate = (): void => {
      audio.init();
      audio.resume();
    };
    window.addEventListener('pointerdown', activate, { once: false });
    window.addEventListener('keydown', activate, { once: false });
    return () => {
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
  });
</script>

{#if $view === 'splash'}
  <Splash />
{:else if $view === 'auth'}
  <Auth />
{:else if $view === 'menu'}
  <Menu />
{:else}
  <AppShell>
    <div class="placeholder">
      <h2>{$t('btn.back')} — coming next turn</h2>
      <p>View "{$view}" will be migrated in the next iteration.</p>
    </div>
  </AppShell>
{/if}

<Toast />

<style>
  :global(html), :global(body), :global(#app) { height: 100%; }

  .placeholder {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-2);
  }
  .placeholder h2 {
    font-family: var(--font-display);
    font-size: 32px;
    letter-spacing: 4px;
    color: var(--text);
    margin-bottom: 12px;
  }
</style>

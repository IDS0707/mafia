<script lang="ts">
  /**
   * TEMPORARY placeholder for the main menu.
   * Will be replaced with full Menu.svelte (sidebar + hero + hex actions + stats + reward)
   * in the next turn.
   */
  import { user, logout, go } from '$lib/state';
  import LangSwitch from '$components/ui/LangSwitch.svelte';
  import Button from '$components/ui/Button.svelte';
  import { t } from '$lib/i18n';

  function doLogout(): void {
    logout();
    go('auth');
  }
</script>

<section class="placeholder">
  <div class="top">
    <LangSwitch />
    <Button variant="ghost" onclick={doLogout}>{$t('nav.logoutBtn')}</Button>
  </div>

  <div class="hero">
    <h1>MAFIA — v2 Foundation</h1>
    <p>Hello, <strong>{$user?.name ?? 'Player'}</strong></p>
    <p class="muted">
      Foundation laid: AudioEngine, SFX, i18n (uz/ru/en), state stores,
      design tokens, type-safe Svelte 5.
    </p>
    <p class="muted">
      Next turn: Sidebar + Topbar + Menu hero + hex actions + game engine + views.
    </p>
  </div>
</section>

<style>
  .placeholder {
    min-height: 100vh;
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hero {
    margin: auto;
    text-align: center;
    max-width: 560px;
  }
  h1 {
    font-family: var(--font-display);
    font-size: 64px;
    letter-spacing: 8px;
    background: linear-gradient(180deg, #fff 0%, var(--red) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
  }
  p { margin-bottom: 12px; }
  .muted { color: var(--text-2); font-size: 13px; }
  strong { color: var(--red); }
</style>

<script lang="ts">
  /**
   * Sidebar — persistent left rail with nav + lang switch + logout.
   * Collapses on narrow viewports (icon-only).
   */
  import { view, go, logout } from '$lib/state';
  import { t } from '$lib/i18n';
  import { sfx } from '$lib/audio';
  import LangSwitch from '$components/ui/LangSwitch.svelte';
  import type { ViewName } from '$types/index';
  import type { Component } from 'svelte';

  type NavItem = {
    id: Exclude<ViewName, 'splash' | 'auth' | 'lobby' | 'game' | 'create'>;
    labelKey: 'nav.home' | 'nav.rooms' | 'nav.shop' | 'nav.leaderboard' | 'nav.profile';
    icon: string;
  };

  const items: NavItem[] = [
    { id: 'menu', labelKey: 'nav.home', icon: 'M3 12l9-8 9 8 M5 10v10h14V10' },
    { id: 'join', labelKey: 'nav.rooms', icon: 'M3 4h18v16H3z M3 10h18 M7 4v16' },
    { id: 'shop', labelKey: 'nav.shop', icon: 'M3 7h18l-2 12H5L3 7z M8 7V5a4 4 0 0 1 8 0v2' },
    { id: 'leaderboard', labelKey: 'nav.leaderboard', icon: 'M5 20V10 M12 20V4 M19 20v-7' },
    { id: 'profile', labelKey: 'nav.profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-7 8-7s8 3 8 7' },
  ];

  function navigate(id: ViewName): void {
    sfx.click();
    go(id);
  }

  function doLogout(): void {
    if (confirm($t('nav.logout'))) {
      logout();
      go('auth');
    }
  }
</script>

<aside class="sidebar">
  <a class="brand" href="#/" onclick={(e) => { e.preventDefault(); go('menu'); }}>
    <span class="logo-mark">M</span>
    <span class="logo-text">
      <span class="logo-title">MAFIA</span>
      <span class="logo-sub">{$t('splash.tag')}</span>
    </span>
  </a>

  <nav class="nav">
    {#each items as item}
      <button
        class="nav-item"
        class:active={$view === item.id}
        onclick={() => navigate(item.id)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          {#each item.icon.split(' M').map((p, i) => i === 0 ? p : 'M' + p) as path}
            <path d={path} />
          {/each}
        </svg>
        <span class="nav-label">{$t(item.labelKey)}</span>
      </button>
    {/each}
  </nav>

  <div class="bottom">
    <LangSwitch />
    <button class="logout" onclick={doLogout}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 12H4M9 8l-5 4 5 4" />
        <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" />
      </svg>
      <span>{$t('nav.logoutBtn')}</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    grid-area: sidebar;
    position: sticky;
    top: 0;
    height: 100vh;
    width: var(--sidebar-w);
    background: linear-gradient(180deg, #0a0d18 0%, #060810 100%);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    padding: 22px 16px 18px;
    z-index: var(--z-sidebar);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px 22px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 18px;
  }
  .logo-mark {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: 22px;
    color: #fff;
    background: linear-gradient(135deg, var(--red) 0%, var(--red-deep) 100%);
    box-shadow: 0 4px 14px rgba(255, 59, 59, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }
  .logo-title {
    font-family: var(--font-display);
    font-size: 22px;
    letter-spacing: 3.5px;
  }
  .logo-sub {
    font-size: 8px;
    letter-spacing: 2.5px;
    color: var(--text-3);
    margin-top: 4px;
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
    position: relative;
    transition: color var(--t-fast), background var(--t-fast);
  }
  .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
  .nav-item:hover { color: var(--text); background: rgba(255, 255, 255, 0.03); }
  .nav-item.active {
    color: #fff;
    background: linear-gradient(90deg, rgba(255, 59, 59, 0.18) 0%, rgba(255, 59, 59, 0.04) 100%);
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    background: var(--red);
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 10px rgba(255, 59, 59, 0.6);
  }

  .bottom {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .logout {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--line-2);
    color: var(--text-2);
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    transition: color var(--t-fast), border-color var(--t-fast);
  }
  .logout:hover {
    color: var(--red);
    border-color: rgba(255, 59, 59, 0.3);
  }
  .logout svg { width: 16px; height: 16px; }

  @media (max-width: 1024px) {
    .sidebar { padding: 18px 8px; }
    .logo-text, .nav-label, .logout span { display: none; }
    .brand { justify-content: center; padding: 4px 0 22px; }
    .nav-item { justify-content: center; padding: 14px 0; }
    .logout { justify-content: center; padding: 12px 0; }
  }
</style>

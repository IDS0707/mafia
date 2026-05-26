<script lang="ts">
  /**
   * Topbar — profile pill (left) + currency chips + icon actions (right).
   */
  import { user } from '$lib/state';
  import { sfx, audio } from '$lib/audio';
  import { get } from 'svelte/store';

  function toggleMusic(): void {
    sfx.click();
    audio.toggleBus('music');
  }
</script>

<header class="topbar">
  {#if $user}
    <a class="profile" href="#/menu">
      <div class="avatar {$user.avatar}"></div>
      <div class="info">
        <div class="name">{$user.name}</div>
        <div class="meta">
          <span class="lvl">LEVEL {$user.level}</span>
          <div class="xp"><span style="width: {Math.round(($user.xp / $user.xpNeeded) * 100)}%"></span></div>
          <span class="xpv">{$user.xp} / {$user.xpNeeded}</span>
        </div>
      </div>
    </a>
  {:else}
    <div></div>
  {/if}

  <div class="right">
    {#if $user}
      <div class="chip chip-gold">
        <span class="dot"></span>
        {$user.gold.toLocaleString()}
      </div>
      <div class="chip chip-violet">
        <span class="dot"></span>
        {$user.gems.toLocaleString()}
      </div>
    {/if}
    <button class="icn" onclick={toggleMusic} title="Music">
      {#if get(audio.settings).musicEnabled}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M15 9a3 3 0 0 1 0 6" />
          <path d="M18 6a7 7 0 0 1 0 12" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      {/if}
    </button>
    <button class="icn" title="Settings">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    </button>
  </div>
</header>

<style>
  .topbar {
    grid-area: topbar;
    position: sticky;
    top: 0;
    z-index: var(--z-topbar);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 14px 28px;
    height: var(--topbar-h);
    background: rgba(7, 9, 15, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--line);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text);
  }
  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg, #2a3146, #1a1f30);
  }
  .avatar.a-don { background: radial-gradient(circle at 50% 35%, #b88a5a 0%, #5a3820 50%, #1a0e08 100%); }
  .avatar.a-joker { background: radial-gradient(circle at 50% 35%, #6a8a4a 0%, #3a5020 50%, #0a1808 100%); }
  .avatar.a-azik { background: radial-gradient(circle at 50% 35%, #d4a6a0 0%, #8a5048 50%, #2a1410 100%); }
  .avatar.a-samurai { background: radial-gradient(circle at 50% 35%, #c8c8d0 0%, #5a5a6a 50%, #1a1a28 100%); }
  .avatar.a-cherry { background: radial-gradient(circle at 50% 35%, #f0c4cc 0%, #b06070 50%, #3a1820 100%); }
  .avatar.a-queen { background: radial-gradient(circle at 50% 35%, #e0c0e8 0%, #80507a 50%, #2a142a 100%); }
  .avatar.a-umid { background: radial-gradient(circle at 50% 35%, #c4a47a 0%, #80604a 50%, #2a1a10 100%); }
  .avatar.a-shadow { background: radial-gradient(circle at 50% 35%, #5a5a6a 0%, #2a2a3a 50%, #0a0a14 100%); }
  .avatar.a-black { background: radial-gradient(circle at 50% 35%, #d44040 0%, #6a1a1a 50%, #1a0204 100%); }
  .avatar.a-mrn { background: radial-gradient(circle at 50% 35%, #7a4a4a 0%, #4a2a2a 50%, #1a0808 100%); }

  .info { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 700; }
  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 3px;
  }
  .lvl {
    font-size: 9px;
    letter-spacing: 1.5px;
    color: var(--gold-2);
    font-weight: 700;
  }
  .xp {
    width: 120px;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: var(--r-pill);
    overflow: hidden;
  }
  .xp span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--red), #ff7070);
    border-radius: var(--r-pill);
    box-shadow: 0 0 6px rgba(255, 59, 59, 0.5);
  }
  .xpv {
    font-size: 9px;
    color: var(--text-3);
    letter-spacing: 0.5px;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    border-radius: var(--r-pill);
    font-size: 12px;
    font-weight: 700;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.02);
  }
  .chip-gold {
    border-color: rgba(212, 160, 23, 0.3);
    color: var(--gold-2);
    background: rgba(212, 160, 23, 0.06);
  }
  .chip-violet {
    border-color: rgba(122, 92, 255, 0.3);
    color: var(--violet-2);
    background: rgba(122, 92, 255, 0.06);
  }
  .chip-gold .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold-2);
    box-shadow: 0 0 6px rgba(212, 160, 23, 0.6);
  }
  .chip-violet .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--violet-2);
    box-shadow: 0 0 6px rgba(122, 92, 255, 0.6);
  }

  .icn {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line-2);
    color: var(--text-2);
    transition: color var(--t-fast), background var(--t-fast);
  }
  .icn:hover { color: var(--text); background: rgba(255, 255, 255, 0.08); }
  .icn svg { width: 16px; height: 16px; }

  @media (max-width: 700px) {
    .topbar { padding: 12px 16px; gap: 8px; }
    .meta .xp { width: 60px; }
    .info { display: none; }
    .chip { padding: 6px 10px; font-size: 11px; }
  }
</style>

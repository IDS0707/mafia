<script lang="ts">
  /**
   * Main Menu — cinematic hero + 3 hex action buttons + stats + daily reward.
   */
  import { user, go } from '$lib/state';
  import { t } from '$lib/i18n';
  import { sfx } from '$lib/audio';
  import { showToast } from '$lib/state';
  import { addReward } from '$lib/state';
  import { writable, get } from 'svelte/store';
  import { readString, writeString } from '$lib/utils/storage';
  import AppShell from '$components/layout/AppShell.svelte';

  function quickPlay(): void {
    sfx.click();
    showToast('Quick Play — coming next turn');
  }
  function createRoom(): void {
    sfx.click();
    go('create');
  }
  function joinRoom(): void {
    sfx.click();
    go('join');
  }

  // Daily reward — 24h cooldown
  const REWARD_KEY = 'daily';
  function dayIndex(): number { return Math.floor(Date.now() / 86400000); }
  const lastClaim = writable(parseInt(readString(REWARD_KEY, '0'), 10));
  const canClaim = $derived(get(lastClaim) < dayIndex());

  let timerText = $state('');
  $effect(() => {
    const tick = (): void => {
      if (canClaim) {
        timerText = 'READY';
      } else {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0);
        const diff = Math.max(0, next.getTime() - now.getTime());
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        timerText = `${h}:${m}:${s}`;
      }
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => clearInterval(iv);
  });

  function claim(): void {
    if (!canClaim) return;
    sfx.notify();
    addReward(0, 500, false); // +500 gold (no XP, not a win)
    lastClaim.set(dayIndex());
    writeString(REWARD_KEY, String(dayIndex()));
    showToast('+500 ⬢   +25 ◆');
  }

  const winRate = $derived(($user?.games ?? 0) > 0
    ? Math.round((($user?.wins ?? 0) / ($user?.games ?? 1)) * 100)
    : 0);
</script>

<AppShell>
  <div class="layout">

    <!-- HERO -->
    <div class="hero">
      <svg class="hero-bg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sky" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#3a0a14"/>
            <stop offset="55%" stop-color="#0e0410"/>
            <stop offset="100%" stop-color="#000"/>
          </radialGradient>
          <radialGradient id="redfog" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stop-color="rgba(255,40,40,0.55)"/>
            <stop offset="50%" stop-color="rgba(120,10,20,0.25)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
          <linearGradient id="body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#0a0306"/>
            <stop offset="100%" stop-color="#000"/>
          </linearGradient>
          <radialGradient id="face" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="rgba(120,30,30,0.45)"/>
            <stop offset="100%" stop-color="#000"/>
          </radialGradient>
        </defs>

        <rect width="1200" height="700" fill="url(#sky)"/>
        <rect width="1200" height="700" fill="url(#redfog)"/>

        <!-- Distant skyline -->
        <g opacity="0.4" fill="#0a050a">
          <path d="M0 480 L0 700 L1200 700 L1200 480 L1170 480 L1170 440 L1140 440 L1140 470 L1120 470 L1120 420 L1090 420 L1090 460 L1060 460 L1060 430 L1030 430 L1030 470 L1000 470 L1000 440 L970 440 L970 420 L940 420 L940 470 L910 470 L910 440 L880 440 L880 470 L850 470 L850 420 L820 420 L820 460 L790 460 L790 440 L760 440 L760 470 L730 470 L730 410 L700 410 L700 470 L670 470 L670 430 L640 430 L640 470 L610 470 L610 440 L580 440 L580 410 L550 410 L550 470 L520 470 L520 430 L490 430 L490 460 L460 460 L460 420 L430 420 L430 470 L400 470 L400 440 L370 440 L370 410 L340 410 L340 470 L310 470 L310 430 L280 430 L280 470 L250 470 L250 440 L220 440 L220 460 L190 460 L190 420 L160 420 L160 470 L130 470 L130 430 L100 430 L100 450 L70 450 L70 420 L40 420 L40 470 L10 470 L10 440 L0 440 Z"/>
        </g>

        <!-- Closer skyline -->
        <g fill="#050308">
          <path d="M0 520 L0 700 L1200 700 L1200 520 L1170 520 L1170 470 L1140 470 L1140 510 L1120 510 L1120 460 L1080 460 L1080 520 L1050 520 L1050 480 L1020 480 L1020 510 L990 510 L990 450 L960 450 L960 520 L920 520 L920 470 L890 470 L890 510 L860 510 L860 480 L830 480 L830 520 L790 520 L790 460 L760 460 L760 510 L730 510 L730 470 L700 470 L700 520 L660 520 L660 480 L630 480 L630 510 L600 510 L600 450 L570 450 L570 520 L530 520 L530 470 L500 470 L500 510 L470 510 L470 480 L440 480 L440 520 L400 520 L400 460 L370 460 L370 510 L340 510 L340 470 L310 470 L310 520 L270 520 L270 480 L240 480 L240 510 L210 510 L210 450 L180 450 L180 520 L140 520 L140 470 L110 470 L110 510 L80 510 L80 480 L50 480 L50 520 L20 520 L20 470 L0 470 Z"/>
        </g>

        <!-- Window lights -->
        <g fill="#FF3B3B" opacity="0.55">
          {#each [[1145,490],[1090,470],[1098,485],[1030,495],[970,475],[900,495],[870,490],[800,475],[745,490],[670,495],[580,475],[510,480],[420,495],[385,485],[320,495],[250,490],[190,475],[125,485],[60,490]] as [x, y]}
            <rect x={x} y={y} width="3" height="4"/>
          {/each}
        </g>

        <!-- Red fog horizon glow -->
        <ellipse cx="600" cy="530" rx="700" ry="80" fill="rgba(255,40,40,0.32)"/>

        <!-- Mafia silhouette -->
        <g transform="translate(600,250)">
          <path fill="url(#body)" d="M0 60 C-70 60, -120 100, -135 145 L-175 158 C-188 162, -195 175, -188 188 L-160 232 C-188 256, -210 296, -222 340 C-235 386, -240 430, -240 470 L-240 540 L240 540 L240 470 C240 430, 235 386, 222 340 C210 296, 188 256, 160 232 L188 188 C195 175, 188 162, 175 158 L135 145 C120 100, 70 60, 0 60 Z"/>
          <ellipse cx="0" cy="142" rx="98" ry="58" fill="url(#face)"/>
          <ellipse cx="0" cy="92" rx="180" ry="32" fill="#040106"/>
          <ellipse cx="0" cy="88" rx="180" ry="6" fill="#000"/>
          <path fill="#040106" d="M-105 92 C-105 32, -65 0, 0 0 C65 0, 105 32, 105 92 L92 96 C84 50, 50 22, 0 22 C-50 22, -84 50, -92 96 Z"/>
          <ellipse cx="0" cy="26" rx="98" ry="14" fill="#000" opacity="0.55"/>
          <path d="M-92 92 Q0 104 92 92 L92 104 Q0 116 -92 104 Z" fill="#000"/>
          <path fill="#000" opacity="0.6" d="M0 232 L-44 540 L-36 540 L-4 280 L4 280 L36 540 L44 540 Z"/>
          <rect x="-7" y="240" width="14" height="160" fill="#1a0204" opacity="0.7"/>
        </g>
      </svg>

      <div class="overlay">
        <span class="eyebrow">{$t('hero.welcome')}</span>
        <h1 class="name">{($user?.name ?? 'Player').toUpperCase()}</h1>
        <p class="tagline">{$t('hero.lede')}</p>
      </div>
    </div>

    <!-- SIDE STACK -->
    <div class="side">
      <div class="card">
        <div class="head">
          <span>{$t('stats.your')}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M3 12l4 4 14-14"/>
          </svg>
        </div>
        <div class="stats">
          <div class="row">
            <span class="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
            </span>
            <span class="lbl">{$t('stats.games')}</span>
            <span class="val">{$user?.games ?? 0}</span>
          </div>
          <div class="row">
            <span class="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2L15 9l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
            </span>
            <span class="lbl">{$t('stats.wins')}</span>
            <span class="val">{$user?.wins ?? 0}</span>
          </div>
          <div class="row">
            <span class="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
            </span>
            <span class="lbl">{$t('stats.rate')}</span>
            <span class="val">{winRate}%</span>
          </div>
          <div class="row">
            <span class="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/></svg>
            </span>
            <span class="lbl">{$t('stats.level')}</span>
            <span class="val">{$user?.level ?? 1}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="head"><span>{$t('reward.daily')}</span></div>
        <div class="reward">
          <div class="chest">
            <svg viewBox="0 0 100 80" fill="none">
              <defs>
                <linearGradient id="chestG" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#8a5a2a"/>
                  <stop offset="100%" stop-color="#3a1f08"/>
                </linearGradient>
                <linearGradient id="chestM" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#f5d97a"/>
                  <stop offset="100%" stop-color="#8a6310"/>
                </linearGradient>
              </defs>
              <rect x="14" y="30" width="72" height="42" rx="3" fill="url(#chestG)" stroke="#2a1408" stroke-width="1.5"/>
              <path d="M14 30 Q50 8, 86 30 L86 44 Q50 22, 14 44 Z" fill="url(#chestG)" stroke="#2a1408" stroke-width="1.5"/>
              <rect x="14" y="46" width="72" height="4" fill="url(#chestM)"/>
              <rect x="46" y="48" width="8" height="14" fill="url(#chestM)" stroke="#2a1408" stroke-width="1"/>
              <circle cx="50" cy="54" r="1.5" fill="#2a1408"/>
            </svg>
          </div>
          <div class="timer" class:ready={canClaim}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <span>{timerText}</span>
          </div>
          <button class="claim" disabled={!canClaim} onclick={claim}>
            {canClaim ? $t('reward.claim') : $t('reward.claimed')}
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- HEX ACTIONS -->
  <div class="hex-row">
    <button class="hex hex-red" onclick={quickPlay}>
      <div class="hex-shape">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="32" r="10" fill="currentColor"/>
          <path d="M22 60c0-12 8-18 18-18s18 6 18 18" fill="currentColor"/>
          <circle cx="20" cy="28" r="6" fill="currentColor" opacity="0.7"/>
          <circle cx="60" cy="28" r="6" fill="currentColor" opacity="0.7"/>
        </svg>
      </div>
      <div class="hex-title">{$t('hero.quick')}</div>
      <div class="hex-sub">{$t('tile.quick.sub')}</div>
    </button>

    <button class="hex hex-gold" onclick={createRoom}>
      <div class="hex-shape">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="32" r="10" fill="currentColor"/>
          <path d="M22 60c0-12 8-18 18-18s18 6 18 18" fill="currentColor"/>
          <circle cx="58" cy="20" r="6" fill="currentColor"/>
          <path d="M55 16 L61 16 M58 13 L58 19" stroke="#000" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="hex-title">{$t('hero.create')}</div>
      <div class="hex-sub">{$t('tile.create.sub')}</div>
    </button>

    <button class="hex hex-violet" onclick={joinRoom}>
      <div class="hex-shape">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="32" r="10" fill="currentColor"/>
          <path d="M22 60c0-12 8-18 18-18s18 6 18 18" fill="currentColor"/>
          <path d="M10 40 L24 40 M20 36 L24 40 L20 44" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>
      <div class="hex-title">{$t('hero.join')}</div>
      <div class="hex-sub">{$t('tile.join.sub')}</div>
    </button>
  </div>
</AppShell>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 20px;
    margin-bottom: 24px;
  }
  @media (max-width: 1100px) {
    .layout { grid-template-columns: 1fr; }
  }

  /* ---- Hero ---- */
  .hero {
    position: relative;
    min-height: 420px;
    border-radius: var(--r-lg);
    overflow: hidden;
    border: 1px solid var(--line-2);
    box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .overlay {
    position: absolute;
    left: 36px;
    right: 36px;
    bottom: 48px;
    text-align: center;
    z-index: 2;
  }
  .eyebrow {
    display: block;
    font-size: 12px;
    letter-spacing: 4px;
    color: var(--text-2);
    font-weight: 700;
    margin-bottom: 8px;
  }
  .name {
    font-family: var(--font-display);
    font-size: clamp(36px, 4.5vw, 64px);
    letter-spacing: 5px;
    line-height: 1;
    margin: 0 0 14px;
    font-weight: 400;
    background: linear-gradient(180deg, #ff8a8a 0%, var(--red) 60%, #8a0e0e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 32px rgba(255, 59, 59, 0.5);
  }
  .tagline {
    font-size: 13px;
    color: var(--text-2);
    letter-spacing: 1px;
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.55;
  }

  /* ---- Side stack ---- */
  .side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .card {
    background: linear-gradient(180deg, #131826 0%, #0c1018 100%);
    border: 1px solid var(--line-2);
    border-radius: var(--r-lg);
    overflow: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    font-size: 11px;
    letter-spacing: 2.5px;
    color: var(--text-2);
    font-weight: 700;
    border-bottom: 1px solid var(--line);
  }
  .head svg { width: 14px; height: 14px; color: var(--gold-2); }

  .stats { padding: 6px 8px; }
  .row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    transition: background var(--t-fast);
  }
  .row:hover { background: rgba(255, 255, 255, 0.02); }
  .ic {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    color: var(--gold-2);
    background: rgba(212, 160, 23, 0.1);
    border: 1px solid rgba(212, 160, 23, 0.25);
    border-radius: 6px;
  }
  .ic svg { width: 14px; height: 14px; }
  .lbl { font-size: 12px; color: var(--text-2); letter-spacing: 0.5px; }
  .val {
    font-family: var(--font-display);
    font-size: 22px;
    letter-spacing: 1px;
    color: var(--text);
  }

  .reward {
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .chest {
    width: 110px;
    height: 90px;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 6px 18px rgba(212, 160, 23, 0.4));
    animation: chestFloat 3s ease-in-out infinite alternate;
  }
  @keyframes chestFloat {
    from { transform: translateY(0); }
    to { transform: translateY(-4px); }
  }
  .chest svg { width: 100%; height: 100%; }
  .timer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--red);
    font-family: var(--font-display);
    font-size: 18px;
    letter-spacing: 2px;
  }
  .timer svg { width: 14px; height: 14px; }
  .timer.ready {
    color: var(--green);
    text-shadow: 0 0 12px rgba(46, 204, 113, 0.6);
    animation: rewardReady 1.4s ease-in-out infinite alternate;
  }
  @keyframes rewardReady {
    from { opacity: 0.8; }
    to { opacity: 1; transform: scale(1.04); }
  }
  .claim {
    width: 100%;
    padding: 11px;
    background: linear-gradient(180deg, var(--red) 0%, var(--red-2) 100%);
    color: #fff;
    font-weight: 700;
    letter-spacing: 1.5px;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(255, 59, 59, 0.3);
    transition: transform var(--t-fast), box-shadow var(--t-fast);
  }
  .claim:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(255, 59, 59, 0.45);
  }
  .claim:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ---- Hex actions ---- */
  .hex-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 700px) {
    .hex-row { grid-template-columns: 1fr; }
  }
  .hex {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 28px 18px 22px;
    background: linear-gradient(180deg, #14171f 0%, #0a0d14 100%);
    border: 1px solid var(--line-2);
    border-radius: var(--r-lg);
    overflow: hidden;
    transition: transform var(--t-mid), border-color var(--t-mid);
    box-shadow: var(--shadow-md);
  }
  .hex::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, currentColor, transparent 60%);
    opacity: 0.12;
    pointer-events: none;
  }
  .hex:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.18);
  }
  .hex:hover .hex-shape { transform: scale(1.06) translateY(-2px); }

  .hex-shape {
    position: relative;
    width: 88px;
    height: 100px;
    display: grid;
    place-items: center;
    background-color: currentColor;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    transition: transform var(--t-mid);
    filter: drop-shadow(0 6px 18px currentColor);
  }
  .hex-shape::before {
    content: '';
    position: absolute;
    inset: 3px;
    background: linear-gradient(180deg, #1a0810 0%, #050308 100%);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }
  .hex-shape svg {
    position: relative;
    z-index: 1;
    width: 46px;
    height: 46px;
    color: currentColor;
  }
  .hex-red { color: var(--red); }
  .hex-gold { color: var(--gold-2); }
  .hex-violet { color: var(--violet-2); }

  .hex-title {
    position: relative;
    z-index: 1;
    font-family: var(--font-display);
    font-size: 22px;
    letter-spacing: 4px;
    color: var(--text);
    margin-top: 6px;
  }
  .hex-sub {
    position: relative;
    z-index: 1;
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.5px;
  }
</style>

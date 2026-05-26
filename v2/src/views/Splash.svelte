<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { go } from '$lib/state';
  import { user } from '$lib/state';
  import { t } from '$lib/i18n';
  import { audio } from '$lib/audio';
  import { get } from 'svelte/store';

  let pct = $state(0);
  let interval: number;

  onMount(() => {
    interval = window.setInterval(() => {
      pct = Math.min(100, pct + 3 + Math.random() * 8);
      if (pct >= 100) {
        clearInterval(interval);
        window.setTimeout(() => {
          // Try to gently set initial calm mode (will only play after user gesture)
          audio.setMode('calm');
          go(get(user) ? 'menu' : 'auth');
        }, 500);
      }
    }, 130);
  });

  onDestroy(() => clearInterval(interval));
</script>

<section class="splash">
  <div class="rain"></div>
  <div class="skyline"></div>
  <div class="fog"></div>

  <div class="figure">
    <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMax meet">
      <path
        d="M100 30c-22 0-40 14-46 32l-12 4c-4 1-6 5-4 9l8 14-8 18v160h124V107l-8-18 8-14c2-4 0-8-4-9l-12-4c-6-18-24-32-46-32z"
        fill="#000"
      />
      <ellipse cx="100" cy="42" rx="58" ry="10" fill="#000" />
      <ellipse cx="100" cy="38" rx="48" ry="6" fill="#000" />
    </svg>
  </div>

  <div class="glow"></div>

  <div class="brand">
    <div class="title">MAF<span class="i-dot">I</span>A</div>
    <div class="sub">{$t('splash.tag')}</div>
  </div>

  <div class="loader">
    <div class="loader-fill" style="transform: scaleX({pct / 100})"></div>
  </div>
  <div class="pct">{Math.round(pct)}%</div>
</section>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: var(--z-splash);
    overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 35%, rgba(120, 20, 20, 0.7) 0%, transparent 65%),
      linear-gradient(180deg, #0a0408 0%, #050204 100%);
  }
  .rain {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(transparent 90%, rgba(255,255,255,0.12) 90%, rgba(255,255,255,0.12) 95%, transparent 95%),
      linear-gradient(transparent 80%, rgba(255,255,255,0.08) 80%, rgba(255,255,255,0.08) 85%, transparent 85%);
    background-size: 3px 22px, 5px 38px;
    background-position: 0 0, 17px 0;
    animation: rain 0.8s linear infinite;
    opacity: 0.35;
  }
  @keyframes rain { to { background-position: 0 22px, 17px 38px; } }

  .skyline {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 28%;
    background:
      linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%),
      repeating-linear-gradient(90deg, #0a0408 0 22px, #050103 22px 24px, #0a0408 24px 46px, #050103 46px 50px, #080205 50px 90px, #050103 90px 92px);
    clip-path: polygon(0 50%, 4% 30%, 7% 45%, 12% 25%, 17% 40%, 22% 20%, 28% 35%, 34% 18%, 40% 32%, 47% 22%, 53% 38%, 60% 25%, 66% 42%, 72% 28%, 78% 45%, 85% 32%, 92% 48%, 100% 35%, 100% 100%, 0 100%);
  }
  .fog {
    position: absolute;
    inset: 25% 0 0 0;
    background: radial-gradient(ellipse at 50% 100%, rgba(255,40,40,0.45) 0%, rgba(255,40,40,0.15) 35%, transparent 70%);
    filter: blur(40px);
    animation: fog 6s ease-in-out infinite alternate;
    mix-blend-mode: screen;
  }
  @keyframes fog { from { opacity: 0.55; transform: scale(1); } to { opacity: 0.95; transform: scale(1.08); } }

  .figure {
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 28%;
    max-width: 280px;
    height: 75%;
    filter: drop-shadow(0 0 40px rgba(0,0,0,0.95));
  }
  .figure :global(svg) { width: 100%; height: 100%; }

  .glow {
    position: absolute;
    bottom: 28%; left: 50%;
    transform: translateX(-50%);
    width: 60%; height: 35%;
    background: radial-gradient(ellipse, rgba(255,80,40,0.4) 0%, transparent 60%);
    filter: blur(38px);
    mix-blend-mode: screen;
    animation: glow 3s ease-in-out infinite alternate;
  }
  @keyframes glow { from { opacity: 0.6; } to { opacity: 1; } }

  .brand {
    position: absolute;
    bottom: 130px;
    left: 0; right: 0;
    text-align: center;
    z-index: 5;
  }
  .title {
    font-family: var(--font-display);
    font-size: clamp(54px, 9vw, 96px);
    letter-spacing: 22px;
    background: linear-gradient(180deg, #fff 0%, #ffb0b0 50%, #ff3030 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 24px rgba(255,59,59,0.5));
    margin-bottom: 8px;
    margin-left: 22px;
  }
  .i-dot {
    color: var(--red);
    -webkit-text-fill-color: var(--red);
    position: relative;
  }
  .i-dot::before {
    content: '';
    position: absolute;
    top: -10px; left: 50%;
    transform: translateX(-50%);
    width: 10px; height: 10px;
    background: var(--red);
    border-radius: 50%;
    box-shadow: 0 0 14px var(--red);
  }
  .sub {
    font-size: 13px;
    letter-spacing: 8px;
    color: var(--red);
    font-weight: 600;
  }
  .loader {
    position: absolute;
    bottom: 70px; left: 50%;
    transform: translateX(-50%);
    width: 280px; height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 3px;
    overflow: hidden;
  }
  .loader-fill {
    height: 100%; width: 100%;
    background: linear-gradient(90deg, var(--red-deep), var(--red), #ff7070);
    box-shadow: 0 0 12px var(--red);
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 200ms ease-out;
  }
  .pct {
    position: absolute;
    bottom: 46px; left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    letter-spacing: 3px;
    color: var(--text-2);
  }
</style>

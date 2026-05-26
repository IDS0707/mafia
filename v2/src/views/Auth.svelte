<script lang="ts">
  import { t } from '$lib/i18n';
  import { createUser, go } from '$lib/state';
  import LangSwitch from '$components/ui/LangSwitch.svelte';
  import Button from '$components/ui/Button.svelte';
  import { audio, sfx } from '$lib/audio';

  type Mode = 'login' | 'register';
  let mode = $state<Mode>('login');
  let name = $state('');
  let email = $state('');
  let pass = $state('');
  let error = $state('');

  function toggleMode(): void {
    mode = mode === 'login' ? 'register' : 'login';
    error = '';
  }

  function submit(e: Event): void {
    e.preventDefault();
    if (!email.trim() || !pass.trim()) {
      error = $t('auth.errReq');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      error = $t('auth.errName');
      return;
    }
    audio.init();
    audio.resume();
    sfx.notify();
    createUser({ name, email });
    go('menu');
  }

  function oauthLogin(provider: 'google' | 'telegram'): void {
    audio.init();
    audio.resume();
    sfx.notify();
    createUser({
      name: provider === 'google' ? 'Google_Player' : 'TG_Player',
      email: `${provider}@oauth`,
    });
    go('menu');
  }
</script>

<section class="auth">
  <div class="bg"></div>
  <LangSwitch floating />

  <div class="wrap">
    <div class="card">
      <div class="icon">
        <svg viewBox="0 0 64 48" width="56" height="42">
          <path
            d="M32 6c-12 0-22 8-22 18 0 4 2 8 6 10-2 2-4 4-4 6h40c0-2-2-4-4-6 4-2 6-6 6-10 0-10-10-18-22-18z"
            fill="#1a1a22"
            stroke="#FF3B3B"
            stroke-width="1"
          />
        </svg>
      </div>

      <h3 class="title">
        {mode === 'login' ? $t('auth.welcome') : $t('auth.createAcc')}
      </h3>
      <p class="sub">
        {mode === 'login' ? $t('auth.loginSub') : $t('auth.registerSub')}
      </p>

      <form class="form" onsubmit={submit}>
        {#if mode === 'register'}
          <label class="field">
            <span class="field-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </span>
            <input type="text" placeholder={$t('auth.name')} bind:value={name} autocomplete="username" />
          </label>
        {/if}

        <label class="field">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 7 9-7" />
            </svg>
          </span>
          <input type="text" placeholder={$t('auth.email')} bind:value={email} autocomplete="username" required />
        </label>

        <label class="field">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input type="password" placeholder={$t('auth.pass')} bind:value={pass} autocomplete="current-password" required />
        </label>

        <div class="error">{error}</div>

        <Button type="submit" full silent>
          {mode === 'login' ? $t('auth.login') : $t('auth.register')}
        </Button>
      </form>

      <div class="or"><span>{$t('auth.or')}</span></div>
      <div class="oauth-row">
        <button class="oauth" onclick={() => oauthLogin('google')}>
          <span class="g">G</span> Google
        </button>
        <button class="oauth" onclick={() => oauthLogin('telegram')}>
          <span class="tg">✈</span> Telegram
        </button>
      </div>

      <div class="foot">
        <span>{mode === 'login' ? $t('auth.noAccount') : $t('auth.haveAccount')}</span>
        <button class="toggle" onclick={toggleMode}>
          {mode === 'login' ? $t('auth.toggleReg') : $t('auth.toggleLog')}
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  .auth {
    position: relative;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 40px 16px;
  }
  .bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(circle at 25% 20%, rgba(255,59,59,0.15) 0%, transparent 50%),
      radial-gradient(circle at 75% 80%, rgba(122,92,255,0.1) 0%, transparent 60%),
      linear-gradient(180deg, #0a0a14 0%, #050608 100%);
  }
  .bg::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(transparent 90%, rgba(255,255,255,0.08) 90%, rgba(255,255,255,0.08) 95%, transparent 95%);
    background-size: 3px 22px;
    animation: rain 0.8s linear infinite;
    opacity: 0.2;
  }
  @keyframes rain { to { background-position: 0 22px; } }

  .wrap {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
  }
  .card {
    padding: 36px 32px;
    background: rgba(21, 26, 37, 0.7);
    border: 1px solid var(--line-2);
    border-radius: var(--r-md);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .icon { display: flex; justify-content: center; margin-bottom: 12px; }
  .title {
    text-align: center;
    font-size: 22px;
    letter-spacing: 4px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .sub {
    text-align: center;
    font-size: 12px;
    color: var(--text-2);
    margin-bottom: 22px;
    letter-spacing: 1px;
  }
  .form { display: flex; flex-direction: column; gap: 10px; }
  .field {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--line-2);
    border-radius: 10px;
    padding: 0 14px;
    transition: border-color var(--t-fast);
  }
  .field:focus-within { border-color: rgba(255, 59, 59, 0.5); }
  .field-icon {
    color: var(--text-3);
    margin-right: 10px;
    display: inline-flex;
  }
  .field-icon :global(svg) { width: 16px; height: 16px; }
  .field input {
    flex: 1;
    font-size: 13px;
    padding: 13px 0;
    font-family: inherit;
  }
  .field input::placeholder { color: var(--text-3); }
  .error {
    font-size: 12px;
    color: var(--red);
    min-height: 16px;
    text-align: center;
    letter-spacing: 0.5px;
    margin-top: 6px;
  }
  .or {
    text-align: center;
    margin: 16px 0 12px;
    position: relative;
    color: var(--text-3);
    font-size: 11px;
  }
  .or::before, .or::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 28%;
    height: 1px;
    background: var(--line-2);
  }
  .or::before { left: 4%; }
  .or::after { right: 4%; }

  .oauth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .oauth {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line-2);
    border-radius: 10px;
    color: var(--text);
    font-size: 12px;
    font-weight: 600;
    transition: background var(--t-fast);
  }
  .oauth:hover { background: rgba(255, 255, 255, 0.08); }
  .g { color: #ea4335; font-weight: 800; font-size: 14px; }
  .tg { color: #29b6f6; font-weight: 800; }

  .foot {
    text-align: center;
    font-size: 12px;
    color: var(--text-2);
    margin-top: 18px;
  }
  .toggle {
    color: var(--red);
    font-weight: 700;
    margin-left: 4px;
    text-decoration: none;
  }
  .toggle:hover { text-decoration: underline; }
</style>

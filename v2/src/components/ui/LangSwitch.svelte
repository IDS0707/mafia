<script lang="ts">
  import { lang, setLang } from '$lib/i18n';
  import { sfx } from '$lib/audio';
  import type { Lang } from '$types/index';

  interface Props {
    floating?: boolean;
  }
  let { floating = false }: Props = $props();

  const items: Lang[] = ['uz', 'ru', 'en'];

  function select(code: Lang): void {
    sfx.click();
    setLang(code);
  }
</script>

<div class="lang-switch" class:floating>
  {#each items as code}
    <button
      class="lang-pill"
      class:active={$lang === code}
      onclick={() => select(code)}
    >
      {code.toUpperCase()}
    </button>
  {/each}
</div>

<style>
  .lang-switch {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line-2);
    border-radius: var(--r-pill);
  }
  .floating {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: var(--z-sticky);
    background: rgba(7, 9, 15, 0.85);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  .lang-pill {
    color: var(--text-3);
    padding: 6px 11px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    border-radius: var(--r-pill);
    transition: color var(--t-fast), background var(--t-fast);
  }
  .lang-pill:hover { color: var(--text-2); }
  .lang-pill.active {
    background: var(--red);
    color: #fff;
    box-shadow: 0 2px 8px rgba(255, 59, 59, 0.45);
  }
</style>

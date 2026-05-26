<script lang="ts">
  import { sfx } from '$lib/audio';

  interface Props {
    variant?: 'primary' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    full?: boolean;
    onclick?: (e: MouseEvent) => void;
    silent?: boolean; // disable SFX
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    full = false,
    onclick,
    silent = false,
    children,
  }: Props = $props();

  function handle(e: MouseEvent): void {
    if (disabled) return;
    if (!silent) sfx.click();
    onclick?.(e);
  }
</script>

<button
  {type}
  {disabled}
  class="btn variant-{variant} size-{size}"
  class:full
  onclick={handle}
  onmouseenter={() => !silent && !disabled && sfx.hover()}
>
  {@render children?.()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-sans);
    font-weight: 700;
    letter-spacing: 1.5px;
    border-radius: var(--r-md);
    transition: transform var(--t-fast), box-shadow var(--t-fast),
      background var(--t-fast), border-color var(--t-fast);
    user-select: none;
    white-space: nowrap;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn:not(:disabled):active { transform: scale(0.98); }

  /* ---- Variants ---- */
  .variant-primary {
    background: linear-gradient(180deg, var(--red) 0%, var(--red-2) 100%);
    color: #fff;
    box-shadow: 0 6px 18px rgba(255, 59, 59, 0.3);
  }
  .variant-primary:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 26px rgba(255, 59, 59, 0.45);
  }

  .variant-ghost {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--line-2);
  }
  .variant-ghost:not(:disabled):hover {
    border-color: var(--line-3);
    background: rgba(255, 255, 255, 0.04);
  }

  .variant-icon {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line-2);
    color: var(--text-2);
    padding: 0 !important;
  }
  .variant-icon:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }

  /* ---- Sizes ---- */
  .size-sm { padding: 8px 14px; font-size: 12px; }
  .size-md { padding: 11px 18px; font-size: 13px; }
  .size-lg { padding: 14px 22px; font-size: 14px; letter-spacing: 2.5px; }

  .variant-icon.size-sm { width: 32px; height: 32px; border-radius: var(--r-sm); }
  .variant-icon.size-md { width: 38px; height: 38px; border-radius: 10px; }
  .variant-icon.size-lg { width: 44px; height: 44px; border-radius: 12px; }

  .full { width: 100%; }
</style>

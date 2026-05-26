<script lang="ts">
  import { toast } from '$lib/state';
</script>

{#if $toast.msg}
  <div class="toast" class:visible={$toast.visible}>{$toast.msg}</div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    z-index: var(--z-toast);
    background: var(--card);
    border: 1px solid var(--line-2);
    border-radius: 10px;
    padding: 12px 18px;
    font-size: 13px;
    color: var(--text);
    box-shadow: var(--shadow-md);
    opacity: 0;
    transition: opacity 200ms, transform 200ms;
    pointer-events: none;
  }
  .toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>

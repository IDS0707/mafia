<script lang="ts">
  /**
   * AppShell — sidebar + topbar + main area grid.
   * Wraps all post-auth views.
   */
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }
  let { children }: Props = $props();
</script>

<div class="shell">
  <Sidebar />
  <Topbar />
  <main class="main">
    {@render children?.()}
  </main>
</div>

<style>
  .shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    grid-template-rows: var(--topbar-h) 1fr;
    grid-template-areas:
      'sidebar topbar'
      'sidebar main';
  }
  .main {
    grid-area: main;
    padding: 24px var(--pad-x) 56px;
    max-width: 1480px;
    width: 100%;
    margin: 0 auto;
  }
</style>

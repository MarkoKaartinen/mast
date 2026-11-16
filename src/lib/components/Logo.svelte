<script lang="ts">
  let { size = 24 }: { size?: number } = $props();
</script>

<!-- The app icon without its background: a bell with an unread dot -->
<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
  <path class="bell" d="M32 12c-9 0-15 7-15 16v8l-5 8h40l-5-8v-8c0-9-6-16-15-16z" />
  <path class="bell" d="M26 48a6 6 0 0 0 12 0z" />
  <circle class="dot" cx="47" cy="17" r="8" />
</svg>

<style>
  .bell {
    fill: var(--ctp-mauve);
  }
  /* The ring around the dot has the color of the bar behind it */
  .dot {
    fill: var(--ctp-green);
    stroke: var(--ctp-mantle);
    stroke-width: 3;
  }
</style>

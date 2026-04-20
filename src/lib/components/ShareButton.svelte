<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { formatNumber } from '$lib/calculator';
  import { t, locale } from '$lib/stores/locale';

  let {
    emoji,
    count,
    beverageName,
    portfolioValue,
    currency,
    showValue = true,
    badgeIcon = '',
    badgeTitle = '',
  }: {
    emoji: string;
    count: number;
    beverageName: string;
    portfolioValue: number;
    currency: string;
    showValue?: boolean;
    badgeIcon?: string;
    badgeTitle?: string;
  } = $props();

  let generating = $state(false);
  let previewUrl = $state('');
  let errorMessage = $state('');
  let dialogRef = $state<HTMLDialogElement | null>(null);

  // `canvas.getContext('2d')` is nullable on paper: very old browsers or
  // hardened privacy modes (Firefox "resistFingerprinting", Tor Browser) can
  // return null. Throwing here turns it into a controllable error path that
  // the caller surfaces via `errorMessage`.
  function buildCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('canvas 2d context unavailable');
    }

    // Bierdeckel-style share card
    // Background: warm paper
    ctx.fillStyle = '#faf5ea';
    ctx.fillRect(0, 0, 1200, 630);

    // Card container with subtle border
    const cx = 80,
      cy = 50,
      cw = 1040,
      ch = 530;
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 16);
    ctx.fill();
    ctx.strokeStyle = '#e9d9b1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top accent line
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx, cy, cw, 4);

    // Eyebrow label
    ctx.fillStyle = '#92400e';
    ctx.font = '600 14px monospace';
    ctx.textAlign = 'left';
    ctx.letterSpacing = '2px';
    ctx.fillText($t.shareCardEyebrow, cx + 40, cy + 50);

    // parqet.beer wordmark (top right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2b1d0e';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('parqet', cx + cw - 100, cy + 50);
    ctx.fillStyle = '#d97706';
    ctx.fillText('.beer', cx + cw - 40, cy + 50);

    // Emoji
    ctx.textAlign = 'left';
    ctx.font = '80px system-ui, -apple-system, sans-serif';
    ctx.fillText(emoji, cx + cw - 140, cy + 200);

    // Big count number
    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 140px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(formatNumber(count, $locale), cx + 40, cy + 260);

    // Beverage name
    ctx.fillStyle = '#b45309';
    ctx.font = '500 28px monospace';
    ctx.fillText(`× ${beverageName}`, cx + 40, cy + 310);

    // Rank badge pill (right-aligned, same row as beverage name)
    if (badgeIcon && badgeTitle) {
      const badgeText = `${badgeIcon}  ${badgeTitle}`;
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      const badgeW = ctx.measureText(badgeText).width + 32;
      const badgeH = 36;
      const badgeX = cx + cw - 40 - badgeW;
      const badgeY = cy + 290;
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#92400e';
      ctx.textAlign = 'left';
      ctx.fillText(badgeText, badgeX + 16, badgeY + 25);
    }

    // Divider
    ctx.fillStyle = '#e9d9b1';
    ctx.fillRect(cx + 40, cy + 340, cw - 80, 1);

    // Portfolio value (if shown)
    if (showValue) {
      ctx.fillStyle = '#92400e';
      ctx.font = '500 22px monospace';
      ctx.fillText(
        `${formatNumber(Math.round(portfolioValue), $locale)} ${currency}`,
        cx + 40,
        cy + 380
      );
    }

    // Footer
    ctx.fillStyle = '#8a6d3b';
    ctx.font = '500 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`parqet.beer · ${$t.shareCardDisclaimer}`, cx + 40, cy + ch - 30);

    return canvas;
  }

  function revokePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  }

  // `HTMLCanvasElement.toBlob` may yield null when the browser refuses the
  // requested format, OOMs, or (again) fingerprinting defences kick in.
  // Promise-wrap it so `showPreview` and `shareImage` can share the same
  // happy path without the `!` non-null assertion.
  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      }, 'image/png');
    });
  }

  async function showPreview() {
    revokePreview();
    errorMessage = '';
    try {
      const canvas = buildCanvas();
      const blob = await canvasToBlob(canvas);
      previewUrl = URL.createObjectURL(blob);
      dialogRef?.showModal();
    } catch {
      errorMessage = $t.shareError;
      dialogRef?.showModal();
    }
  }

  function closePreview() {
    dialogRef?.close();
    revokePreview();
    errorMessage = '';
  }

  // Backdrop click dismiss: the native `<dialog>` pseudo-element fills the
  // full viewport, so a click whose target is the dialog itself (not any
  // inner element) means the user hit the backdrop.
  function handleDialogClick(e: MouseEvent) {
    if (e.target === dialogRef) {
      closePreview();
    }
  }

  async function shareImage() {
    generating = true;
    errorMessage = '';
    try {
      const canvas = buildCanvas();
      const blob = await canvasToBlob(canvas);

      if (
        navigator.share &&
        navigator.canShare?.({ files: [new File([blob], 'parqet-beer.png')] })
      ) {
        await navigator.share({
          title: $t.shareTitle(formatNumber(count, $locale), beverageName, emoji),
          text: $t.shareText(formatNumber(count, $locale), beverageName, emoji),
          url: 'https://parqet.beer',
          files: [new File([blob], 'parqet-beer.png', { type: 'image/png' })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parqet-beer.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      closePreview();
    } catch (err) {
      // AbortError fires when the user dismisses the native share sheet —
      // that's a normal cancel, not something to surface as an error.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      errorMessage = $t.shareError;
    } finally {
      generating = false;
    }
  }
</script>

<button
  class="share-tab inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest cursor-pointer transition-transform"
  style="padding: 5px 14px 6px; background: var(--amber-900, #78350f); color: #fef3c7; border: none; border-radius: 0 0 6px 6px; box-shadow: 0 3px 0 rgba(120, 53, 15, 0.2)"
  onclick={(e) => {
    e.stopPropagation();
    showPreview();
  }}
  disabled={generating}
  title={$t.shareButtonTitle}
>
  ↗ {$t.shareLabel}
</button>

<!--
  Native <dialog>: handles ESC, focus trap, and focus-return to the invoking
  button automatically. `onclose` fires for any close (ESC, form dismiss, or
  our explicit .close()) and is where we release the object URL.
-->
<dialog
  bind:this={dialogRef}
  onclick={handleDialogClick}
  onclose={revokePreview}
  class="bg-transparent p-0 max-w-2xl w-[calc(100%-2rem)] backdrop:bg-black/50 open:flex open:items-center open:justify-center fixed inset-0 m-auto h-fit"
  aria-label={$t.sharePreview}
>
  <div class="rounded-2xl shadow-2xl w-full p-4" style="background: var(--card)">
    <p class="text-sm text-amber-600 font-medium mb-3 text-center">
      {$t.sharePreview}
    </p>
    {#if errorMessage}
      <p
        role="alert"
        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-center"
      >
        {errorMessage}
      </p>
    {:else if previewUrl}
      <img
        src={previewUrl}
        alt={$t.sharePreviewAlt(formatNumber(count, $locale), beverageName)}
        class="w-full rounded-lg border border-amber-200 mb-4"
      />
    {/if}
    <div class="flex gap-2 justify-center">
      <button
        type="button"
        class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        onclick={shareImage}
        disabled={generating}
      >
        {generating ? $t.shareGenerating : $t.shareAction}
      </button>
      <button
        type="button"
        class="px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
        style="background: var(--card); border-color: var(--border); color: var(--highlight)"
        onclick={closePreview}
      >
        {$t.shareCancel}
      </button>
    </div>
  </div>
</dialog>

<style>
  .share-tab:hover {
    transform: translateY(1px);
  }
</style>

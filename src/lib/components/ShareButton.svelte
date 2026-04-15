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
  }: {
    emoji: string;
    count: number;
    beverageName: string;
    portfolioValue: number;
    currency: string;
    showValue?: boolean;
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

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#fffbeb');
    gradient.addColorStop(1, '#fef3c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, 1200, 8);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('parqet.beer', 600, 80);

    ctx.fillStyle = '#92400e';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText($t.shareCardSubtitle, 600, 120);

    ctx.font = '80px system-ui, -apple-system, sans-serif';
    ctx.fillText(emoji, 600, 230);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 120px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatNumber(count, $locale), 600, 370);

    ctx.fillStyle = '#b45309';
    ctx.font = '40px system-ui, -apple-system, sans-serif';
    ctx.fillText(beverageName, 600, 430);

    if (showValue) {
      ctx.fillStyle = '#92400e';
      ctx.font = '28px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        $t.shareCardPortfolioValue(
          `${formatNumber(Math.round(portfolioValue), $locale)} ${currency}`
        ),
        600,
        490
      );
    }

    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 560, 1200, 2);
    ctx.fillStyle = '#b45309';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText(`parqet.beer — ${$t.shareCardDisclaimer}`, 600, 600);

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
  class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
  onclick={(e) => {
    e.stopPropagation();
    showPreview();
  }}
  disabled={generating}
  title={$t.shareButtonTitle}
>
  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
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
  class="bg-transparent p-0 max-w-lg w-[calc(100%-2rem)] backdrop:bg-black/50"
  aria-label={$t.sharePreview}
>
  <div class="bg-white rounded-2xl shadow-2xl w-full p-4">
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
        class="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
        onclick={closePreview}
      >
        {$t.shareCancel}
      </button>
    </div>
  </div>
</dialog>

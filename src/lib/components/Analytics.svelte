<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  // Cloudflare Web Analytics beacon — cookieless, privacy-friendly pageview
  // tracking. We use the CF stack already (Pages + KV), so this needs no extra
  // third party and no cookie banner.
  //
  // Conditional: the beacon only renders when `PUBLIC_CF_BEACON_TOKEN` is set.
  // Locally and in preview the var is empty, so nothing is injected and the
  // privacy posture ("no analytics") holds until a real token is configured in
  // production. We read it via `$env/dynamic/public` (runtime) rather than
  // `$env/static/public` so an unset token never fails the build.
  //
  // LIMIT (be honest): CF Web Analytics records pageviews + Core Web Vitals
  // only. It CANNOT emit custom events (e.g. "OAuth completed", "beverage tab
  // clicked") without Cloudflare Zaraz. So the card's questions "how many
  // finish OAuth / which beverages are popular" are only partially answered:
  // a dedicated `/dashboard` pageview count is a usable OAuth-completion proxy
  // (the dashboard is post-login), but per-beverage popularity needs Zaraz or
  // a custom event sink and is intentionally out of scope for this MVP.
  import { env } from '$env/dynamic/public';
  import { beaconConfig } from '$lib/analytics';

  const config = beaconConfig(env['PUBLIC_CF_BEACON_TOKEN']);
</script>

<svelte:head>
  {#if config}
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={config}
    ></script>
  {/if}
</svelte:head>

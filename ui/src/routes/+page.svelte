<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { wled, fetchWifiSsid, UNCONFIGURED_SSID } from '$lib/wled.svelte';
	import Player from '$lib/player/Player.svelte';

	onMount(() => {
		wled.start();
		// fresh device (factory-default SSID) → onboard first
		fetchWifiSsid().then((ssid) => {
			if (ssid === UNCONFIGURED_SSID) goto(resolve('/setup'), { replaceState: true });
		});
	});
</script>

<svelte:head>
	<title>WLED</title>
</svelte:head>

{#if wled.state}
	<Player />
{:else}
	<main class="flex min-h-dvh items-center justify-center bg-[#050506]">
		<p class="text-zinc-500">Connecting to device…</p>
	</main>
{/if}

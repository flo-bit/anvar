<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { wled, fetchWifiSsid, UNCONFIGURED_SSID } from '$lib/wled.svelte';

	// IDs match wled00/FX.h: FX_MODE_STATIC, FX_MODE_BREATH, FX_MODE_RAINBOW_CYCLE
	const EFFECTS = [
		{ id: 0, fallbackName: 'Solid' },
		{ id: 2, fallbackName: 'Breathe' },
		{ id: 9, fallbackName: 'Rainbow' }
	];

	onMount(() => {
		wled.start();
		// fresh device (factory-default SSID) → onboard first
		fetchWifiSsid().then((ssid) => {
			if (ssid === UNCONFIGURED_SSID) goto(resolve('/setup'), { replaceState: true });
		});
	});

	const activeFx = $derived(wled.state?.seg[0]?.fx ?? -1);
	const connectionLabel = $derived(
		{
			live: 'live',
			polling: 'polling',
			connecting: 'connecting…',
			offline: 'offline'
		}[wled.connection]
	);

	function effectName(effect: (typeof EFFECTS)[number]): string {
		return wled.effects[effect.id] ?? effect.fallbackName;
	}
</script>

<svelte:head>
	<title>WLED</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-zinc-950 px-6 py-10 text-zinc-100">
	<header class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-wide">WLED</h1>
		<div class="flex items-center gap-2">
			<span
				class="rounded-full px-3 py-1 text-xs font-medium
			{wled.connection === 'live'
					? 'bg-emerald-500/15 text-emerald-400'
					: wled.connection === 'offline'
						? 'bg-red-500/15 text-red-400'
						: 'bg-amber-500/15 text-amber-400'}"
			>
				{connectionLabel}
			</span>
			<a
				href="#/settings"
				aria-label="Settings"
				class="rounded-lg p-2 text-zinc-400 hover:text-zinc-100"
			>
				<svg
					viewBox="0 0 24 24"
					class="size-5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.3 4.3a1.7 1.7 0 0 1 3.4 0l.1.6a1.7 1.7 0 0 0 2.5 1l.5-.3a1.7 1.7 0 0 1 2.4 2.4l-.3.5a1.7 1.7 0 0 0 1 2.5l.6.1a1.7 1.7 0 0 1 0 3.4l-.6.1a1.7 1.7 0 0 0-1 2.5l.3.5a1.7 1.7 0 0 1-2.4 2.4l-.5-.3a1.7 1.7 0 0 0-2.5 1l-.1.6a1.7 1.7 0 0 1-3.4 0l-.1-.6a1.7 1.7 0 0 0-2.5-1l-.5.3a1.7 1.7 0 0 1-2.4-2.4l.3-.5a1.7 1.7 0 0 0-1-2.5l-.6-.1a1.7 1.7 0 0 1 0-3.4l.6-.1a1.7 1.7 0 0 0 1-2.5l-.3-.5a1.7 1.7 0 0 1 2.4-2.4l.5.3a1.7 1.7 0 0 0 2.5-1l.1-.6Z"
					/>
					<circle cx="12" cy="12" r="3" />
				</svg>
			</a>
		</div>
	</header>

	{#if wled.state}
		<button
			onclick={() => wled.togglePower()}
			class="mx-auto flex size-32 items-center justify-center rounded-full border-4 transition-colors
			{wled.state.on
				? 'border-amber-400 bg-amber-400/10 text-amber-300'
				: 'border-zinc-700 bg-zinc-900 text-zinc-500'}"
			aria-pressed={wled.state.on}
		>
			<svg viewBox="0 0 24 24" class="size-12" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" d="M12 3v9m6.4-6.4a9 9 0 1 1-12.8 0" />
			</svg>
			<span class="sr-only">Power {wled.state.on ? 'off' : 'on'}</span>
		</button>

		<section class="flex flex-col gap-2">
			<label for="brightness" class="text-sm text-zinc-400">
				Brightness — {Math.round((wled.state.bri / 255) * 100)}%
			</label>
			<input
				id="brightness"
				type="range"
				min="1"
				max="255"
				value={wled.state.bri}
				oninput={(e) => wled.setBrightness(e.currentTarget.valueAsNumber)}
				class="accent-amber-400"
				disabled={!wled.state.on}
			/>
		</section>

		<section class="flex flex-col gap-2">
			<h2 class="text-sm text-zinc-400">Effect</h2>
			<div class="grid grid-cols-3 gap-3">
				{#each EFFECTS as effect (effect.id)}
					<button
						onclick={() => wled.setEffect(effect.id)}
						class="rounded-xl border px-3 py-4 text-sm font-medium transition-colors
						{activeFx === effect.id
							? 'border-amber-400 bg-amber-400/10 text-amber-300'
							: 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'}"
					>
						{effectName(effect)}
					</button>
				{/each}
			</div>
		</section>
	{:else}
		<p class="m-auto text-zinc-500">Connecting to device…</p>
	{/if}
</main>

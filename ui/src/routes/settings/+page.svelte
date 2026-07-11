<script lang="ts">
	import { onMount } from 'svelte';
	import {
		wled,
		fetchWifiSsid,
		fetchCfgDetails,
		UNCONFIGURED_SSID,
		type CfgDetails
	} from '$lib/wled.svelte';
	import { look } from '$lib/look.svelte';
	import WifiForm from '$lib/WifiForm.svelte';
	import Slider from '$lib/dock/Slider.svelte';
	import Toggle from '$lib/settings/Toggle.svelte';

	// firmware-served page, deliberately outside the app's hash router
	const stockSettingsUrl = '/settings';

	let ssid = $state<string | null>(null);
	let details = $state<CfgDetails | null>(null);
	let wifiOpen = $state(false);
	let advOpen = $state(false);

	let editingName = $state(false);
	let nameDraft = $state('');

	onMount(() => {
		wled.start(); // idempotent — settings can be deep-linked directly
		fetchWifiSsid().then((s) => (ssid = s));
		fetchCfgDetails().then((d) => (details = d));
	});

	const nl = $derived(wled.state?.nl);
	const udpn = $derived(wled.state?.udpn);
	const deviceName = $derived(wled.info?.name ?? 'WLED');

	function startEditName() {
		nameDraft = deviceName;
		editingName = true;
	}

	async function saveName() {
		if (!editingName) return;
		editingName = false;
		const name = nameDraft.trim();
		if (name && name !== deviceName) await wled.setDeviceName(name);
	}
</script>

<svelte:head>
	<title>WLED — Settings</title>
</svelte:head>

<main class="min-h-dvh bg-[#0A0A0C] text-[#F0EFEC]">
	<div class="mx-auto max-w-[480px] px-5 pt-5 pb-16">
		<a
			href="#/"
			class="-ml-2 inline-flex items-center gap-[5px] rounded-full py-[7px] pr-3 pl-2 text-[13px] font-medium text-[rgba(240,239,236,0.6)] transition-colors hover:bg-white/5 hover:text-[#F0EFEC]"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 6l-6 6 6 6" />
			</svg>
			Back
		</a>
		<h1 class="mt-[14px] mb-[22px] text-2xl font-bold tracking-[-0.3px]">Settings</h1>

		<div class="flex flex-col gap-[14px]">
			<!-- device: name + wifi -->
			<section class="rounded-2xl border border-white/7 bg-[#131318] px-4 py-[2px]">
				{#if editingName}
					<div class="flex items-center justify-between gap-3 py-[10px]">
						<label for="device-name" class="text-[13.5px]">Name</label>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							id="device-name"
							type="text"
							bind:value={nameDraft}
							maxlength="32"
							autofocus
							onblur={saveName}
							onkeydown={(e) => e.key === 'Enter' && saveName()}
							class="w-40 rounded-lg border-white/10 bg-white/5 px-2 py-1 text-right text-[13.5px] text-[#F0EFEC] focus:border-white/25 focus:ring-0"
						/>
					</div>
				{:else}
					<button
						onclick={startEditName}
						class="flex w-full cursor-pointer items-center justify-between py-[14px] text-left"
					>
						<span class="text-[13.5px]">Name</span>
						<span class="text-[13.5px] text-[rgba(240,239,236,0.6)]">{deviceName}</span>
					</button>
				{/if}
				<button
					onclick={() => (wifiOpen = !wifiOpen)}
					class="flex w-full cursor-pointer items-center justify-between border-t border-white/5 py-[14px] text-left"
				>
					<span class="text-[13.5px]">Wi-Fi</span>
					<span class="flex items-center gap-2 text-[13.5px] text-[rgba(240,239,236,0.6)]">
						{ssid === UNCONFIGURED_SSID ? 'not set up' : (ssid ?? '…')}
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-200"
							style:transform={wifiOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
						>
							<path d="M9 6l6 6-6 6" />
						</svg>
					</span>
				</button>
				{#if wifiOpen}
					<div class="border-t border-white/5 py-4">
						<WifiForm />
					</div>
				{/if}
			</section>

			<!-- nightlight -->
			{#if nl}
				<section class="rounded-2xl border border-white/7 bg-[#131318] px-4 pt-[2px] pb-3">
					<div class="flex items-center justify-between py-[14px]">
						<div>
							<div class="text-[13.5px]">Nightlight</div>
							<div class="mt-[2px] text-[11.5px] text-[rgba(240,239,236,0.4)]">
								Fades out slowly so you can drift off
							</div>
						</div>
						<Toggle on={nl.on} label="Nightlight" onchange={(on) => wled.setNightlight({ on })} />
					</div>
					<div class="transition-opacity duration-200" style:opacity={nl.on ? 1 : 0.35}>
						<div class="flex items-baseline justify-between">
							<span class="text-[13px] text-[rgba(240,239,236,0.55)]">Fade over</span>
							<span class="font-mono text-[12.5px]">{nl.dur} min</span>
						</div>
						<Slider
							value={nl.dur}
							min={1}
							max={60}
							fill={look.accent}
							label="Nightlight duration"
							onchange={(dur) => wled.setNightlight({ dur })}
						/>
					</div>
				</section>
			{/if}

			<!-- advanced -->
			<section class="rounded-2xl border border-white/7 bg-[#131318] px-4 py-[2px]">
				<button
					onclick={() => (advOpen = !advOpen)}
					class="flex w-full cursor-pointer items-center justify-between py-[14px] text-left"
				>
					<div>
						<div class="text-[13.5px]">Advanced</div>
						<div class="mt-[2px] text-[11.5px] text-[rgba(240,239,236,0.4)]">
							Firmware, pins, sync — the fiddly stuff
						</div>
					</div>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(240,239,236,0.5)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="shrink-0 transition-transform duration-200"
						style:transform={advOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
					>
						<path d="M9 6l6 6-6 6" />
					</svg>
				</button>
				{#if advOpen}
					{#if wled.info?.ver}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<span class="text-[13.5px]">Firmware</span>
							<span class="font-mono text-[12.5px] text-[rgba(240,239,236,0.6)]"
								>{wled.info.ver}</span
							>
						</div>
					{/if}
					{#if wled.info?.leds?.count}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<span class="text-[13.5px]">LED count</span>
							<span class="font-mono text-[12.5px] text-[rgba(240,239,236,0.6)]"
								>{wled.info.leds.count}</span
							>
						</div>
					{/if}
					{#if details?.ledPin != null}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<span class="text-[13.5px]">Data pin</span>
							<span class="font-mono text-[12.5px] text-[rgba(240,239,236,0.6)]"
								>GPIO {details.ledPin}</span
							>
						</div>
					{/if}
					{#if wled.info?.ip}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<span class="text-[13.5px]">IP address</span>
							<span class="font-mono text-[12.5px] text-[rgba(240,239,236,0.6)]"
								>{wled.info.ip}</span
							>
						</div>
					{/if}
					{#if details?.mdns}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<span class="text-[13.5px]">Local name</span>
							<span class="font-mono text-[12.5px] text-[rgba(240,239,236,0.6)]"
								>{details.mdns}.local</span
							>
						</div>
					{/if}
					{#if udpn}
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<div>
								<div class="text-[13.5px]">Sync · send</div>
								<div class="mt-[2px] text-[11.5px] text-[rgba(240,239,236,0.4)]">
									Broadcast changes to other lights
								</div>
							</div>
							<Toggle
								on={udpn.send}
								label="Sync send"
								onchange={(send) => wled.setSync({ send })}
							/>
						</div>
						<div class="flex items-center justify-between border-t border-white/5 py-3">
							<div>
								<div class="text-[13.5px]">Sync · receive</div>
								<div class="mt-[2px] text-[11.5px] text-[rgba(240,239,236,0.4)]">
									Follow along with other lights
								</div>
							</div>
							<Toggle
								on={udpn.recv}
								label="Sync receive"
								onchange={(recv) => wled.setSync({ recv })}
							/>
						</div>
					{/if}
					<div class="border-t border-white/5 py-3 text-[12.5px] text-[rgba(240,239,236,0.45)]">
						LEDs, presets and everything else live in the
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- firmware URL, not an app route -->
						<a href={stockSettingsUrl} data-sveltekit-reload class="text-amber-400 underline"
							>stock settings</a
						> for now.
					</div>
				{/if}
			</section>
		</div>
	</div>
</main>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		fetchWifiSsid,
		fetchNetworks,
		saveWifiAndReboot,
		deviceReachable,
		UNCONFIGURED_SSID,
		type WifiNetwork
	} from '$lib/wled.svelte';

	let ssid = $state('');
	let psk = $state('');
	let phase = $state<'edit' | 'saving' | 'rebooting' | 'back-online' | 'error'>('edit');

	// null = scanning unavailable (e.g. USB dev bridge) → section hidden
	let networks = $state<WifiNetwork[]>([]);
	let scanState = $state<'scanning' | 'done' | 'unavailable'>('scanning');
	let scanAlive = true;

	onMount(async () => {
		const current = await fetchWifiSsid();
		if (current && current !== UNCONFIGURED_SSID) ssid = current;
		scan();
	});
	onDestroy(() => (scanAlive = false));

	async function scan() {
		scanState = 'scanning';
		// each poll returns cached results and re-arms the scan; empty = still scanning
		for (let attempt = 0; attempt < 8 && scanAlive; attempt++) {
			const found = await fetchNetworks();
			if (found === null) {
				scanState = 'unavailable';
				return;
			}
			if (found.length > 0) {
				networks = found;
				break;
			}
			await new Promise((r) => setTimeout(r, 1500));
		}
		scanState = 'done';
	}

	function pick(network: WifiNetwork) {
		ssid = network.ssid;
		document.getElementById('psk')?.focus();
	}

	/** 0-3 bars from RSSI (dBm) */
	function strength(rssi: number): number {
		return rssi > -55 ? 3 : rssi > -67 ? 2 : rssi > -78 ? 1 : 0;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		phase = 'saving';
		if (!(await saveWifiAndReboot(ssid.trim(), psk))) {
			phase = 'error';
			return;
		}
		phase = 'rebooting';
		// give the reboot a head start, then wait for the device to answer again
		// (only happens if we're still on the same network, e.g. credentials updated over LAN)
		setTimeout(pollUntilReachable, 5000);
	}

	async function pollUntilReachable() {
		if (phase !== 'rebooting') return;
		if (await deviceReachable()) phase = 'back-online';
		else setTimeout(pollUntilReachable, 3000);
	}
</script>

{#if phase === 'edit' || phase === 'saving' || phase === 'error'}
	{#if scanState !== 'unavailable'}
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<span class="text-sm text-zinc-400">Nearby networks</span>
				{#if scanState === 'scanning'}
					<span class="text-xs text-zinc-500">scanning…</span>
				{:else}
					<button type="button" onclick={scan} class="text-xs text-amber-400 underline">
						rescan
					</button>
				{/if}
			</div>
			{#if networks.length > 0}
				<ul class="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
					{#each networks as network (network.ssid)}
						<li>
							<button
								type="button"
								onclick={() => pick(network)}
								class="flex w-full items-center gap-3 bg-zinc-900 px-4 py-3 text-left transition-colors hover:bg-zinc-800
								{ssid === network.ssid ? 'text-amber-300' : 'text-zinc-200'}"
							>
								<span class="flex-1 truncate text-sm font-medium">{network.ssid}</span>
								{#if network.enc !== 0}
									<svg
										viewBox="0 0 24 24"
										class="size-3.5 shrink-0 text-zinc-500"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="5" y="11" width="14" height="9" rx="2" />
										<path d="M8 11V7a4 4 0 0 1 8 0v4" />
									</svg>
								{/if}
								<span class="flex shrink-0 items-end gap-0.5" title="{network.rssi} dBm">
									{#each [0, 1, 2, 3] as bar (bar)}
										<span
											class="w-1 rounded-sm {bar <= strength(network.rssi)
												? 'bg-amber-400'
												: 'bg-zinc-700'}"
											style="height: {5 + bar * 3}px"
										></span>
									{/each}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else if scanState === 'done'}
				<p class="text-sm text-zinc-500">No networks found.</p>
			{/if}
		</div>
	{/if}

	<form onsubmit={save} class="flex flex-col gap-4 {scanState !== 'unavailable' ? 'mt-4' : ''}">
		<div class="flex flex-col gap-1">
			<label for="ssid" class="text-sm text-zinc-400">Network name</label>
			<input
				id="ssid"
				type="text"
				bind:value={ssid}
				required
				maxlength="32"
				autocapitalize="off"
				autocorrect="off"
				placeholder="My WiFi"
				class="rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:ring-amber-400"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label for="psk" class="text-sm text-zinc-400">Password</label>
			<input
				id="psk"
				type="password"
				bind:value={psk}
				maxlength="64"
				placeholder="••••••••"
				class="rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:ring-amber-400"
			/>
		</div>
		{#if phase === 'error'}
			<p class="text-sm text-red-400">
				Could not reach the device — check the connection and try again.
			</p>
		{/if}
		<button
			type="submit"
			disabled={phase === 'saving'}
			class="rounded-xl bg-amber-400 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
		>
			{phase === 'saving' ? 'Saving…' : 'Save & connect'}
		</button>
	</form>
{:else if phase === 'rebooting'}
	<div class="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
		<p class="font-medium text-amber-300">Rebooting & connecting to “{ssid}”…</p>
		<ol class="list-inside list-decimal space-y-1 text-sm text-zinc-400">
			<li>
				If you're on the <span class="text-zinc-200">WLED-AP</span> network, rejoin your normal WiFi now.
			</li>
			<li>
				Then open <a href="http://wled.local" class="text-amber-400 underline">http://wled.local</a> —
				the light shows up there once it's connected.
			</li>
		</ol>
		<p class="text-xs text-zinc-500">
			Wrong password? The device reopens the WLED-AP hotspot so you can try again.
		</p>
	</div>
{:else if phase === 'back-online'}
	<div class="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
		<p class="font-medium text-emerald-400">Device is back online.</p>
		<a href="#/" class="text-amber-400 underline">Go to controls</a>
	</div>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchWifiSsid,
		saveWifiAndReboot,
		deviceReachable,
		UNCONFIGURED_SSID
	} from '$lib/wled.svelte';

	let ssid = $state('');
	let psk = $state('');
	let phase = $state<'edit' | 'saving' | 'rebooting' | 'back-online' | 'error'>('edit');

	onMount(async () => {
		const current = await fetchWifiSsid();
		if (current && current !== UNCONFIGURED_SSID) ssid = current;
	});

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
	<form onsubmit={save} class="flex flex-col gap-4">
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

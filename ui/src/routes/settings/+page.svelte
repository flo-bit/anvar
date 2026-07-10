<script lang="ts">
	import WifiForm from '$lib/WifiForm.svelte';

	// firmware-served page, deliberately outside the app's hash router
	const stockSettingsUrl = '/settings';
</script>

<svelte:head>
	<title>WLED — Settings</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-zinc-950 px-6 py-10 text-zinc-100">
	<header class="flex items-center gap-3">
		<a
			href="#/"
			aria-label="Back to controls"
			class="rounded-lg p-2 text-zinc-400 hover:text-zinc-100"
		>
			<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold tracking-wide">Settings</h1>
	</header>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-medium tracking-wide text-zinc-400 uppercase">WiFi</h2>
		<WifiForm />
	</section>

	<section class="flex flex-col gap-2 border-t border-zinc-800 pt-6">
		<h2 class="text-sm font-medium tracking-wide text-zinc-400 uppercase">Device</h2>
		<p class="text-sm text-zinc-500">
			LEDs, presets and everything else still live in the
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- firmware URL, not an app route -->
			<a href={stockSettingsUrl} data-sveltekit-reload class="text-amber-400 underline"
				>stock settings</a
			>
			for now.
		</p>
	</section>
</main>

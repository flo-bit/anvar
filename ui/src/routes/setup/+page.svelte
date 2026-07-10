<script lang="ts">
	import WifiForm from '$lib/WifiForm.svelte';
</script>

<svelte:head>
	<title>WLED — Setup</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-zinc-950 px-6 py-12 text-zinc-100">
	<header class="flex flex-col gap-3">
		<div
			class="flex size-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10"
		>
			<svg
				viewBox="0 0 24 24"
				class="size-8 text-amber-300"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 3v2m6.4.6-1.5 1.5M21 12h-2M5.6 5.6l1.5 1.5M3 12h2m4 8h6m-5-3h4m-4-3.2a5 5 0 1 1 4 0c-.7.4-1 1.2-1 2.2h-2c0-1-.3-1.8-1-2.2Z"
				/>
			</svg>
		</div>
		<h1 class="text-2xl font-semibold">Welcome</h1>
		<p class="text-sm text-zinc-400">
			Let's get this light onto your WiFi. Enter your network below — the device reboots and joins
			it, then it's reachable from any device on your network.
		</p>
	</header>

	<WifiForm />

	<a href="#/" class="text-center text-sm text-zinc-500 underline">Skip for now</a>
</main>

<script lang="ts">
	import { look } from '$lib/look.svelte';
	import { profile } from '$lib/registry/profile';
	import type { ControlKind } from '$lib/registry/types';
	import { trackDrag } from '$lib/drag';
	import Dock from '$lib/dock/Dock.svelte';
	import EffectsList from '$lib/overlays/EffectsList.svelte';
	import TopBar from './TopBar.svelte';
	import { bgSlide, nameSlide } from './transitions';

	/**
	 * The main screen: fullscreen preview (the profile's swappable background
	 * renderer) behind player chrome — title, prev/next/swipe, top bar, dock.
	 */

	const Background = profile.background;

	let listOpen = $state(false);
	let popover = $state<ControlKind | null>(null);
	let dir = $state(1); // last navigation direction, for slide transitions

	const subtitle = $derived(
		look.power
			? `${look.effect.tag} · ${look.effectIndex + 1} / ${profile.effects.length}`
			: 'lights are off'
	);

	function step(d: 1 | -1) {
		dir = d;
		popover = null;
		look.stepEffect(d);
	}

	function swipeDown(e: PointerEvent) {
		const x0 = e.clientX;
		let last = x0;
		trackDrag(
			e,
			(ev) => (last = ev.clientX),
			() => {
				const dx = last - x0;
				if (dx < -60) step(1);
				else if (dx > 60) step(-1);
				else popover = null; // a tap on the free area dismisses popovers
			}
		);
	}

	function onKey(e: KeyboardEvent) {
		if (listOpen) return;
		if (e.key === 'ArrowRight') step(1);
		if (e.key === 'ArrowLeft') step(-1);
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="fixed inset-0 overflow-hidden bg-[#050506] text-[#F0EFEC] select-none">
	{#key look.effect.fxId}
		<div class="pointer-events-none absolute -inset-[6%]" in:bgSlide={{ dir }}>
			<Background
				effect={look.effect}
				accent={look.accent}
				paletteColors={look.paletteColors}
				speed={look.speed / 255}
				brightness={look.bri / 255}
				power={look.power}
				layout={profile.layout}
			/>
		</div>
	{/key}
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_25%,rgba(0,0,0,0.55)_100%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0)_22%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.68))]"
	></div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="absolute inset-0 cursor-grab touch-pan-y" onpointerdown={swipeDown}>
		<div
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 pb-[150px] text-center"
		>
			{#key look.effect.fxId}
				<div in:nameSlide={{ dir }}>
					<div
						class="text-[clamp(42px,8vw,60px)] leading-[1.05] font-bold tracking-[-0.035em] [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]"
					>
						{look.effect.name}
					</div>
					<div
						class="mt-3 font-mono text-[11px] tracking-[2.2px] text-[rgba(240,239,236,0.6)] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
					>
						{subtitle}
					</div>
				</div>
			{/key}
		</div>
	</div>

	<button
		onclick={() => step(-1)}
		aria-label="Previous effect"
		class="absolute top-1/2 left-[10px] z-4 flex size-[38px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[rgba(240,239,236,0.4)] transition-colors hover:bg-white/8 hover:text-[#F0EFEC]"
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M15 6l-6 6 6 6" />
		</svg>
	</button>
	<button
		onclick={() => step(1)}
		aria-label="Next effect"
		class="absolute top-1/2 right-[10px] z-4 flex size-[38px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[rgba(240,239,236,0.4)] transition-colors hover:bg-white/8 hover:text-[#F0EFEC]"
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M9 6l6 6-6 6" />
		</svg>
	</button>

	<TopBar onOpenList={() => ((listOpen = true), (popover = null))} />
	<Dock bind:popover />

	{#if listOpen}
		<EffectsList onClose={() => (listOpen = false)} />
	{/if}
</div>

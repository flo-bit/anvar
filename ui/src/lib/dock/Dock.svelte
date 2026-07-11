<script lang="ts">
	import { look } from '$lib/look.svelte';
	import { wled } from '$lib/wled.svelte';
	import type { ControlKind } from '$lib/registry/types';
	import { CELLS } from './cells';
	import Slider from './Slider.svelte';

	/**
	 * The bottom glass card: per-effect control cells (from the cell registry)
	 * with their popovers, plus the always-present power + brightness row.
	 */
	interface Props {
		popover: ControlKind | null;
	}

	let { popover = $bindable() }: Props = $props();

	const toggle = (kind: ControlKind) => () => (popover = popover === kind ? null : kind);

	const briPct = $derived(Math.round((look.bri / 255) * 100));
</script>

<div class="absolute inset-x-0 bottom-0 z-5 px-[14px] pb-[calc(14px+env(safe-area-inset-bottom))]">
	<div class="relative mx-auto max-w-[520px]">
		{#if popover}
			{@const Popover = CELLS[popover].popover}
			<div
				class="absolute inset-x-0 bottom-[calc(100%+10px)] z-6 rounded-[18px] border border-white/10 bg-[rgba(19,19,24,0.92)] p-[18px] backdrop-blur-xl"
			>
				<Popover />
			</div>
		{/if}

		<div
			class="rounded-3xl border border-white/8 bg-[rgba(12,12,15,0.62)] px-[10px] pt-2 pb-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
		>
			{#if look.effect.controls.length > 0}
				<div class="flex items-stretch">
					{#each look.effect.controls as kind (kind)}
						{@const Cell = CELLS[kind].cell}
						<Cell active={popover === kind} onclick={toggle(kind)} />
					{/each}
				</div>
				<div class="mx-[3px] my-[9px] h-px bg-white/7"></div>
			{/if}
			<div class="flex items-center gap-[14px] px-1">
				<button
					onclick={() => wled.togglePower()}
					aria-pressed={look.power}
					aria-label="Power"
					class="flex size-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all duration-300"
					style:background={look.power ? look.accent : 'rgba(255,255,255,0.08)'}
					style:border-color={look.power ? look.accent : 'rgba(255,255,255,0.14)'}
					style:color={look.power ? '#0A0A0C' : 'rgba(240,239,236,0.6)'}
					style:box-shadow={look.power ? `0 0 44px ${look.accentSoft}` : 'none'}
				>
					<svg
						width="21"
						height="21"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					>
						<path d="M12 3v8" /><path d="M6.3 6.5a8 8 0 1 0 11.4 0" />
					</svg>
				</button>
				<div class="flex-1 py-[6px]">
					<Slider
						value={look.bri}
						min={1}
						fill={look.accent}
						glow="0 0 12px {look.accentSoft}"
						label="Brightness"
						onchange={(v) => wled.setBrightness(v)}
					/>
				</div>
				<div class="w-[38px] text-right font-mono text-xs text-[rgba(240,239,236,0.6)]">
					{briPct}%
				</div>
			</div>
		</div>
	</div>
</div>

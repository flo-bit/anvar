<script lang="ts">
	import { fade } from 'svelte/transition';
	import { look } from '$lib/look.svelte';
	import { wled } from '$lib/wled.svelte';
	import { profile } from '$lib/registry/profile';
	import Swatch from '$lib/preview/Swatch.svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	function pick(fxId: number) {
		wled.setEffect(fxId);
		onClose();
	}
</script>

<div
	data-screen="effects-list"
	class="fixed inset-0 z-20 overflow-y-auto bg-[rgba(8,8,10,0.92)] backdrop-blur-2xl"
	transition:fade={{ duration: 150 }}
>
	<div class="mx-auto max-w-[560px] px-5 pt-5 pb-[60px]">
		<div class="flex items-center justify-between">
			<h1 class="text-[22px] font-bold tracking-[-0.3px]">Effects</h1>
			<button
				onclick={onClose}
				aria-label="Close"
				class="flex size-[38px] cursor-pointer items-center justify-center rounded-full border border-white/12 text-[rgba(240,239,236,0.6)] transition-colors hover:bg-white/8 hover:text-[#F0EFEC]"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="M6 6l12 12" /><path d="M18 6L6 18" />
				</svg>
			</button>
		</div>
		<div class="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px]">
			{#each profile.effects as effect (effect.fxId)}
				{@const selected = effect.fxId === look.effect.fxId}
				<button
					onclick={() => pick(effect.fxId)}
					class="cursor-pointer rounded-[14px] border p-[11px] text-left transition-colors hover:bg-[#17171d] {selected
						? 'bg-white/7'
						: 'bg-white/3'}"
					style:border-color={selected ? look.accent : 'rgba(255,255,255,0.07)'}
				>
					<Swatch
						{effect}
						accent={look.accent}
						paletteColors={look.paletteColors}
						class="h-[30px] rounded-lg"
					/>
					<div class="mt-[9px] flex items-baseline justify-between gap-[6px]">
						<div class="text-[13.5px] font-medium">{effect.name}</div>
						<div class="font-mono text-[10.5px] text-[rgba(240,239,236,0.4)]">{effect.tag}</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

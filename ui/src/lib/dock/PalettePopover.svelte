<script lang="ts">
	import { look } from '$lib/look.svelte';
	import { profile } from '$lib/registry/profile';
	import type { PaletteDef } from '$lib/registry/types';

	function chip(p: PaletteDef): string {
		return p.colors
			? `linear-gradient(90deg,${p.colors.join(',')})`
			: `linear-gradient(90deg,${look.accent},${look.accentSoft})`;
	}
</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(105px,1fr))] gap-[9px]">
	{#each profile.palettes as p (p.palId)}
		{@const selected = p.palId === look.palette.palId}
		<button
			onclick={() => look.setPalette(p.palId)}
			class="cursor-pointer rounded-xl border bg-white/4 p-[7px] transition-colors hover:bg-white/9"
			style:border-color={selected ? look.accent : 'rgba(255,255,255,0.08)'}
		>
			<div class="h-[30px] rounded-[7px]" style:background-image={chip(p)}></div>
			<div
				class="mt-[7px] text-center text-[11.5px] font-medium"
				style:color={selected ? '#F0EFEC' : 'rgba(240,239,236,0.55)'}
			>
				{p.name}
			</div>
		</button>
	{/each}
</div>

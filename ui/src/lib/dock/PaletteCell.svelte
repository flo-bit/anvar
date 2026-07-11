<script lang="ts">
	import { look } from '$lib/look.svelte';
	import type { CellProps } from './cells';

	let { active, onclick }: CellProps = $props();

	const chipGradient = $derived(
		look.palette.colors
			? `linear-gradient(90deg,${look.palette.colors.join(',')})`
			: `linear-gradient(90deg,${look.accent},${look.accentSoft})`
	);
</script>

<button
	{onclick}
	class="flex flex-1 cursor-pointer flex-col gap-[5px] rounded-[13px] px-[13px] py-[9px] text-left transition-colors hover:bg-white/7 {active
		? 'bg-white/9'
		: ''}"
>
	<div
		class="font-mono text-[9.5px] tracking-[1.8px] uppercase"
		style:color={active ? look.accent : 'rgba(240,239,236,0.4)'}
	>
		Palette
	</div>
	<div class="flex items-center gap-2">
		<div class="h-[14px] w-6 rounded-[4px]" style:background-image={chipGradient}></div>
		<span class="text-[13.5px] font-semibold">{look.palette.name}</span>
	</div>
</button>

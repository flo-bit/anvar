<script lang="ts">
	import { look } from '$lib/look.svelte';
	import type { CellProps } from './cells';

	let { active, onclick }: CellProps = $props();

	const pct = (v: number) => Math.round((v / 255) * 100);
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
		Motion
	</div>
	<div class="flex items-baseline gap-[5px] whitespace-nowrap">
		<span class="text-[11.5px] text-[rgba(240,239,236,0.5)]">Speed</span>
		<span class="font-mono text-[13px] font-medium">{pct(look.speed)}</span>
		<span class="text-[11.5px] text-[rgba(240,239,236,0.35)]">·</span>
		<span class="text-[11.5px] text-[rgba(240,239,236,0.5)]">Intensity</span>
		<span class="font-mono text-[13px] font-medium">{pct(look.intensity)}</span>
	</div>
</button>

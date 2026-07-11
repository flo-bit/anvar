<script lang="ts">
	import { look } from '$lib/look.svelte';
	import type { CellProps } from './cells';

	let { active, onclick }: CellProps = $props();
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
		Color
	</div>
	<div class="flex items-center gap-2">
		<div
			class="size-[15px] rounded-full"
			style:background={look.accent}
			style:box-shadow="0 0 10px {look.accentSoft}"
		></div>
		<span class="text-[13.5px] font-semibold">{look.hueLabel}</span>
	</div>
</button>

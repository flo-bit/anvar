<script lang="ts">
	import { look } from '$lib/look.svelte';
	import type { CellProps } from './cells';

	let { active, onclick }: CellProps = $props();

	const pct = (v: number) => Math.round((v / 255) * 100);
</script>

<div class="flex flex-1 items-stretch">
	<div class="mx-1 my-[7px] w-px bg-white/8"></div>
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
		<div class="flex items-center gap-2">
			<svg
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="rgba(240,239,236,0.65)"
				stroke-width="1.8"
				stroke-linecap="round"
			>
				<path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
				<circle cx="9" cy="7" r="2.2" /><circle cx="15" cy="12" r="2.2" /><circle
					cx="7"
					cy="17"
					r="2.2"
				/>
			</svg>
			<span class="font-mono text-[13px] font-medium"
				>{pct(look.speed)} · {pct(look.intensity)}</span
			>
		</div>
	</button>
</div>

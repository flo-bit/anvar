<script lang="ts">
	import { wled } from '$lib/wled.svelte';

	interface Props {
		onOpenList: () => void;
	}

	let { onOpenList }: Props = $props();

	const dotColor = $derived(
		{ live: '#4ADE80', polling: '#FBBF24', connecting: '#FBBF24', offline: '#F87171' }[
			wled.connection
		]
	);
</script>

<div class="absolute inset-x-0 top-0 z-5 flex items-center justify-between p-[14px]">
	<button
		onclick={onOpenList}
		aria-label="Effects"
		class="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[rgba(12,12,15,0.5)] text-[rgba(240,239,236,0.75)] backdrop-blur-md transition-colors hover:bg-white/10 hover:text-[#F0EFEC]"
	>
		<svg
			width="17"
			height="17"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
		>
			<rect x="3.5" y="3.5" width="7" height="7" rx="2" />
			<rect x="13.5" y="3.5" width="7" height="7" rx="2" />
			<rect x="3.5" y="13.5" width="7" height="7" rx="2" />
			<rect x="13.5" y="13.5" width="7" height="7" rx="2" />
		</svg>
	</button>
	<div
		class="flex items-center gap-[7px] rounded-full border border-white/8 bg-[rgba(12,12,15,0.5)] px-[14px] py-2 backdrop-blur-md"
		title={wled.connection}
	>
		<div
			class="size-[6px] rounded-full"
			style:background={dotColor}
			style:animation={wled.connection === 'live' ? 'ledpulse 2.4s ease-in-out infinite' : 'none'}
		></div>
		<span class="text-[12.5px] font-medium text-[rgba(240,239,236,0.75)]">
			{wled.info?.name ?? 'WLED'}
		</span>
	</div>
	<a
		href="#/settings"
		aria-label="Settings"
		class="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(12,12,15,0.5)] text-[rgba(240,239,236,0.75)] backdrop-blur-md transition-colors hover:bg-white/10 hover:text-[#F0EFEC]"
	>
		<svg
			width="17"
			height="17"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
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
	</a>
</div>

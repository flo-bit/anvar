<script lang="ts">
	import { look } from '$lib/look.svelte';

	interface Props {
		on: boolean;
		label: string;
		onchange: (on: boolean) => void;
	}

	let { on, label, onchange }: Props = $props();
</script>

<button
	role="switch"
	aria-checked={on}
	aria-label={label}
	onclick={() => onchange(!on)}
	class="relative h-[26px] w-11 shrink-0 cursor-pointer rounded-[13px] transition-colors duration-200"
	style:background={on ? look.accent : 'rgba(255,255,255,0.14)'}
>
	<span
		class="absolute top-[3px] size-5 rounded-full bg-[#F0EFEC] transition-[left] duration-200"
		style:left={on ? '21px' : '3px'}
	></span>
</button>

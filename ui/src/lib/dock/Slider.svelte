<script lang="ts">
	import { rateLimit, trackDrag } from '$lib/drag';

	/**
	 * Pointer-driven slider (track + knob), 0..max integer values.
	 * Label rows live in the caller; `fill` sets the filled track color.
	 */
	interface Props {
		value: number;
		max?: number;
		min?: number;
		fill: string;
		/** CSS box-shadow for the filled track (accent glow), optional. */
		glow?: string;
		label: string;
		onchange: (value: number) => void;
	}

	let { value, max = 255, min = 0, fill, glow, label, onchange }: Props = $props();

	// during a drag the pointer is the source of truth — following `value`
	// through the device round-trip would make the knob jump
	let dragValue = $state<number | null>(null);
	const shown = $derived(dragValue ?? value);
	const pct = $derived(((shown - min) / (max - min)) * 100);

	const send = rateLimit((v: number) => onchange(v), 80);

	function down(e: PointerEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		trackDrag(
			e,
			(ev) => {
				const p = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
				dragValue = Math.round(min + p * (max - min));
				send(dragValue);
			},
			() => {
				if (dragValue !== null) send(dragValue);
				dragValue = null;
			}
		);
	}

	function key(e: KeyboardEvent) {
		const step = Math.max(1, Math.round((max - min) / 20));
		if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onchange(Math.min(max, value + step));
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onchange(Math.max(min, value - step));
		else return;
		e.preventDefault();
	}
</script>

<div
	class="cursor-pointer touch-none py-[9px]"
	onpointerdown={down}
	onkeydown={key}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={shown}
>
	<div class="relative h-[6px] rounded-[3px] bg-white/10">
		<div
			class="absolute inset-y-0 left-0 rounded-[3px]"
			style:width="{pct}%"
			style:background={fill}
			style:box-shadow={glow}
		></div>
		<div
			class="absolute top-1/2 size-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F0EFEC] shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
			style:left="{pct}%"
		></div>
	</div>
</div>

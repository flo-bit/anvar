<script lang="ts">
	import { look } from '$lib/look.svelte';
	import { trackDrag } from '$lib/drag';
	import Slider from './Slider.svelte';

	const RING =
		'conic-gradient(hsl(0 90% 60%),hsl(45 90% 60%),hsl(90 80% 55%),hsl(135 75% 55%),hsl(180 80% 55%),hsl(225 85% 62%),hsl(270 85% 64%),hsl(315 90% 60%),hsl(360 90% 60%))';

	const rad = $derived((look.hue * Math.PI) / 180);
	const handleX = $derived(50 + 44 * Math.sin(rad));
	const handleY = $derived(50 - 44 * Math.cos(rad));

	function ringDown(e: PointerEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		trackDrag(e, (ev) => {
			const ang = (Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180) / Math.PI;
			look.setHueSat(Math.round((ang + 360) % 360), look.sat);
		});
	}
</script>

<div class="flex flex-col items-center">
	<div class="relative size-[180px]">
		<div
			class="absolute inset-0 cursor-pointer touch-none rounded-full"
			style:background={RING}
			onpointerdown={ringDown}
			role="slider"
			tabindex="0"
			aria-label="Hue"
			aria-valuemin={0}
			aria-valuemax={359}
			aria-valuenow={look.hue}
		></div>
		<div class="pointer-events-none absolute inset-5 rounded-full bg-[#131318]"></div>
		<div
			class="pointer-events-none absolute inset-14 rounded-full transition-colors duration-150"
			style:background={look.accent}
			style:box-shadow="0 0 24px {look.accentSoft}"
		></div>
		<div
			class="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#F0EFEC] shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
			style:left="{handleX}%"
			style:top="{handleY}%"
			style:background={look.accent}
		></div>
	</div>
	<div class="mt-[14px] w-full">
		<div class="flex items-baseline justify-between">
			<span class="text-[12.5px] text-[rgba(240,239,236,0.55)]">Saturation</span>
			<span class="font-mono text-[12.5px]">{look.sat}%</span>
		</div>
		<Slider
			value={look.sat}
			max={100}
			fill="linear-gradient(90deg,rgba(255,255,255,0.25),{look.accent})"
			label="Saturation"
			onchange={(v) => look.setHueSat(look.hue, v)}
		/>
	</div>
</div>

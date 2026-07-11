<script lang="ts">
	import { look } from '$lib/look.svelte';
	import { wled } from '$lib/wled.svelte';
	import Slider from './Slider.svelte';

	const pct = (v: number) => Math.round((v / 255) * 100);
</script>

<div>
	<div class="flex items-baseline justify-between">
		<span class="text-[12.5px] text-[rgba(240,239,236,0.55)]">Speed</span>
		<span class="font-mono text-[12.5px]">{pct(look.speed)}</span>
	</div>
	<Slider value={look.speed} fill={look.accent} label="Speed" onchange={(v) => wled.setSpeed(v)} />
	<div class="mt-[6px] flex items-baseline justify-between">
		<span class="text-[12.5px] text-[rgba(240,239,236,0.55)]">Intensity</span>
		<span class="font-mono text-[12.5px]">{pct(look.intensity)}</span>
	</div>
	<Slider
		value={look.intensity}
		fill={look.accent}
		label="Intensity"
		onchange={(v) => wled.setIntensity(v)}
	/>
</div>

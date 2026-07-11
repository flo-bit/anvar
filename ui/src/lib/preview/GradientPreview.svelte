<script lang="ts">
	import type { PreviewProps } from './types';
	import { recipeAnimation, recipeGradient } from './recipe';

	let { effect, accent, paletteColors, speed, brightness, power }: PreviewProps = $props();

	const gradient = $derived(recipeGradient(effect.preview, accent, paletteColors));
	const anim = $derived(recipeAnimation(effect.preview, speed));
	const opacity = $derived(power ? 0.32 + brightness * 0.5 : 0.05);
</script>

<!-- v5 fullscreen renderer: the effect as an animated ambient gradient. -->
<div class="absolute inset-0 transition-opacity duration-500" style:opacity>
	<div
		class="absolute inset-0"
		style:background-image={gradient}
		style:background-size={anim.backgroundSize}
		style:animation={anim.animation}
		style:--march-x={anim.marchX}
	></div>
</div>

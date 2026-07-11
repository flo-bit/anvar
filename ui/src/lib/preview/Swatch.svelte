<script lang="ts">
	import type { EffectDef } from '$lib/registry/types';
	import { recipeGradient } from './recipe';

	/**
	 * Small synthetic preview chip for effect cards and dock cells. Always
	 * gradient-based (never live), whatever background renderer the profile uses.
	 */
	interface Props {
		effect: EffectDef;
		accent: string;
		paletteColors: string[];
		class?: string;
	}

	let { effect, accent, paletteColors, class: cls = '' }: Props = $props();
</script>

<div
	class={cls}
	style:background-image={recipeGradient(effect.preview, accent, paletteColors)}
></div>

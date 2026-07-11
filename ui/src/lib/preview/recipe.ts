import type { PreviewRecipe } from '$lib/registry/types';

/**
 * Turns PreviewRecipes into concrete CSS. Shared by the fullscreen
 * GradientPreview and the small Swatch chips so the player background and the
 * effect cards always agree on what an effect looks like.
 */

/** Repeating color stripes on dark gaps (chase/theater style). */
function stripes(colors: string[], width: number, gap: number): string {
	const parts: string[] = [];
	let pos = 0;
	for (const color of colors) {
		parts.push(`${color} ${pos}px ${pos + width}px`);
		pos += width;
		parts.push(`rgba(8,8,12,0.9) ${pos}px ${pos + gap}px`);
		pos += gap;
	}
	return `repeating-linear-gradient(90deg,${parts.join(',')})`;
}

/** A few bright specks on near-black (twinkle/fireworks style). */
function sparkle(colors: string[]): string {
	const c = (i: number) => colors[i % colors.length];
	return `linear-gradient(90deg,#0b0b10 8%,${c(0)} 10%,#0b0b10 12%,#0b0b10 42%,${c(1)} 44%,#0b0b10 46%,#0b0b10 76%,${c(2)} 78%,#0b0b10 80%)`;
}

/** Smooth wrap-around blend of the palette. */
function smooth(colors: string[]): string {
	return `linear-gradient(90deg,${colors.join(',')},${colors[0]})`;
}

/** Resolve a recipe to a CSS gradient for the given accent + palette colors. */
export function recipeGradient(
	recipe: PreviewRecipe,
	accent: string,
	paletteColors: string[]
): string {
	switch (recipe.paletteMode) {
		case 'stripes-wide':
			return stripes(paletteColors, 14, 14);
		case 'stripes-narrow':
			return stripes(paletteColors, 6, 12);
		case 'sparkle':
			return sparkle(paletteColors);
		case 'smooth':
			return smooth(paletteColors);
		default:
			return recipe.gradient.replaceAll('ACC', accent);
	}
}

export interface RecipeAnimation {
	/** CSS animation shorthand, or 'none' for static effects. */
	animation: string;
	backgroundSize: string;
	/** Value for the --march-x custom property ('march' keyframes only). */
	marchX?: string;
}

/** Animation CSS for a recipe at a given speed (0–1 — faster is shorter). */
export function recipeAnimation(recipe: PreviewRecipe, speed: number): RecipeAnimation {
	const anim = recipe.animation;
	if (!anim) return { animation: 'none', backgroundSize: '100% 100%' };
	const duration = (anim.baseSeconds * (0.35 + (1 - speed) * 1.4)).toFixed(1);
	return {
		animation: `${anim.keyframes} ${duration}s ${anim.timing} infinite${anim.alternate ? ' alternate' : ''}`,
		backgroundSize: anim.backgroundSize,
		marchX: anim.marchPx === undefined ? undefined : `${anim.marchPx}px`
	};
}

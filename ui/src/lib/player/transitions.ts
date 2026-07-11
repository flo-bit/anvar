import { quintOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/**
 * Directional in-transitions for effect changes (used with {#key} so the CSS
 * animation of the incoming preview restarts): the effect name slides in from
 * the navigation direction, the background nudges over with a slight zoom.
 */

export function nameSlide(_node: Element, { dir }: { dir: number }): TransitionConfig {
	return {
		duration: 450,
		easing: quintOut,
		css: (t, u) => `opacity:${t};transform:translateX(${dir * 56 * u}px)`
	};
}

export function bgSlide(_node: Element, { dir }: { dir: number }): TransitionConfig {
	return {
		duration: 550,
		easing: quintOut,
		css: (_t, u) => `transform:translateX(${dir * 2.5 * u}%) scale(${1 + 0.06 * u})`
	};
}

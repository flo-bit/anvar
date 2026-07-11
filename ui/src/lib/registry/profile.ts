import type { Component } from 'svelte';
import type { EffectDef, LedLayout, PaletteDef } from './types';
import type { PreviewProps } from '$lib/preview/types';
import GradientPreview from '$lib/preview/GradientPreview.svelte';
import { EFFECTS } from './effects';
import { PALETTES } from './palettes';

/**
 * Everything device-specific in one object. A single shared profile for now;
 * per-device curation later = one DeviceProfile per device (selected at build
 * or runtime), with the rest of the app untouched.
 */
export interface DeviceProfile {
	effects: EffectDef[];
	palettes: PaletteDef[];
	/**
	 * Fullscreen preview renderer behind the player — the swap point for a
	 * device-shape mockup or liveview renderer later.
	 */
	background: Component<PreviewProps>;
	/** LED arrangement, for renderers that draw the physical device. */
	layout?: LedLayout;
}

export const profile: DeviceProfile = {
	effects: EFFECTS,
	palettes: PALETTES,
	background: GradientPreview,
	layout: { type: 'strip', count: 30 }
};

import type { EffectDef, LedLayout } from '$lib/registry/types';

/**
 * Contract for fullscreen preview renderers — the swap point on the device
 * profile. A renderer fills its container and is purely visual: no pointer
 * handling (the player owns gestures), no writes to device state.
 *
 * Synthetic renderers (GradientPreview) use `effect.preview` plus the look
 * props. Physical renderers (device-shape mockup, liveview) additionally use
 * `layout` and — for real LED data — the wled client's liveview stream
 * (wled.startLiveview() / wled.liveColors).
 */
export interface PreviewProps {
	effect: EffectDef;
	/** Current accent as a CSS color (substituted for 'ACC' in recipes). */
	accent: string;
	/** Resolved palette display colors ([accent] for color-based palettes). */
	paletteColors: string[];
	/** 0–1 */
	speed: number;
	/** 0–1 */
	brightness: number;
	power: boolean;
	layout?: LedLayout;
}

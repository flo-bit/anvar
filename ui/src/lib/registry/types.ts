/**
 * Data contracts for the curated UI.
 *
 * Everything the player renders hangs off an EffectDef: which WLED effect to
 * activate (fxId), what to call it, which control cells the dock shows, and a
 * PreviewRecipe describing its synthetic look (used by the gradient background
 * renderer and by the effect-card swatches).
 */

/** Dock control kinds. Each maps to a cell + popover pair in dock/cells.ts. */
export type ControlKind = 'color' | 'palette' | 'motion';

export interface PreviewAnimation {
	/** Global keyframes name (defined in routes/layout.css). */
	keyframes: 'panX' | 'march' | 'breathe' | 'flicker' | 'shimmer';
	/**
	 * `march` travel distance per cycle; must be a multiple of the repeating
	 * gradient's period so the loop is seamless.
	 */
	marchPx?: number;
	/** Duration at mid speed — the actual duration scales with the speed slider. */
	baseSeconds: number;
	timing: 'linear' | 'ease-in-out';
	alternate: boolean;
	/** background-size the gradient is animated over ('auto' for repeating gradients). */
	backgroundSize: string;
}

/** How the selected palette is rendered into a preview gradient. */
export type PaletteMode = 'stripes-wide' | 'stripes-narrow' | 'sparkle' | 'smooth';

export interface PreviewRecipe {
	/** CSS gradient; the literal 'ACC' is replaced with the accent color. */
	gradient: string;
	/** When set, the preview renders the selected palette instead of `gradient`. */
	paletteMode?: PaletteMode;
	/** Omitted → static gradient. */
	animation?: PreviewAnimation;
}

export interface EffectDef {
	/** WLED effect id (FX_MODE_* in wled00/FX.h). */
	fxId: number;
	/** Display name — deliberately ours, not the firmware name from /json/eff. */
	name: string;
	/** Small caption under the name and on effect cards. */
	tag: string;
	/** Which dock cells this effect shows. */
	controls: ControlKind[];
	preview: PreviewRecipe;
}

export interface PaletteDef {
	/** WLED palette id (index into JSON_palette_names, wled00/FX_fcn.cpp). */
	palId: number;
	name: string;
	/** Display colors; null renders from the current accent (color-based palettes). */
	colors: string[] | null;
}

/** Physical LED arrangement — consumed by shape/liveview preview renderers. */
export interface LedLayout {
	type: 'strip' | 'ring' | 'matrix';
	count: number;
	/** matrix only */
	width?: number;
	height?: number;
}

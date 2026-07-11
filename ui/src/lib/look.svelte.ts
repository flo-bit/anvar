import { wled } from './wled.svelte';
import { profile } from './registry/profile';
import type { EffectDef } from './registry/types';
import { accentCss, accentSoftCss, hsToRgb, hueName, rgbToHs } from './color';

/**
 * Shared derived visual state for player, dock and overlays. The single
 * source of truth is wled.state (updates optimistically on writes); this
 * class only translates between device units (RGB, 0–255) and UI units
 * (hue/sat, accent CSS, curated EffectDef/PaletteDef).
 */
class Look {
	/** Remembers the ring position while the device color is gray/white. */
	#lastHue = $state(28);
	/**
	 * Last palette the user picked. seg.pal is per-segment, not per-effect, so
	 * color effects reset it to 0 (WLED renders from col[0] only when the
	 * palette is Default) and palette effects restore this choice.
	 */
	#lastPalId = $state(profile.palettes[0].palId);

	readonly seg = $derived(wled.state?.seg[0] ?? null);
	readonly power = $derived(wled.state?.on ?? false);
	/** 0–255 */
	readonly bri = $derived(wled.state?.bri ?? 128);

	readonly #hs = $derived.by(() => {
		const c = this.seg?.col?.[0];
		return c && c.length >= 3 ? rgbToHs(c[0], c[1], c[2]) : { hue: 28, sat: 88 };
	});
	readonly sat = $derived(this.#hs.sat);
	readonly hue = $derived(this.#hs.sat < 5 ? this.#lastHue : this.#hs.hue);

	readonly accent = $derived(accentCss(this.hue, this.sat));
	readonly accentSoft = $derived(accentSoftCss(this.hue, this.sat));
	readonly hueLabel = $derived(hueName(this.hue, this.sat));

	readonly effectIndex = $derived.by(() => {
		const i = profile.effects.findIndex((e) => e.fxId === this.seg?.fx);
		return i < 0 ? 0 : i;
	});
	readonly effect = $derived(profile.effects[this.effectIndex]);

	readonly palette = $derived(
		profile.palettes.find((p) => p.palId === this.seg?.pal) ?? profile.palettes[0]
	);
	/** Display colors of the current palette; accent for color-based palettes. */
	readonly paletteColors = $derived(this.palette.colors ?? [this.accent]);

	/** 0–255 (seg.sx / seg.ix) */
	readonly speed = $derived(this.seg?.sx ?? 128);
	readonly intensity = $derived(this.seg?.ix ?? 128);

	setHueSat(hue: number, sat: number): void {
		this.#lastHue = hue;
		// clear a stray palette so the color actually shows (e.g. set externally)
		const pal = !this.effect.controls.includes('palette') && this.seg?.pal !== 0 ? { pal: 0 } : {};
		wled.setState({ on: true, seg: [{ id: 0, col: [hsToRgb(hue, sat)], ...pal }] });
	}

	setPalette(palId: number): void {
		this.#lastPalId = palId;
		wled.setPalette(palId);
	}

	/** Activate an effect, keeping seg.pal consistent with its control set. */
	selectEffect(effect: EffectDef): void {
		let pal: number | undefined;
		if (!effect.controls.includes('palette')) {
			pal = 0; // render from col[0]
		} else {
			const cur = this.seg?.pal;
			const curated = profile.palettes.find((p) => p.palId === cur);
			if (curated) this.#lastPalId = curated.palId;
			else pal = this.#lastPalId; // e.g. coming from a color effect (pal 0)
		}
		wled.setState({
			on: true,
			seg: [{ id: 0, fx: effect.fxId, ...(pal !== undefined ? { pal } : {}) }]
		});
	}

	/** Step to the previous/next curated effect (wraps around). */
	stepEffect(dir: 1 | -1): void {
		const n = profile.effects.length;
		const next = (this.effectIndex + dir + n) % n;
		this.selectEffect(profile.effects[next]);
	}
}

export const look = new Look();

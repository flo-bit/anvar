/**
 * Color conversions between the UI's hue/saturation model and the RGB triples
 * the WLED JSON API uses (seg[].col). The UI never sends brightness through
 * the color — value is always 100, global bri handles dimming.
 */

/** hue 0–360, sat 0–100 → [r,g,b] 0–255 at full value. */
export function hsToRgb(hue: number, sat: number): [number, number, number] {
	const s = sat / 100;
	const f = (n: number) => {
		const k = (n + hue / 60) % 6;
		return Math.round(255 * (1 - s * Math.max(0, Math.min(k, 4 - k, 1))));
	};
	return [f(5), f(3), f(1)];
}

/** [r,g,b] 0–255 → hue 0–360, sat 0–100 (HSV). Gray means sat 0, hue 0. */
export function rgbToHs(r: number, g: number, b: number): { hue: number; sat: number } {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	if (max === 0 || d === 0) return { hue: 0, sat: 0 };
	let hue: number;
	if (max === r) hue = ((g - b) / d) % 6;
	else if (max === g) hue = (b - r) / d + 2;
	else hue = (r - g) / d + 4;
	return { hue: Math.round((hue * 60 + 360) % 360), sat: Math.round((d / max) * 100) };
}

/** Screen accent for a picked color — lightness lifted as saturation drops. */
export function accentCss(hue: number, sat: number): string {
	const l = Math.round(55 + (100 - sat) * 0.38);
	return `hsl(${hue} ${sat}% ${l}%)`;
}

/** Translucent accent for glows and shadows. */
export function accentSoftCss(hue: number, sat: number): string {
	const l = Math.round(55 + (100 - sat) * 0.38);
	return `hsla(${hue}, ${sat}%, ${l}%, 0.4)`;
}

const HUE_STOPS: [number, string][] = [
	[20, 'Red'],
	[45, 'Orange'],
	[70, 'Yellow'],
	[95, 'Lime'],
	[150, 'Green'],
	[185, 'Teal'],
	[215, 'Cyan'],
	[250, 'Blue'],
	[275, 'Indigo'],
	[305, 'Violet'],
	[340, 'Pink']
];

/** Human name for a hue ("Orange", "Teal"); low saturation reads as White. */
export function hueName(hue: number, sat: number): string {
	if (sat < 15) return 'White';
	for (const [stop, name] of HUE_STOPS) if (hue < stop) return name;
	return 'Red';
}

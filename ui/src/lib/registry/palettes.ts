import type { PaletteDef } from './types';

/**
 * Curated palettes. palIds are indices into JSON_palette_names
 * (wled00/FX_fcn.cpp); display colors approximate the firmware gradients.
 * 'Glow' is WLED's "* Color 1" — the palette follows the picked color.
 */
export const PALETTES: PaletteDef[] = [
	{ palId: 2, name: 'Glow', colors: null },
	{ palId: 13, name: 'Sunset', colors: ['#ff512f', '#f09819', '#ffd194'] },
	{ palId: 9, name: 'Ocean', colors: ['#003b63', '#00c6fb', '#005bea'] },
	{ palId: 10, name: 'Forest', colors: ['#134e5e', '#71b280'] },
	{ palId: 8, name: 'Lava', colors: ['#200122', '#6f0000', '#ff512f'] },
	{ palId: 20, name: 'Pastel', colors: ['#ffd3e0', '#c7ceea', '#b5ead7'] },
	{ palId: 6, name: 'Party', colors: ['#ff004d', '#7a5cff', '#00e0ff'] },
	{ palId: 36, name: 'Ice', colors: ['#83a4d4', '#b6fbff'] }
];

import type { EffectDef } from './types';

/**
 * The shared curated effect list (every device shows all of these for now —
 * per-device curation later means one such list per device profile).
 * Adding/removing a visible effect is adding/removing an entry here.
 *
 * fxIds verified against wled00/FX.h; preview recipes ported from
 * ui/design/WLED App v5.dc.html.
 */
export const EFFECTS: EffectDef[] = [
	{
		fxId: 0, // FX_MODE_STATIC
		name: 'Solid',
		tag: 'calm',
		controls: ['color'],
		preview: { gradient: 'linear-gradient(90deg,ACC,ACC)' }
	},
	{
		fxId: 2, // FX_MODE_BREATH
		name: 'Breathe',
		tag: 'calm',
		controls: ['color', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#0A0A0C,ACC,#0A0A0C)',
			animation: {
				keyframes: 'breathe',
				baseSeconds: 6,
				timing: 'ease-in-out',
				alternate: false,
				backgroundSize: '100% 100%'
			}
		}
	},
	{
		fxId: 88, // FX_MODE_CANDLE
		name: 'Candle',
		tag: 'cozy',
		controls: ['color', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#3a1d05,#ff9d3c,#7a3c08,#ffb85c)',
			animation: {
				keyframes: 'flicker',
				baseSeconds: 3,
				timing: 'linear',
				alternate: false,
				backgroundSize: '100% 100%'
			}
		}
	},
	{
		fxId: 9, // FX_MODE_RAINBOW_CYCLE
		name: 'Rainbow',
		tag: 'party',
		controls: ['motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#ff004d,#ff9d00,#ffee00,#00e05a,#00b3ff,#7a5cff,#ff004d)',
			animation: {
				keyframes: 'panX',
				baseSeconds: 18,
				timing: 'linear',
				alternate: true,
				backgroundSize: '300% 100%'
			}
		}
	},
	{
		fxId: 8, // FX_MODE_RAINBOW
		name: 'Colorloop',
		tag: 'calm',
		controls: ['motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#ff5c5c,#ffd25c,#5cff8f,#5cc9ff,#b45cff)',
			animation: {
				keyframes: 'panX',
				baseSeconds: 22,
				timing: 'ease-in-out',
				alternate: true,
				backgroundSize: '300% 100%'
			}
		}
	},
	{
		fxId: 28, // FX_MODE_CHASE_COLOR
		name: 'Chase',
		tag: 'motion',
		controls: ['palette', 'motion'],
		preview: {
			gradient: 'repeating-linear-gradient(90deg,ACC 0 14px,rgba(255,255,255,0.06) 14px 28px)',
			paletteMode: 'stripes-wide',
			animation: {
				keyframes: 'march',
				marchPx: 504,
				baseSeconds: 8,
				timing: 'linear',
				alternate: false,
				backgroundSize: 'auto'
			}
		}
	},
	{
		fxId: 13, // FX_MODE_THEATER_CHASE
		name: 'Theater',
		tag: 'motion',
		controls: ['palette', 'motion'],
		preview: {
			gradient: 'repeating-linear-gradient(90deg,ACC 0 6px,rgba(255,255,255,0.06) 6px 18px)',
			paletteMode: 'stripes-narrow',
			animation: {
				keyframes: 'march',
				marchPx: 540,
				baseSeconds: 6,
				timing: 'linear',
				alternate: false,
				backgroundSize: 'auto'
			}
		}
	},
	{
		fxId: 17, // FX_MODE_TWINKLE
		name: 'Twinkle',
		tag: 'ambient',
		controls: ['palette', 'motion'],
		preview: {
			gradient:
				'linear-gradient(90deg,#101014 10%,#e8e8ff 12%,#101014 14%,#101014 40%,#cfd8ff 42%,#101014 44%,#101014 75%,#ffffff 77%,#101014 79%)',
			paletteMode: 'sparkle',
			animation: {
				keyframes: 'shimmer',
				baseSeconds: 3,
				timing: 'ease-in-out',
				alternate: false,
				backgroundSize: '100% 100%'
			}
		}
	},
	{
		fxId: 20, // FX_MODE_SPARKLE
		name: 'Sparkle',
		tag: 'ambient',
		controls: ['color', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,ACC 30%,#ffffff 32%,ACC 34%,ACC 70%,#ffffff 72%,ACC 74%)',
			animation: {
				keyframes: 'shimmer',
				baseSeconds: 2,
				timing: 'ease-in-out',
				alternate: false,
				backgroundSize: '100% 100%'
			}
		}
	},
	{
		fxId: 42, // FX_MODE_FIREWORKS
		name: 'Fireworks',
		tag: 'party',
		controls: ['palette', 'motion'],
		preview: {
			gradient:
				'linear-gradient(90deg,#0b0b10 5%,#ff5c8a 12%,#0b0b10 20%,#0b0b10 45%,#5cc9ff 52%,#0b0b10 60%,#0b0b10 80%,#ffd25c 88%,#0b0b10 96%)',
			paletteMode: 'sparkle',
			animation: {
				keyframes: 'shimmer',
				baseSeconds: 4,
				timing: 'ease-in-out',
				alternate: false,
				backgroundSize: '100% 100%'
			}
		}
	},
	{
		fxId: 76, // FX_MODE_METEOR
		name: 'Meteor',
		tag: 'motion',
		controls: ['color', 'motion'],
		preview: {
			gradient:
				'linear-gradient(90deg,rgba(255,255,255,0) 30%,ACC 58%,#ffffff 62%,rgba(255,255,255,0) 64%)',
			animation: {
				keyframes: 'panX',
				baseSeconds: 5,
				timing: 'linear',
				alternate: false,
				backgroundSize: '250% 100%'
			}
		}
	},
	{
		fxId: 79, // FX_MODE_RIPPLE
		name: 'Ripple',
		tag: 'water',
		controls: ['palette', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#02121f,#0a6ea8,#02121f,#0a86c8,#02121f)',
			paletteMode: 'smooth',
			animation: {
				keyframes: 'panX',
				baseSeconds: 14,
				timing: 'ease-in-out',
				alternate: true,
				backgroundSize: '250% 100%'
			}
		}
	},
	{
		fxId: 38, // FX_MODE_AURORA
		name: 'Aurora',
		tag: 'ambient',
		controls: ['palette', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#022c22,#0e9f6e,#2dd4bf,#164e63,#22d3ee)',
			paletteMode: 'smooth',
			animation: {
				keyframes: 'panX',
				baseSeconds: 20,
				timing: 'ease-in-out',
				alternate: true,
				backgroundSize: '300% 100%'
			}
		}
	},
	{
		fxId: 97, // FX_MODE_PLASMA
		name: 'Plasma',
		tag: 'ambient',
		controls: ['palette', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,#7a5cff,#ff5cd0,#5cc9ff,#7a5cff)',
			paletteMode: 'smooth',
			animation: {
				keyframes: 'panX',
				baseSeconds: 16,
				timing: 'ease-in-out',
				alternate: true,
				backgroundSize: '300% 100%'
			}
		}
	},
	{
		fxId: 10, // FX_MODE_SCAN
		name: 'Scan',
		tag: 'motion',
		controls: ['color', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,rgba(255,255,255,0) 20%,ACC 50%,rgba(255,255,255,0) 80%)',
			animation: {
				keyframes: 'panX',
				baseSeconds: 4,
				timing: 'ease-in-out',
				alternate: true,
				backgroundSize: '220% 100%'
			}
		}
	},
	{
		fxId: 3, // FX_MODE_COLOR_WIPE
		name: 'Wipe',
		tag: 'motion',
		controls: ['color', 'motion'],
		preview: {
			gradient: 'linear-gradient(90deg,ACC 50%,rgba(255,255,255,0.08) 50%)',
			animation: {
				keyframes: 'panX',
				baseSeconds: 5,
				timing: 'linear',
				alternate: true,
				backgroundSize: '200% 100%'
			}
		}
	}
];

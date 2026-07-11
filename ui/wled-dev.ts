/**
 * Dev backend for the UI.
 *
 * - `WLED_HOST=<ip-or-host> pnpm dev` → proxies /json and /ws to a real WLED device.
 * - `WLED_USB=1 pnpm dev`            → bridges /json + /ws to a USB-connected device
 *   via its serial JSON API (wled00/wled_serial.cpp) — no IP or WiFi needed.
 *   Auto-detects /dev/cu.usbmodem*; set WLED_USB=/dev/... to pick a port.
 *   Serial only speaks the *state* API, so /json/cfg (WiFi settings) returns 501 here.
 * - `pnpm dev` (neither set)         → serves an in-process mock WLED so the UI
 *   works with no hardware attached. State lives in memory; changes are logged
 *   to the terminal and broadcast to all /ws clients, mirroring ws.cpp behavior.
 *
 * The app itself only ever talks to relative URLs, so the same code runs
 * against the mock, the proxy, the USB bridge, and the real device serving it from flash.
 */
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import { readdirSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';

// Effect IDs match wled00/FX.h (FX_MODE_*); names match the _data_FX_MODE_*
// strings in FX.cpp. Only a prefix of the real ~190-entry table — enough for
// the mock, the real device reports its own full list.
const EFFECT_NAMES = [
	'Solid', // 0 FX_MODE_STATIC
	'Blink', // 1
	'Breathe', // 2 FX_MODE_BREATH
	'Wipe', // 3
	'Wipe Random', // 4
	'Random Colors', // 5
	'Sweep', // 6
	'Dynamic', // 7
	'Colorloop', // 8 FX_MODE_RAINBOW
	'Rainbow' // 9 FX_MODE_RAINBOW_CYCLE
];

const PALETTE_NAMES = ['Default', 'Random Cycle', 'Color 1', 'Colors 1&2', 'Color Gradient'];

function mockState() {
	return {
		on: true,
		bri: 128,
		transition: 7,
		ps: -1,
		pl: -1,
		nl: { on: false, dur: 30, mode: 1, tbri: 0, rem: -1 },
		udpn: { send: true, recv: false },
		mainseg: 0,
		seg: [
			{
				id: 0,
				start: 0,
				stop: 30,
				len: 30,
				on: true,
				bri: 255,
				col: [
					[255, 160, 0],
					[0, 0, 0],
					[0, 0, 0]
				],
				fx: 0,
				sx: 128,
				ix: 128,
				pal: 0,
				sel: true
			}
		]
	};
}

const MOCK_INFO = {
	ver: 'mock',
	name: 'WLED mock',
	leds: { count: 30, pwr: 0, maxpwr: 0, bootps: 0 },
	arch: 'vite-dev-server',
	ip: '127.0.0.1'
};

const MOCK_CFG_EXTRAS = {
	id: { mdns: 'wled-mock', name: 'WLED mock' },
	hw: { led: { ins: [{ pin: [2] }] } }
};

function proxyPlugin(host: string): Plugin {
	return {
		name: 'wled-proxy',
		config: () => ({
			server: {
				proxy: {
					'/json': { target: `http://${host}` },
					'/presets.json': { target: `http://${host}` },
					'/ws': { target: `ws://${host}`, ws: true }
				}
			}
		}),
		configureServer() {
			console.log(`[wled-dev] proxying /json and /ws to ${host}`);
		}
	};
}

function resolveUsbPort(spec: string): string {
	if (spec.startsWith('/')) return spec;
	const candidates = readdirSync('/dev').filter(
		(name) => name.startsWith('cu.usbmodem') || name.startsWith('cu.usbserial')
	);
	if (candidates.length === 0) {
		throw new Error('[wled-dev] WLED_USB set but no /dev/cu.usbmodem* or cu.usbserial* found');
	}
	return `/dev/${candidates[0]}`;
}

function serialPlugin(portSpec: string): Plugin {
	const portPath = resolveUsbPort(portSpec);
	const port = new SerialPort({ path: portPath, baudRate: 115200 });
	const wss = new WebSocketServer({ noServer: true });

	// device replies to verbose requests with one {"state":…,"info":…} line
	let doc: { state?: unknown; info?: unknown } = {};
	let rxBuffer = '';
	let pendingReply: ((reply: object) => void) | null = null;

	port.on('data', (chunk: Buffer) => {
		rxBuffer += chunk.toString('utf-8');
		let nl;
		while ((nl = rxBuffer.indexOf('\n')) >= 0) {
			const line = rxBuffer.slice(0, nl).trim();
			rxBuffer = rxBuffer.slice(nl + 1);
			if (!line.startsWith('{')) continue; // boot banner, Adalight header, …
			try {
				const parsed = JSON.parse(line);
				if (parsed.state) {
					doc = parsed;
					pendingReply?.(parsed);
					pendingReply = null;
				}
			} catch {
				// partial or non-API line — ignore
			}
		}
	});
	port.on('error', (err) => console.error(`[wled-dev] serial error: ${err.message}`));

	// one command in flight at a time; every write requests a verbose reply,
	// which doubles as the cache/broadcast refresh
	let chain: Promise<unknown> = Promise.resolve();
	function send(patch: Record<string, unknown>): Promise<object> {
		const run = () =>
			new Promise<object>((resolve) => {
				const timer = setTimeout(() => {
					if (pendingReply) {
						pendingReply = null;
						console.warn('[wled-dev] serial reply timeout');
						resolve(doc);
					}
				}, 3000);
				pendingReply = (reply) => {
					clearTimeout(timer);
					resolve(reply);
					broadcast(reply);
				};
				port.write(JSON.stringify({ ...patch, v: true }) + '\n');
			});
		const next = chain.then(run, run);
		chain = next;
		return next;
	}

	let lastBroadcast = '';
	function broadcast(reply: object) {
		const msg = JSON.stringify(reply);
		if (msg === lastBroadcast) return;
		lastBroadcast = msg;
		for (const client of wss.clients) {
			if (client.readyState === WebSocket.OPEN) client.send(msg);
		}
	}

	const reply = (res: ServerResponse, body: unknown, code = 200) => {
		res.statusCode = code;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(body));
	};

	return {
		name: 'wled-serial',
		configureServer(server) {
			console.log(`[wled-dev] bridging /json and /ws to ${portPath} (USB serial)`);

			server.middlewares.use((req, res, next) => {
				const url = new URL(req.url ?? '/', 'http://localhost');
				if (url.pathname !== '/json' && !url.pathname.startsWith('/json/')) return next();
				const sub = url.pathname.replace(/^\/json\/?/, '');

				if (sub === 'cfg' || sub === 'net') {
					console.warn(`[wled-dev] /json/${sub} is not available over USB serial (state API only)`);
					return reply(res, { error: `${sub} not available over USB serial` }, 501);
				}

				if (req.method === 'POST') {
					let raw = '';
					req.on('data', (chunk) => (raw += chunk));
					req.on('end', async () => {
						try {
							const fresh = await send(JSON.parse(raw));
							reply(res, JSON.parse(raw).v ? fresh : { success: true });
						} catch {
							reply(res, { error: 9 }, 400);
						}
					});
					return;
				}

				send({}).then((fresh: { state?: unknown; info?: unknown }) => {
					switch (sub) {
						case 'state':
							return reply(res, fresh.state);
						case 'info':
							return reply(res, fresh.info);
						case 'eff':
							return reply(res, EFFECT_NAMES); // not exposed over serial; known prefix
						case 'pal':
							return reply(res, PALETTE_NAMES);
						default:
							return reply(res, { ...fresh, effects: EFFECT_NAMES, palettes: PALETTE_NAMES });
					}
				});
			});

			server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
				if (!req.url?.startsWith('/ws')) return;
				wss.handleUpgrade(req, socket, head, (ws) => {
					send({}).then((fresh) => ws.send(JSON.stringify(fresh)));
					ws.on('message', (data) => {
						try {
							send(JSON.parse(data.toString()));
						} catch {
							// ignore malformed frames
						}
					});
				});
			});

			// keep the cache warm and pick up changes made outside this session
			const poll = setInterval(() => send({}), 2000);
			server.httpServer?.on('close', () => {
				clearInterval(poll);
				port.close();
			});
		}
	};
}

function mockPlugin(): Plugin {
	const state = mockState();
	const wss = new WebSocketServer({ noServer: true });
	// WLED_MOCK_FRESH=1 simulates a factory-fresh device (default SSID → app shows #/setup)
	const cfg = {
		nw: { ins: [{ ssid: process.env.WLED_MOCK_FRESH ? 'Your_Network' : 'MockNet' }] },
		def: { ps: 0, on: true, bri: 128 },
		...MOCK_CFG_EXTRAS
	};
	// presets saved via {"psave":N} — served at /presets.json like the firmware
	const presets: Record<number, unknown> = {};

	// like serializeNetworks: first poll starts a "scan" (empty reply), the next
	// serves results and re-arms, so every fetch cycle behaves like real firmware
	let scanArmed = false;
	const MOCK_NETWORKS = [
		{ ssid: 'MockNet', rssi: -48, bssid: 'AA:00', channel: 6, enc: 3 },
		{ ssid: 'MockNet', rssi: -70, bssid: 'AA:01', channel: 11, enc: 3 }, // 2nd AP, tests dedupe
		{ ssid: 'Neighbors 5G', rssi: -62, bssid: 'BB:00', channel: 1, enc: 3 },
		{ ssid: 'Cafe Guest', rssi: -75, bssid: 'CC:00', channel: 6, enc: 0 },
		{ ssid: 'FRITZ!Box 7590', rssi: -85, bssid: 'DD:00', channel: 13, enc: 3 }
	];

	const fullJson = () => ({
		state,
		info: MOCK_INFO,
		effects: EFFECT_NAMES,
		palettes: PALETTE_NAMES
	});

	function broadcast() {
		const msg = JSON.stringify({ state, info: MOCK_INFO });
		for (const client of wss.clients) {
			if (client.readyState === WebSocket.OPEN) client.send(msg);
		}
	}

	// Accepts the same JSON as deserializeState (the subset the UI uses).
	function applyState(patch: Record<string, unknown>): void {
		if (typeof patch.psave === 'number') {
			presets[patch.psave] = { n: patch.n ?? `Preset ${patch.psave}`, ...structuredClone(state) };
			// like savePreset(): a "bootps" key alongside psave updates the boot preset
			if (typeof patch.bootps === 'number') {
				cfg.def.ps = patch.bootps;
				MOCK_INFO.leds.bootps = patch.bootps;
			}
			console.log(
				`[wled-mock] state saved to preset ${patch.psave}` +
					(typeof patch.bootps === 'number' ? ` (boot preset → ${patch.bootps})` : '')
			);
			return;
		}
		if (patch.on === 't') state.on = !state.on;
		else if (typeof patch.on === 'boolean') state.on = patch.on;
		if (typeof patch.bri === 'number') state.bri = Math.min(255, Math.max(0, patch.bri));
		if (patch.nl && typeof patch.nl === 'object') Object.assign(state.nl, patch.nl);
		if (patch.udpn && typeof patch.udpn === 'object') Object.assign(state.udpn, patch.udpn);
		if (Array.isArray(patch.seg)) {
			for (const segPatch of patch.seg as Record<string, unknown>[]) {
				const seg = state.seg[typeof segPatch.id === 'number' ? segPatch.id : 0];
				if (!seg) continue;
				for (const key of ['on', 'bri', 'fx', 'sx', 'ix', 'pal', 'col'] as const) {
					if (segPatch[key] !== undefined) (seg as Record<string, unknown>)[key] = segPatch[key];
				}
			}
		}
		const fx = state.seg[0].fx;
		console.log(
			`[wled-mock] on=${state.on} bri=${state.bri} fx=${fx} (${EFFECT_NAMES[fx] ?? '?'})`
		);
		broadcast();
	}

	function handleJson(req: IncomingMessage, res: ServerResponse, url: URL): void {
		const sub = url.pathname.replace(/^\/json\/?/, '');
		const reply = (body: unknown) => {
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.end(JSON.stringify(body));
		};

		if (req.method === 'POST') {
			let raw = '';
			req.on('data', (chunk) => (raw += chunk));
			req.on('end', () => {
				try {
					const patch = JSON.parse(raw);
					if (sub === 'cfg') {
						const ssid = patch?.nw?.ins?.[0]?.ssid;
						if (typeof ssid === 'string') cfg.nw.ins[0].ssid = ssid;
						const name = patch?.id?.name;
						if (typeof name === 'string') {
							cfg.id.name = name;
							MOCK_INFO.name = name;
						}
						if (patch?.def && typeof patch.def === 'object') Object.assign(cfg.def, patch.def);
						console.log(
							`[wled-mock] cfg updated: ssid=${cfg.nw.ins[0].ssid} name=${cfg.id.name}${patch.rb ? ' (reboot requested)' : ''}`
						);
					} else {
						applyState(patch);
					}
					reply(patch.v ? fullJson() : { success: true });
				} catch {
					res.statusCode = 400;
					reply({ error: 9 });
				}
			});
			return;
		}

		switch (sub) {
			case 'cfg':
				return reply(cfg);
			case 'net': {
				const results = scanArmed ? MOCK_NETWORKS : [];
				scanArmed = !scanArmed;
				return reply({ networks: results });
			}
			case 'state':
				return reply(state);
			case 'info':
				return reply(MOCK_INFO);
			case 'eff':
				return reply(EFFECT_NAMES);
			case 'pal':
				return reply(PALETTE_NAMES);
			case 'si':
				return reply({ state, info: MOCK_INFO });
			default:
				return reply(fullJson());
		}
	}

	return {
		name: 'wled-mock',
		configureServer(server) {
			console.log('[wled-dev] WLED_HOST not set — using built-in mock WLED');

			server.middlewares.use((req, res, next) => {
				const url = new URL(req.url ?? '/', 'http://localhost');
				if (url.pathname === '/json' || url.pathname.startsWith('/json/')) {
					return handleJson(req, res, url);
				}
				if (url.pathname === '/presets.json') {
					res.setHeader('Content-Type', 'application/json');
					return res.end(JSON.stringify(presets));
				}
				next();
			});

			server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
				if (!req.url?.startsWith('/ws')) return;
				wss.handleUpgrade(req, socket, head, (ws) => {
					// like ws.cpp: push full state on connect, accept state JSON
					ws.send(JSON.stringify({ state, info: MOCK_INFO }));
					ws.on('message', (data) => {
						try {
							const msg = JSON.parse(data.toString());
							if (msg.v) ws.send(JSON.stringify({ state, info: MOCK_INFO }));
							else applyState(msg);
						} catch {
							// ignore malformed frames, like the firmware does
						}
					});
				});
			});
		}
	};
}

export function wledDev(): Plugin {
	if (process.env.WLED_HOST) return proxyPlugin(process.env.WLED_HOST);
	if (process.env.WLED_USB) return serialPlugin(process.env.WLED_USB);
	return mockPlugin();
}

/**
 * Reactive client for the WLED JSON API.
 *
 * Talks to the device via WebSocket /ws (state pushed on connect and on every
 * change, accepts the same state JSON — see wled00/ws.cpp). Falls back to
 * polling GET /json/state when the socket is down, and keeps retrying the
 * socket with backoff. All URLs are relative: same code works against the
 * dev mock, the dev proxy, and the firmware serving the UI from flash.
 */

export interface WledSegment {
	id: number;
	on: boolean;
	bri: number;
	fx: number;
	sx: number;
	ix: number;
	pal: number;
	col: number[][];
}

/** Nightlight (state.nl — wled00/json.cpp deserializeState). */
export interface WledNightlight {
	on: boolean;
	/** minutes */
	dur: number;
	/** 0 instant, 1 fade, 2 color fade, 3 sunrise */
	mode: number;
	/** target brightness */
	tbri: number;
}

/** UDP sync (state.udpn). */
export interface WledSync {
	send: boolean;
	recv: boolean;
}

export interface WledState {
	on: boolean;
	bri: number;
	nl?: WledNightlight;
	udpn?: WledSync;
	seg: WledSegment[];
}

export interface WledInfo {
	name?: string;
	ver?: string;
	ip?: string;
	leds?: { count?: number; bootps?: number };
}

export type Connection = 'connecting' | 'live' | 'polling' | 'offline';

/** State patch as accepted by deserializeState — everything optional. */
export type WledStatePatch = Partial<Omit<WledState, 'seg' | 'nl' | 'udpn'>> & {
	seg?: Partial<WledSegment>[];
	nl?: Partial<WledNightlight>;
	udpn?: Partial<WledSync>;
} & Record<string, unknown>;

/** Factory-default client SSID (DEFAULT_CLIENT_SSID in wled00/const.h) — means "never configured". */
export const UNCONFIGURED_SSID = 'Your_Network';

/** First configured WiFi SSID from /json/cfg, or null if unreachable. */
export async function fetchWifiSsid(): Promise<string | null> {
	try {
		const res = await fetch('/json/cfg');
		if (!res.ok) return null;
		const cfg = await res.json();
		return cfg?.nw?.ins?.[0]?.ssid ?? null;
	} catch {
		return null;
	}
}

/**
 * Save WiFi credentials and reboot the device so it connects.
 * Config is persisted before the reboot fires (wled.cpp gates doReboot on configNeedsWrite).
 */
export async function saveWifiAndReboot(ssid: string, psk: string): Promise<boolean> {
	try {
		const res = await fetch('/json/cfg', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ nw: { ins: [{ ssid, psk }] }, rb: true })
		});
		return res.ok;
	} catch {
		return false;
	}
}

export interface CfgDetails {
	/** mDNS hostname without .local */
	mdns: string | null;
	/** first LED output's data GPIO */
	ledPin: number | null;
}

/**
 * Config details the info endpoint doesn't carry. Null when /json/cfg is
 * unavailable (e.g. USB serial dev bridge) — callers hide those rows.
 */
export async function fetchCfgDetails(): Promise<CfgDetails | null> {
	try {
		const res = await fetch('/json/cfg');
		if (!res.ok) return null;
		const cfg = await res.json();
		return {
			mdns: cfg?.id?.mdns ?? null,
			ledPin: cfg?.hw?.led?.ins?.[0]?.pin?.[0] ?? null
		};
	} catch {
		return null;
	}
}

export interface WifiNetwork {
	ssid: string;
	rssi: number;
	enc: number; // 0 = open network
}

/**
 * One poll of the WiFi scan (GET /json/net). The firmware returns cached results
 * and starts a new scan when none are ready — an empty list means "still scanning,
 * ask again". Returns null when scanning isn't available (e.g. USB serial dev bridge).
 */
export async function fetchNetworks(): Promise<WifiNetwork[] | null> {
	try {
		const res = await fetch('/json/net');
		if (!res.ok) return null;
		const list: WifiNetwork[] = (await res.json()).networks ?? [];
		// dedupe multi-AP networks by SSID, keep the strongest signal
		const bySsid: Record<string, WifiNetwork> = {};
		for (const network of list) {
			if (!network.ssid) continue;
			const seen = bySsid[network.ssid];
			if (!seen || seen.rssi < network.rssi) bySsid[network.ssid] = network;
		}
		return Object.values(bySsid).sort((a, b) => b.rssi - a.rssi);
	} catch {
		return null;
	}
}

/** True once the device answers /json/info again (e.g. after a reboot). */
export async function deviceReachable(): Promise<boolean> {
	try {
		const res = await fetch('/json/info', { signal: AbortSignal.timeout(2000) });
		return res.ok;
	} catch {
		return false;
	}
}

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 15000;
const POLL_INTERVAL_MS = 3000;

/**
 * Preset slot for "pick up where I left off": every (debounced) state change
 * is saved here and cfg def.ps makes the firmware apply it at boot. Slot 250
 * is the highest valid id — well away from any presets made by hand.
 */
const LAST_STATE_PRESET = 250;
/** Settle time before persisting — also keeps flash writes off the drag path. */
const PERSIST_DEBOUNCE_MS = 3000;
const PERSIST_CMD = {
	psave: LAST_STATE_PRESET,
	n: 'Last state',
	ib: true, // include brightness
	sb: true // include segment bounds
};

class WledClient {
	state = $state<WledState | null>(null);
	effects = $state<string[]>([]);
	connection = $state<Connection>('connecting');
	/** Device info (GET /json/info), fetched once at start. */
	info = $state<WledInfo | null>(null);

	/**
	 * Liveview seam for preview renderers that show real LED data: refcounted
	 * so several consumers can share one stream. TODO when a live renderer
	 * lands: send {"lv":true} on the socket while watchers > 0 and decode the
	 * binary frames (one RGB triple per LED) into liveColors.
	 */
	liveColors = $state<Uint8Array | null>(null);
	#liveWatchers = 0;

	#ws: WebSocket | null = null;
	#reconnectDelay = RECONNECT_MIN_MS;
	#pollTimer: ReturnType<typeof setInterval> | null = null;
	#started = false;
	#lastPatchAt = 0;

	/**
	 * The device echoes the full state after every change we send; while the
	 * user is dragging, stale echoes would fight the optimistic local state
	 * and make sliders jump. Freshly-patched → ignore pushes briefly.
	 */
	#echoGuard(): boolean {
		return Date.now() - this.#lastPatchAt < 350;
	}

	start(): void {
		if (this.#started) return;
		this.#started = true;
		this.#fetchEffects();
		this.#fetchInfo();
		window.addEventListener('pagehide', () => this.#flushPersist());
		this.#connect();
	}

	startLiveview(): void {
		this.#liveWatchers++;
	}

	stopLiveview(): void {
		this.#liveWatchers = Math.max(0, this.#liveWatchers - 1);
		if (this.#liveWatchers === 0) this.liveColors = null;
	}

	/** Send a state patch to the device and apply it optimistically. */
	setState(patch: WledStatePatch): void {
		this.#lastPatchAt = Date.now();
		if (this.state) {
			if (typeof patch.on === 'boolean') this.state.on = patch.on;
			if (typeof patch.bri === 'number') this.state.bri = patch.bri;
			if (patch.nl && this.state.nl) Object.assign(this.state.nl, patch.nl);
			if (patch.udpn && this.state.udpn) Object.assign(this.state.udpn, patch.udpn);
			const segPatch = patch.seg?.[0];
			if (segPatch && this.state.seg[0]) {
				// col patches are per-slot (like the firmware applies them) — a
				// primary-only patch must not clobber secondary/tertiary
				const { col, ...rest } = segPatch;
				Object.assign(this.state.seg[0], rest);
				col?.forEach((c, i) => {
					if (this.state!.seg[0].col) this.state!.seg[0].col[i] = c;
				});
			}
		}
		this.#send(patch);
		this.#schedulePersist();
	}

	#send(payload: object): void {
		if (this.#ws?.readyState === WebSocket.OPEN) {
			this.#ws.send(JSON.stringify(payload));
		} else {
			fetch('/json/state', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			}).catch(() => this.#setDisconnected());
		}
	}

	#persistTimer: ReturnType<typeof setTimeout> | null = null;
	/**
	 * True while the device's boot preset isn't ours yet (detected from
	 * info.leds.bootps). The next save then includes "bootps" — savePreset
	 * applies it and persists cfg, so this works on every transport, including
	 * the USB serial bridge where /json/cfg doesn't exist. Only sent when
	 * needed: the bootps key forces a cfg flash write every time.
	 */
	#needBootPreset = false;

	#persistCmd(): object {
		return this.#needBootPreset ? { ...PERSIST_CMD, bootps: LAST_STATE_PRESET } : PERSIST_CMD;
	}

	#schedulePersist(): void {
		if (this.#persistTimer) clearTimeout(this.#persistTimer);
		this.#persistTimer = setTimeout(() => {
			this.#persistTimer = null;
			// never persist "off" — a wearable should boot glowing with the
			// last look, not dark because the last action was power-off
			if (this.state?.on) {
				this.#send(this.#persistCmd());
				this.#needBootPreset = false;
			}
		}, PERSIST_DEBOUNCE_MS);
	}

	/** pagehide: a pending save would be lost — fire it right now. */
	#flushPersist(): void {
		if (!this.#persistTimer) return;
		clearTimeout(this.#persistTimer);
		this.#persistTimer = null;
		if (this.state?.on) {
			navigator.sendBeacon(
				'/json/state',
				new Blob([JSON.stringify(this.#persistCmd())], { type: 'application/json' })
			);
		}
	}

	togglePower(): void {
		this.setState({ on: !this.state?.on });
	}

	setBrightness(bri: number): void {
		this.setState({ bri });
	}

	setPalette(pal: number): void {
		this.setState({ seg: [{ id: 0, pal }] });
	}

	/** Effect speed, 0–255 (seg.sx). */
	setSpeed(sx: number): void {
		this.setState({ seg: [{ id: 0, sx }] });
	}

	/** Effect intensity, 0–255 (seg.ix). */
	setIntensity(ix: number): void {
		this.setState({ seg: [{ id: 0, ix }] });
	}

	setNightlight(nl: Partial<WledNightlight>): void {
		this.setState({ nl });
	}

	setSync(udpn: Partial<WledSync>): void {
		this.setState({ udpn });
	}

	/**
	 * Rename the device (cfg id.name — persisted to flash, applies without
	 * reboot). Updates the local info copy optimistically.
	 */
	async setDeviceName(name: string): Promise<boolean> {
		try {
			const res = await fetch('/json/cfg', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: { name } })
			});
			if (res.ok && this.info) this.info.name = name;
			return res.ok;
		} catch {
			return false;
		}
	}

	async #fetchEffects(): Promise<void> {
		try {
			const res = await fetch('/json/eff');
			if (res.ok) this.effects = await res.json();
		} catch {
			// effect names are cosmetic; retried on next successful connect
		}
	}

	async #fetchInfo(): Promise<void> {
		try {
			const res = await fetch('/json/info');
			if (res.ok) {
				this.info = await res.json();
				this.#needBootPreset = this.info?.leds?.bootps !== LAST_STATE_PRESET;
			}
		} catch {
			// name is cosmetic; header falls back to "WLED"
		}
	}

	#connect(): void {
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		const ws = new WebSocket(`${proto}://${location.host}/ws`);
		this.#ws = ws;

		ws.onopen = () => {
			this.connection = 'live';
			this.#reconnectDelay = RECONNECT_MIN_MS;
			this.#stopPolling();
			if (this.effects.length === 0) this.#fetchEffects();
		};
		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.state && !this.#echoGuard()) this.state = msg.state;
			} catch {
				// binary/liveview frames are not used here
			}
		};
		ws.onclose = () => {
			this.#ws = null;
			this.#setDisconnected();
			setTimeout(() => this.#connect(), this.#reconnectDelay);
			this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, RECONNECT_MAX_MS);
		};
		ws.onerror = () => ws.close();
	}

	#setDisconnected(): void {
		if (this.connection === 'live') this.connection = 'connecting';
		this.#startPolling();
	}

	#startPolling(): void {
		if (this.#pollTimer) return;
		this.#pollTimer = setInterval(async () => {
			try {
				const res = await fetch('/json/state');
				if (!res.ok) throw new Error(String(res.status));
				const fresh = await res.json();
				if (!this.#echoGuard()) this.state = fresh;
				this.connection = 'polling';
			} catch {
				this.connection = 'offline';
			}
		}, POLL_INTERVAL_MS);
	}

	#stopPolling(): void {
		if (this.#pollTimer) {
			clearInterval(this.#pollTimer);
			this.#pollTimer = null;
		}
	}
}

export const wled = new WledClient();

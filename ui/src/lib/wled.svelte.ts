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

export interface WledState {
	on: boolean;
	bri: number;
	seg: WledSegment[];
}

export type Connection = 'connecting' | 'live' | 'polling' | 'offline';

/** State patch as accepted by deserializeState — everything optional. */
export type WledStatePatch = Partial<Omit<WledState, 'seg'>> & {
	seg?: Partial<WledSegment>[];
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

class WledClient {
	state = $state<WledState | null>(null);
	effects = $state<string[]>([]);
	connection = $state<Connection>('connecting');

	#ws: WebSocket | null = null;
	#reconnectDelay = RECONNECT_MIN_MS;
	#pollTimer: ReturnType<typeof setInterval> | null = null;
	#started = false;

	start(): void {
		if (this.#started) return;
		this.#started = true;
		this.#fetchEffects();
		this.#connect();
	}

	/** Send a state patch to the device and apply it optimistically. */
	setState(patch: WledStatePatch): void {
		if (this.state) {
			if (typeof patch.on === 'boolean') this.state.on = patch.on;
			if (typeof patch.bri === 'number') this.state.bri = patch.bri;
			const segPatch = patch.seg?.[0];
			if (segPatch && this.state.seg[0]) Object.assign(this.state.seg[0], segPatch);
		}
		if (this.#ws?.readyState === WebSocket.OPEN) {
			this.#ws.send(JSON.stringify(patch));
		} else {
			fetch('/json/state', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patch)
			}).catch(() => this.#setDisconnected());
		}
	}

	togglePower(): void {
		this.setState({ on: !this.state?.on });
	}

	setBrightness(bri: number): void {
		this.setState({ bri });
	}

	setEffect(fx: number): void {
		this.setState({ on: true, seg: [{ id: 0, fx }] });
	}

	async #fetchEffects(): Promise<void> {
		try {
			const res = await fetch('/json/eff');
			if (res.ok) this.effects = await res.json();
		} catch {
			// effect names are cosmetic; retried on next successful connect
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
				if (msg.state) this.state = msg.state;
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
				this.state = await res.json();
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

/**
 * Pointer-drag helper shared by sliders, the hue ring and swipe gestures:
 * from a pointerdown, follow the pointer globally until release.
 */
export function trackDrag(
	event: PointerEvent,
	onMove: (ev: PointerEvent) => void,
	onUp?: (ev: PointerEvent) => void
): void {
	event.preventDefault();
	const move = (ev: PointerEvent) => onMove(ev);
	const up = (ev: PointerEvent) => {
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', up);
		window.removeEventListener('pointercancel', up);
		onUp?.(ev);
	};
	window.addEventListener('pointermove', move);
	window.addEventListener('pointerup', up);
	window.addEventListener('pointercancel', up);
	onMove(event);
}

/**
 * Rate-limit `fn` to one call per `ms`, trailing — the latest arguments always
 * get delivered. Keeps pointer-drags from flooding the device with updates.
 */
export function rateLimit<A extends unknown[]>(
	fn: (...args: A) => void,
	ms: number
): (...args: A) => void {
	let last = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pending: A | null = null;
	return (...args: A) => {
		const now = Date.now();
		if (now - last >= ms && !timer) {
			last = now;
			fn(...args);
			return;
		}
		pending = args;
		timer ??= setTimeout(
			() => {
				timer = null;
				last = Date.now();
				if (pending) fn(...pending);
				pending = null;
			},
			ms - (now - last)
		);
	};
}

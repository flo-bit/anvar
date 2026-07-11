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

import type { Component } from 'svelte';
import type { ControlKind } from '$lib/registry/types';
import ColorCell from './ColorCell.svelte';
import ColorPopover from './ColorPopover.svelte';
import PaletteCell from './PaletteCell.svelte';
import PalettePopover from './PalettePopover.svelte';
import MotionCell from './MotionCell.svelte';
import MotionPopover from './MotionPopover.svelte';

export interface CellProps {
	/** Whether this cell's popover is open. */
	active: boolean;
	onclick: () => void;
}

/**
 * Control registry: an EffectDef's `controls` list is rendered by looking up
 * cell + popover pairs here. A new control kind (e.g. WLED's custom sliders)
 * is one new pair plus a ControlKind entry — the dock doesn't change.
 */
export const CELLS: Record<ControlKind, { cell: Component<CellProps>; popover: Component }> = {
	color: { cell: ColorCell, popover: ColorPopover },
	palette: { cell: PaletteCell, popover: PalettePopover },
	motion: { cell: MotionCell, popover: MotionPopover }
};

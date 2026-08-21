'use client';

import { useCallback, useId } from 'react';

import { PlusIcon, TrashIcon } from '@velobitsio/icons';
import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SegmentedControl,
  Slider,
  cn,
} from '@velobitsio/ui';

import {
  GRADIENT_MAX_STOPS,
  GRADIENT_MIN_STOPS,
  GRADIENT_PRESETS,
  gradientCss,
  gradientVector,
  type GradientConfig,
  type GradientStop,
} from './icon-config';

export interface GradientEditorProps {
  value: GradientConfig;
  onChange: (next: GradientConfig) => void;
}

/**
 * The gradient editor, in a Popover.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## WHY THIS IS A POPOVER AND NOT A ROW IN THE DIALOG
 *
 * Not a style preference , an arithmetic one. `IconDetailDialog` measures 826px
 * on its tallest tab against a 905px viewport, and it is not allowed to scroll:
 * the whole point of a playground is that the result and the copy button are
 * both visible while you dial the input. Type, angle, presets and a variable
 * list of stops is 150px of controls minimum. There was nowhere to put it.
 *
 * A Popover costs the dialog zero height and, as it happens, is also the better
 * interaction: a gradient is a sub-editor for one of twelve colour choices, and
 * eleven of them need no editor at all. Radix layers it above the dialog and
 * handles the focus trap and Escape, so closing it returns focus to the trigger
 * rather than to the dialog root.
 *
 * ## The trigger is not the swatch, and that is deliberate
 *
 * The gradient dot in the colour grid is a real `<input type="radio">` in the
 * same group as the ten token swatches, so arrow keys reach it. Native radios
 * fire `change` on arrow-key selection, so hanging the popover off selection
 * would pop the editor open while someone was merely arrowing PAST it. The dot
 * therefore only selects the mode, and this trigger , which appears underneath
 * once gradient is the active choice , opens the editor.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function GradientEditor({ value, onChange }: GradientEditorProps) {
  const kindLabelId = useId();
  const angleLabelId = useId();

  const patch = useCallback(
    (next: Partial<GradientConfig>) => onChange({ ...value, ...next }),
    [onChange, value],
  );

  const patchStop = useCallback(
    (id: string, next: Partial<GradientStop>) =>
      patch({ stops: value.stops.map((stop) => (stop.id === id ? { ...stop, ...next } : stop)) }),
    [patch, value.stops],
  );

  const addStop = useCallback(() => {
    /*
     * A new stop lands in the largest GAP, not at the end.
     *
     * Appending at 100% collides with the stop already there, and two stops at
     * the same offset render as a hard edge , so "add stop" would appear to do
     * nothing while quietly changing the gradient. Bisecting the widest interval
     * puts it where there is visibly room, which is also where someone reaching
     * for another stop was most likely aiming.
     */
    const sorted = [...value.stops].sort((a, b) => a.offset - b.offset);
    let gapStart = 0;
    let gapSize = -1;
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const size = sorted[index + 1]!.offset - sorted[index]!.offset;
      if (size > gapSize) {
        gapSize = size;
        gapStart = sorted[index]!.offset;
      }
    }
    const offset = Math.round(gapStart + gapSize / 2);

    patch({
      stops: [
        ...value.stops,
        {
          // `crypto.randomUUID` is not reachable on http:// origins other than
          // localhost, and this file is served from a static export people do
          // open over plain HTTP. A counter off the current length is enough:
          // ids only have to be unique within one list.
          id: `stop-${Date.now()}-${value.stops.length}`,
          color: '#FFFFFF',
          offset,
        },
      ],
    });
  }, [patch, value.stops]);

  const removeStop = useCallback(
    (id: string) => patch({ stops: value.stops.filter((stop) => stop.id !== id) }),
    [patch, value.stops],
  );

  const sorted = [...value.stops].sort((a, b) => a.offset - b.offset);
  const vector = gradientVector(value.angle);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-7 w-full items-center gap-2 rounded-md border border-input bg-panel px-1.5',
            'control-recessed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
            'transition-colors duration-micro ease-out hover:border-field-border',
          )}
        >
          {/* The preview bar IS the trigger's label, so the button says what it
              edits without spending a word on it. The text beside it carries the
              accessible name, since a gradient has no readable value. */}
          <span
            className="h-4 flex-1 rounded-[3px] border border-border"
            style={{ backgroundImage: gradientCss(value) }}
          />
          <span className="shrink-0 pe-0.5 text-xs text-muted-foreground">Edit</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-3">
        <PopoverHeader>
          <PopoverTitle className="text-sm">Gradient</PopoverTitle>
        </PopoverHeader>

        {/* ── Type ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <span id={kindLabelId} className="text-sm font-medium text-fg">
            Type
          </span>
          <SegmentedControl
            aria-labelledby={kindLabelId}
            value={value.kind}
            onValueChange={(kind) => patch({ kind: kind as GradientConfig['kind'] })}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'radial', label: 'Radial' },
            ]}
          />
        </div>

        {/* ── Angle ────────────────────────────────────────────────────────── */}
        {/*
         * Linear only, and REMOVED rather than disabled when radial is active. A
         * radial gradient has no direction at all, so a greyed-out angle implies
         * a setting that is temporarily unavailable rather than one that does not
         * exist. The emitted `<radialGradient>` carries no vector either, so the
         * control and the output agree about that.
         */}
        {value.kind === 'linear' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span id={angleLabelId} className="text-sm font-medium text-fg">
                Angle
              </span>
              <code className="font-mono text-xs tabular-nums text-muted-foreground">
                {value.angle}°
              </code>
            </div>
            <Slider
              aria-labelledby={angleLabelId}
              value={[value.angle]}
              onValueChange={([angle]) => patch({ angle: angle ?? value.angle })}
              min={0}
              max={360}
              step={15}
              // "135" alone is ambiguous between degrees and percent on a control
              // whose other sibling in this dialog is measured in pixels.
              formatValue={(angle) => `${angle} degrees`}
            />
            {/*
             * The resolved vector, shown rather than hidden.
             *
             * SVG has no angle attribute , this is the arithmetic that turns one
             * into `x1/y1/x2/y2`, and it is exactly what lands in the copied
             * snippet. Printing it means the reader can match the code to the
             * control instead of wondering where four coordinates came from.
             *
             * The numbers are user-space coordinates on the 24x24 grid, not 0-1
             * fractions, because the gradient is `userSpaceOnUse` , which it has
             * to be, or every axis-aligned path in the glyph vanishes. See
             * GRADIENT_UNITS.
             */}
            <code className="block truncate font-mono text-[0.625rem] text-muted-foreground">
              x1={vector.x1} y1={vector.y1} x2={vector.x2} y2={vector.y2}
            </code>
          </div>
        ) : null}

        {/* ── Presets ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg">Presets</span>
          {/*
           * A preset replaces the STOPS and leaves type and angle alone. Someone
           * who has set 45° radial and then picks a colour pair is asking to
           * recolour what they built, not to start over , and the alternative
           * loses work with no undo in reach.
           */}
          <div className="flex gap-2">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() =>
                  patch({
                    stops: [
                      { id: `${preset.id}-0`, color: preset.stops[0], offset: 0 },
                      { id: `${preset.id}-1`, color: preset.stops[1], offset: 100 },
                    ],
                  })
                }
                className={cn(
                  'h-6 flex-1 rounded-md border border-border',
                  'outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  'transition-[border-color] duration-micro ease-out hover:border-fg',
                )}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${preset.stops[0]}, ${preset.stops[1]})`,
                }}
              >
                <span className="sr-only">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Stops ────────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg">Stops</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {value.stops.length}/{GRADIENT_MAX_STOPS}
            </span>
          </div>

          {/*
           * Rendered in SORTED order, and keyed by `stop.id` rather than by that
           * order's index. Dragging one stop past another reorders the list, and
           * an index key would move each row's DOM state , including an open OS
           * colour picker , onto whichever stop slid into that slot.
           */}
          {sorted.map((stop) => (
            <div key={stop.id} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Stop colour at ${stop.offset}%`}
                value={stop.color}
                onChange={(event) => patchStop(stop.id, { color: event.target.value })}
                className={cn(
                  'size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0',
                  'outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  '[&::-webkit-color-swatch-wrapper]:p-0',
                  '[&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
                  '[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
                )}
              />
              <input
                type="number"
                aria-label={`Stop position, percent, for ${stop.color}`}
                min={0}
                max={100}
                value={stop.offset}
                onChange={(event) => {
                  /*
                   * `Number('')` is 0, so an emptied field would snap the stop to
                   * 0% mid-typing , the same trap the size field hit before it
                   * became a slider. Here the field is small enough that a
                   * mirrored text state is overkill: rejecting a non-finite parse
                   * leaves the last good value in place and typing continues.
                   */
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) return;
                  patchStop(stop.id, { offset: Math.min(100, Math.max(0, Math.round(next))) });
                }}
                className={cn(
                  'h-7 w-16 rounded-md border border-input bg-panel px-2 font-mono text-xs tabular-nums text-fg',
                  'control-recessed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                )}
              />
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                {stop.color}
              </code>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove the stop at ${stop.offset}%`}
                // Two stops is the floor, and the button is really disabled
                // rather than hidden: a control that vanishes at the boundary
                // leaves no explanation of why it went.
                disabled={value.stops.length <= GRADIENT_MIN_STOPS}
                onClick={() => removeStop(stop.id)}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={value.stops.length >= GRADIENT_MAX_STOPS}
            onClick={addStop}
          >
            <PlusIcon />
            Add stop
          </Button>
        </div>

        {/* The label is the whole point of this row , the bar above is a preview
            of the gradient's own geometry, at the real angle and type. */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-fg">Preview</Label>
          <span
            className="block h-8 rounded-md border border-border"
            style={{ backgroundImage: gradientCss(value) }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

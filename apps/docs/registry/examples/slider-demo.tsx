'use client';

import { useState } from 'react';

import { Label, Slider } from '@velobitsio/ui';

export default function SliderDemo() {
  const [size, setSize] = useState([24]);
  const [range, setRange] = useState([20, 80]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/*
            A plain <span>, not a <Label>. Radix renders Slider.Root as a <span>
            and puts role="slider" on the THUMB, so `htmlFor` here would dangle
            silently , exactly the trap SegmentedControl documents. The name
            travels via aria-labelledby instead, and lands on the thumb.
          */}
          <span id="slider-demo-size" className="text-sm font-medium text-fg">
            Icon size
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{size[0]}px</span>
        </div>
        <Slider
          aria-labelledby="slider-demo-size"
          value={size}
          onValueChange={setSize}
          min={8}
          max={128}
          // Without this a screen reader announces a bare "24". The visible
          // label carries the unit once; aria-valuetext carries it every step.
          formatValue={(value) => `${value} pixels`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span id="slider-demo-range" className="text-sm font-medium text-fg">
            Rollout window
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {range[0]}–{range[1]}%
          </span>
        </div>
        {/*
          Two thumbs need two names. One shared name announces both handles
          identically, and a screen-reader user cannot tell which end they hold.
        */}
        <Slider
          aria-labelledby="slider-demo-range"
          thumbLabels={['Rollout window, start', 'Rollout window, end']}
          value={range}
          onValueChange={setRange}
          formatValue={(value) => `${value} percent`}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-fg">Disabled</Label>
        <Slider aria-label="A disabled slider" defaultValue={[40]} disabled />
      </div>
    </div>
  );
}

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function DistanceChips({ value, onChange }: Props) {
  const min = 0.5;
  const max = 50;
  const step = 0.5;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-serif text-3xl leading-none text-foreground">
          {value.toFixed(1)} <span className="text-base text-muted-foreground">km</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {min} – {max} km
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="loopwalk-slider w-full"
        style={
          {
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-surface-2) ${pct}%, var(--color-surface-2) 100%)`,
          } as React.CSSProperties
        }
      />
      <div className="flex flex-wrap gap-1.5">
        {[2, 5, 10, 15, 20, 30, 42.2, 50].map((d) => {
          const active = Math.abs(value - d) < 0.01;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground/70 hover:border-primary/60 hover:text-primary"
              }`}
            >
              {d} km
            </button>
          );
        })}
      </div>
    </div>
  );
}

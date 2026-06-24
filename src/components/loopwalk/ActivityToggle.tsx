import { Footprints, Bike, PersonStanding } from "lucide-react";
import type { Activity } from "@/lib/loopwalk/types";

interface Props {
  value: Activity;
  onChange: (a: Activity) => void;
}

const ITEMS: Array<{ id: Activity; label: string; Icon: typeof Footprints }> = [
  { id: "walk", label: "Walk", Icon: PersonStanding },
  { id: "run", label: "Run", Icon: Footprints },
  { id: "bike", label: "Bike", Icon: Bike },
];

export function ActivityToggle({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-surface p-1">
      {ITEMS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

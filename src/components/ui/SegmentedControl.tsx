interface SegmentedControlOption {
  id: string;
  label: string;
}

type SegmentedVariant = 'default' | 'glass';

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (id: string) => void;
  /** @deprecated Both variants now render the same; kept so older call sites compile. */
  variant?: SegmentedVariant;
  className?: string;
  /** Accessible name for the group, e.g. "Encoding". */
  ariaLabel?: string;
}

// One style for every variant; `glass` is kept as an alias for older call sites.
const wrapper = 'inline-flex flex-wrap items-center gap-0.5 p-0.5 rounded-md bg-surface-alt border border-border';
const active = 'bg-primary text-on-primary';
const inactive = 'text-text-secondary hover:text-text hover:bg-surface-hover';

/** A row of mutually exclusive toggle buttons; the selected one has aria-pressed. */
export default function SegmentedControl({ options, value, onChange, className = '', ariaLabel }: SegmentedControlProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={`${wrapper} ${className}`}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={`h-7 px-2.5 rounded-[5px] text-xs font-medium whitespace-nowrap transition-colors focus-ring focus-visible:relative focus-visible:z-10 ${
              selected ? active : inactive
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

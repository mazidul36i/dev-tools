interface SegmentedControlOption {
  id: string;
  label: string;
}

type SegmentedVariant = 'default' | 'glass';

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (id: string) => void;
  variant?: SegmentedVariant;
  className?: string;
}

const styles: Record<SegmentedVariant, { active: string; inactive: string; wrapper: string }> = {
  default: {
    active: 'bg-primary text-white shadow-soft',
    inactive: 'bg-surface-alt text-text-secondary border border-border hover:bg-surface-hover',
    wrapper: 'flex gap-2 flex-wrap',
  },
  glass: {
    active: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
    inactive: 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400',
    wrapper: 'flex rounded-lg overflow-hidden border border-white/60 dark:border-gray-700/60',
  },
};

export default function SegmentedControl({ options, value, onChange, variant = 'default', className = '' }: SegmentedControlProps) {
  const s = styles[variant];

  return (
    <div className={`${s.wrapper} ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            variant === 'default' ? 'px-4 py-2 text-sm rounded-lg' : ''
          } ${value === opt.id ? s.active : s.inactive}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}


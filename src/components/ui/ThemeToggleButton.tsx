import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { useTheme } from '@hooks/useTheme';

const themeIcons: Record<string, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

interface ThemeToggleButtonProps {
  className?: string;
  size?: number;
}

export default function ThemeToggleButton({
  className = 'p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all',
  size = 16,
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={`Theme: ${theme}`}
      title={`Current: ${theme}. Click to switch.`}
    >
      <ThemeIcon size={size} />
    </button>
  );
}


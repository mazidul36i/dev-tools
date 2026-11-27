import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { useTheme } from '@hooks/useTheme';

type ThemeName = 'light' | 'dark' | 'system';

const themeIcons: Record<ThemeName, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };
const themeLabels: Record<ThemeName, string> = { light: 'Light', dark: 'Dark', system: 'System' };
/** Must match the cycle in useTheme().toggleTheme. */
const nextTheme: Record<ThemeName, ThemeName> = { light: 'dark', dark: 'system', system: 'light' };

interface ThemeToggleButtonProps {
  className?: string;
  size?: number;
}

export default function ThemeToggleButton({
  className = 'inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors focus-ring',
  size = 18,
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];
  const label = `Theme: ${themeLabels[theme]}. Switch to ${themeLabels[nextTheme[theme]]}`;

  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label={label} title={label}>
      <ThemeIcon size={size} aria-hidden="true" />
    </button>
  );
}

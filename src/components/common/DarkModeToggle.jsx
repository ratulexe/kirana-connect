import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DarkModeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('kirana-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('kirana-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition-all duration-300 hover:border-primary/40 hover:bg-primary-soft hover:text-primary ${className}`}
    >
      <Sun className={`absolute size-4 transition-all duration-300 ${dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      <Moon className={`absolute size-4 transition-all duration-300 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
    </button>
  );
}

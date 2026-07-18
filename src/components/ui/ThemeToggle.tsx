'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <button
      onClick={toggle}
      className="relative rounded-xl p-2.5 transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        color: 'var(--muted-foreground)',
        background: 'var(--muted)',
      }}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      <div className="relative h-4 w-4">
        <Sun
          className="absolute inset-0 h-4 w-4 transition-all duration-300"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
          }}
        />
        <Moon
          className="absolute inset-0 h-4 w-4 transition-all duration-300"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
          }}
        />
      </div>
    </button>
  );
}

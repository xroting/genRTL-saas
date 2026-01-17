'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主题
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('genrtl-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored || (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  // 更新主题
  const updateTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('genrtl-theme', newTheme);
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateTheme(newTheme);
  };

  // 避免水合错误
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-300" />
    </Button>
  );
}

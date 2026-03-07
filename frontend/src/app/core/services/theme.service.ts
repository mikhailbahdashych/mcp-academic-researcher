import { Injectable, signal } from '@angular/core';

type Theme = 'dark-theme' | 'light-theme';

/**
 * Manages dark/light theme state with localStorage persistence.
 *
 * On initialization, resolves the theme from (in priority order):
 * 1. localStorage value (if previously set)
 * 2. OS preference via `prefers-color-scheme: dark`
 * 3. Dark theme as fallback
 *
 * Applies the theme by toggling CSS classes on document.body,
 * which controls Angular Material theming and CSS custom properties.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'mcp_theme';

  private _theme = signal<Theme>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();

  private resolveInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (stored === 'dark-theme' || stored === 'light-theme') return stored;
    } catch { /* SSR / private browsing */ }
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;
    return prefersDark ? 'dark-theme' : 'light-theme';
  }

  constructor() {
    this.applyTheme(this._theme());
  }

  toggle(): void {
    const next: Theme = this._theme() === 'dark-theme' ? 'light-theme' : 'dark-theme';
    this._theme.set(next);
    this.applyTheme(next);
    try { localStorage.setItem(this.STORAGE_KEY, next); } catch { /* ignore */ }
  }

  isDark(): boolean {
    return this._theme() === 'dark-theme';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(theme);
  }
}

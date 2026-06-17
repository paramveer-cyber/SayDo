"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const THEME_EVENT = "corsair:theme-changed";

function readStoredTheme(): Theme {
  const stored = localStorage.getItem("corsair-theme") as Theme | null;
  return stored ?? "dark";
}

/** Apply a theme to <html>, persist it, and notify other useTheme() instances. */
export function applyTheme(theme: Theme) {
  localStorage.setItem("corsair-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const resolved = readStoredTheme();
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);

    const onThemeChanged = (e: Event) => {
      const detail = (e as CustomEvent<Theme>).detail;
      setTheme(detail ?? readStoredTheme());
    };
    window.addEventListener(THEME_EVENT, onThemeChanged);
    return () => window.removeEventListener(THEME_EVENT, onThemeChanged);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  };

  return { theme, toggle };
}

/** Toggle the theme without needing a hook instance (used by global keybinds). */
export function toggleTheme() {
  const current = readStoredTheme();
  applyTheme(current === "dark" ? "light" : "dark");
}

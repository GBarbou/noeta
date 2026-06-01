"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
    } else {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const root = document.documentElement;

    // shadcn needs .dark class on <html>
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (theme === "dark") {
      root.style.setProperty("--bg", "#09090b");
      root.style.setProperty("--bg-raised", "rgba(24, 24, 27, 0.7)");
      root.style.setProperty("--bg-hover", "rgba(255, 255, 255, 0.04)");
      root.style.setProperty("--surface", "rgba(18, 18, 21, 0.6)");
      root.style.setProperty("--text", "#fafafa");
      root.style.setProperty("--text-secondary", "#a1a1aa");
      root.style.setProperty("--text-muted", "#52525b");
      root.style.setProperty("--border", "rgba(255, 255, 255, 0.06)");
      root.style.setProperty("--primary", "#22c55e");
      root.style.setProperty("--primary-hover", "#16a34a");
      root.style.setProperty("--primary-muted", "rgba(34, 197, 94, 0.12)");
      root.style.setProperty("--success", "#22c55e");
      root.style.setProperty("--success-muted", "rgba(34, 197, 94, 0.12)");
      root.style.setProperty("--error", "#ef4444");
      root.style.setProperty("--error-muted", "rgba(239, 68, 68, 0.12)");
      root.style.setProperty("--warning", "#eab308");
      root.style.setProperty("--warning-muted", "rgba(234, 179, 8, 0.12)");
    } else {
      root.style.setProperty("--bg", "#fafafa");
      root.style.setProperty("--bg-raised", "rgba(255, 255, 255, 0.9)");
      root.style.setProperty("--bg-hover", "rgba(0, 0, 0, 0.03)");
      root.style.setProperty("--surface", "rgba(255, 255, 255, 0.7)");
      root.style.setProperty("--text", "#09090b");
      root.style.setProperty("--text-secondary", "#52525b");
      root.style.setProperty("--text-muted", "#a1a1aa");
      root.style.setProperty("--border", "rgba(0, 0, 0, 0.06)");
      root.style.setProperty("--primary", "#16a34a");
      root.style.setProperty("--primary-hover", "#15803d");
      root.style.setProperty("--primary-muted", "rgba(22, 163, 74, 0.08)");
      root.style.setProperty("--success", "#16a34a");
      root.style.setProperty("--success-muted", "rgba(22, 163, 74, 0.08)");
      root.style.setProperty("--error", "#dc2626");
      root.style.setProperty("--error-muted", "rgba(220, 38, 38, 0.08)");
      root.style.setProperty("--warning", "#ca8a04");
      root.style.setProperty("--warning-muted", "rgba(202, 138, 4, 0.08)");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle({ className = "", style = {} }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg border transition-all duration-200 hover:bg-[var(--bg-hover)] ${className}`}
      style={{ backgroundColor: "transparent", borderColor: "var(--border)", color: "var(--text-muted)", ...style }}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export default ThemeProvider;

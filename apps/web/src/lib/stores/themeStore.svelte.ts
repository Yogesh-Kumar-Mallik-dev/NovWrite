/**
 * @file themeStore.svelte.ts
 * @description Svelte 5 Runes reactive store for Light and Dark theme management.
 * Synchronizes with documentElement classList and localStorage.
 */

export type ThemeMode = "light" | "dark";

class ThemeStore {
  mode = $state<ThemeMode>("dark");

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("novwrite-theme") as ThemeMode | null;
      if (saved === "light" || saved === "dark") {
        this.mode = saved;
      } else if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        this.mode = "light";
      } else {
        this.mode = "dark";
      }
      this.applyTheme();
    }
  }

  setTheme(mode: ThemeMode) {
    this.mode = mode;
    if (typeof window !== "undefined") {
      localStorage.setItem("novwrite-theme", mode);
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.setTheme(this.mode === "dark" ? "light" : "dark");
  }

  private applyTheme() {
    if (typeof document === "undefined") return;
    if (this.mode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }
}

export const themeStore = new ThemeStore();

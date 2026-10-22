import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "auto" | "dark" | "light";

export interface ThemeState {
  preference: ThemePreference;
  isDark: boolean;
  isNightShift: boolean;
  activeReason: string;
}

const STORAGE_KEY = "ain_theme_preference_v1";

export function isCurrentTimeNightShift(): boolean {
  const currentHour = new Date().getHours();
  // Night shift from 19:00 (7:00 PM) to 06:00 (6:00 AM)
  return currentHour >= 19 || currentHour < 6;
}

export function isSystemDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function computeIsDark(preference: ThemePreference): { isDark: boolean; reason: string; isNightShift: boolean } {
  const nightShift = isCurrentTimeNightShift();
  const sysDark = isSystemDark();

  if (preference === "dark") {
    return { isDark: true, reason: "النمط الليلي مفعّل يدوياً", isNightShift: nightShift };
  }
  if (preference === "light") {
    return { isDark: false, reason: "النمط النهاري مفعّل يدوياً", isNightShift: nightShift };
  }

  // "auto" mode: prioritzes night shift time (7 PM - 6 AM) or system OS dark mode
  if (nightShift) {
    return { isDark: true, reason: "تلقائي: مراعاة توقيت الوردية الليلية (19:00 - 06:00)", isNightShift: true };
  }
  if (sysDark) {
    return { isDark: true, reason: "تلقائي: طبقاً لإعدادات نظام التشغيل (Dark Mode)", isNightShift: false };
  }

  return { isDark: false, reason: "تلقائي: الوردية الصباحية / إعدادات النظام نهارية", isNightShift: false };
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference;
      if (saved === "dark" || saved === "light" || saved === "auto") {
        return saved;
      }
    }
    return "auto";
  });

  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const { isDark, reason, isNightShift } = computeIsDark(preference);
    return {
      preference,
      isDark,
      isNightShift,
      activeReason: reason,
    };
  });

  const applyTheme = useCallback((pref: ThemePreference) => {
    const { isDark, reason, isNightShift } = computeIsDark(pref);
    setThemeState({
      preference: pref,
      isDark,
      isNightShift,
      activeReason: reason,
    });

    if (typeof document !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.colorScheme = "light";
      }
    }
  }, []);

  const changePreference = useCallback((newPref: ThemePreference) => {
    setPreference(newPref);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newPref);
    }
    applyTheme(newPref);
  }, [applyTheme]);

  // Initial and listener effects
  useEffect(() => {
    applyTheme(preference);

    // Listen to system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (preference === "auto") {
        applyTheme("auto");
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Check time periodically (every 5 minutes) to trigger night shift automatically
    const interval = setInterval(() => {
      if (preference === "auto") {
        applyTheme("auto");
      }
    }, 5 * 60 * 1000);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      clearInterval(interval);
    };
  }, [preference, applyTheme]);

  return {
    preference,
    setPreference: changePreference,
    isDark: themeState.isDark,
    isNightShift: themeState.isNightShift,
    activeReason: themeState.activeReason,
  };
}

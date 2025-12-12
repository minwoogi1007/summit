"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // 저장된 테마 로드
  useEffect(() => {
    setMounted(true);
    
    // localStorage에서 테마 로드 (기본값: light)
    const savedTheme = localStorage.getItem("summit-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 테마 적용
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    const getResolvedTheme = (): "light" | "dark" => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return theme;
    };

    const resolved = getResolvedTheme();
    setResolvedTheme(resolved);

    // 클래스 적용
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 메타 테마 컬러 업데이트
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolved === "dark" ? "#1a1a2e" : "#d5804a"
      );
    }
  }, [theme, mounted]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      
      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("summit-theme", newTheme);
  };

  // SSR hydration 방지
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{ theme: "system", setTheme: handleSetTheme, resolvedTheme: "light" }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: handleSetTheme, resolvedTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


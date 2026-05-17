import React, { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
type ColorTheme = "blue" | "green" | "purple" | "orange" | "red";

interface ThemeContextType {
  mode: Mode;
  colorTheme: ColorTheme;
  setMode: (m: Mode) => void;
  setColorTheme: (c: ColorTheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  colorTheme: "blue",
  setMode: () => {},
  setColorTheme: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    try { return (localStorage.getItem("mat-mode") as Mode) ?? "light"; } catch { return "light"; }
  });
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    try { return (localStorage.getItem("mat-color") as ColorTheme) ?? "blue"; } catch { return "blue"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.setAttribute("data-color", colorTheme);
    try { localStorage.setItem("mat-mode", mode); } catch {}
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color", colorTheme);
    try { localStorage.setItem("mat-color", colorTheme); } catch {}
  }, [colorTheme]);

  function setMode(m: Mode) { setModeState(m); }
  function setColorTheme(c: ColorTheme) { setColorThemeState(c); }
  function toggleMode() { setModeState((prev) => (prev === "light" ? "dark" : "light")); }

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, setMode, setColorTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const COLOR_THEMES: { id: ColorTheme; label: string; hue: string }[] = [
  { id: "blue",   label: "Azul",    hue: "#1a56db" },
  { id: "green",  label: "Verde",   hue: "#15803d" },
  { id: "purple", label: "Roxo",    hue: "#6b21a8" },
  { id: "orange", label: "Laranja", hue: "#c2410c" },
  { id: "red",    label: "Vermelho",hue: "#b91c1c" },
];

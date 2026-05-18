import React, { createContext, useContext, useEffect, useState } from "react";

type ColorTheme = "blue" | "green" | "purple" | "orange" | "red";

interface ThemeContextType {
  theme: "dark";
  colorTheme: ColorTheme;
  setTheme: (theme: "dark") => void;
  setColorTheme: (c: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  colorTheme: "blue",
  setTheme: () => {},
  setColorTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    try { return (localStorage.getItem("mat-color") as ColorTheme) ?? "blue"; } catch { return "blue"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.setAttribute("data-color", colorTheme);
    try { localStorage.setItem("mat-color", colorTheme); } catch {}
  }, [colorTheme]);

  function setColorTheme(c: ColorTheme) { setColorThemeState(c); }

  return (
    <ThemeContext.Provider value={{ theme: "dark", colorTheme, setTheme: () => {}, setColorTheme }}>
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

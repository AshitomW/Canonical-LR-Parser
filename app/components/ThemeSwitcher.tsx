"use client";

import { useState, useEffect } from "react";

const themes = [
  "space",
  "terminal",
  "nord",
  "gruvbox",
  "monokai",
  "kanagawa",
  "tokyo-night",
  "catppuccin",
  "solarized-light",
  "latte",
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("space");

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme") || "space";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="theme-switcher">
      <select
        value={currentTheme}
        onChange={(e) => handleThemeChange(e.target.value)}
        className="theme-select"
      >
        {themes.map((theme) => (
          <option key={theme} value={theme}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

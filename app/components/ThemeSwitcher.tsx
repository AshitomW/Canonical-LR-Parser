"use client";

import { useState, useEffect } from "react";

const themes = [
  { id: "github-dark", name: "GitHub Dark", colors: ["#0d1117", "#161b22", "#58a6ff", "#c9d1d9"] },
  { id: "space", name: "Space", colors: ["#0a0a23", "#1b1b3a", "#a3a3ff", "#f5f5f5"] },
  { id: "terminal", name: "Terminal", colors: ["#0d0d0d", "#1a1a1a", "#33ff00", "#ccffcc"] },
  { id: "nord", name: "Nord", colors: ["#2e3440", "#3b4252", "#81a1c1", "#88c0d0"] },
  { id: "gruvbox", name: "Gruvbox", colors: ["#282828", "#3c3836", "#83a598", "#fabd2f"] },
  { id: "monokai", name: "Monokai", colors: ["#272822", "#383830", "#f92672", "#f8f8f2"] },
  { id: "kanagawa", name: "Kanagawa", colors: ["#1f1f28", "#2a2a37", "#7e9cd8", "#dcd7ba"] },
  { id: "tokyo-night", name: "Tokyo Night", colors: ["#1a1b26", "#24283b", "#c0caf5", "#7aa2f7"] },
  { id: "catppuccin", name: "Catppuccin", colors: ["#24273a", "#363a4f", "#b7bdf8", "#f5bde6"] },
  { id: "dracula", name: "Dracula", colors: ["#282a36", "#44475a", "#bd93f9", "#f8f8f2"] },
  { id: "one-dark", name: "One Dark", colors: ["#282c34", "#3e4451", "#61afef", "#abb2bf"] },
  { id: "oceanic-next", name: "Oceanic Next", colors: ["#1b2b34", "#343d46", "#6699cc", "#c8c8c8"] },
  { id: "solarized-light", name: "Solarized Light", colors: ["#fdf6e3", "#eee8d5", "#b58900", "#002b36"] },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "github-dark";
    }
    return "github-dark";
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "github-dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const currentThemeData = themes.find((t) => t.id === currentTheme) || themes[0];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="theme-selector-btn"
        aria-label="Select theme"
      >
        Theme: {currentThemeData.name}
      </button>

      {isOpen && (
        <div className="theme-popover-overlay" onClick={() => setIsOpen(false)}>
          <div className="theme-popover-page" onClick={(e) => e.stopPropagation()}>
            <div className="theme-popover-header">
              <h2 className="theme-popover-title">Select Theme</h2>
              <button
                className="theme-popover-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close theme selector"
              >
                ✕
              </button>
            </div>
            <p className="theme-popover-subtitle">{themes.length} themes available</p>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`theme-swatch ${currentTheme === theme.id ? "active" : ""}`}
                  aria-label={`Select ${theme.name} theme`}
                  aria-pressed={currentTheme === theme.id}
                >
                  <div className="swatch-preview">
                    {theme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="swatch-color"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="swatch-name">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <span className="swatch-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

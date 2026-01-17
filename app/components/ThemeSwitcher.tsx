"use client";

import { useState, useEffect } from "react";

const themes = [
  { id: "github-dark", name: "GitHub Dark", colors: ["#0d1117", "#161b22", "#58a6ff", "#c9d1d9"] },
  { id: "space", name: "Space", colors: ["#0a0a23", "#1b1b3a", "#a3a3ff", "#f5f5f5"] },
  { id: "terminal", name: "Terminal", colors: ["#0d0d0d", "#1a1a1a", "#33ff00", "#ccffcc"] },
  { id: "kanagawa", name: "Kanagawa", colors: ["#1f1f28", "#2a2a37", "#7e9cd8", "#dcd7ba"] },
  { id: "tokyo-night", name: "Tokyo Night", colors: ["#1a1b26", "#24283b", "#c0caf5", "#7aa2f7"] },
  { id: "catppuccin", name: "Catppuccin", colors: ["#24273a", "#363a4f", "#b7bdf8", "#f5bde6"] },
  { id: "dracula", name: "Dracula", colors: ["#282a36", "#44475a", "#bd93f9", "#f8f8f2"] },
  { id: "one-dark", name: "One Dark", colors: ["#282c34", "#3e4451", "#61afef", "#abb2bf"] },
  { id: "oceanic-next", name: "Oceanic Next", colors: ["#1b2b34", "#343d46", "#6699cc", "#c8c8c8"] },
  { id: "rose-pine", name: "Rose Pine", colors: ["#19142a", "#2b2640", "#9ecdce", "#e0dee3"] },
  { id: "vesper", name: "Vesper", colors: ["#0d0e14", "#1a1c29", "#a0b5c6", "#c4b6d8"] },
  { id: "zinc", name: "Zinc", colors: ["#18181b", "#27272a", "#e4e4e7", "#71717a"] },
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
                  <div className="theme-header">
                    <span className="theme-name">{theme.name}</span>
                    <span className="theme-color-count">4 colors</span>
                  </div>
                  <div
                    className="theme-preview-bar"
                    style={{
                      background: `linear-gradient(to right, ${theme.colors.join(', ')})`
                    }}
                  >
                    {theme.colors.map((color, index) => (
                      <div key={index} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="theme-colors-row">
                    {theme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="swatch-color"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="theme-footer">
                    <div className="theme-color-labels">
                      {theme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="color-dot"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

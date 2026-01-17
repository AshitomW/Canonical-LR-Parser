"use client";

import { useState, useEffect } from "react";
import { themes } from "../lib/constants";

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

  const currentThemeData =
    themes.find((t) => t.id === currentTheme) || themes[0];

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
          <div
            className="theme-popover-page"
            onClick={(e) => e.stopPropagation()}
          >
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
            <p className="theme-popover-subtitle">
              {themes.length} themes available
            </p>
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
                      background: `linear-gradient(to right, ${theme.colors.join(", ")})`,
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

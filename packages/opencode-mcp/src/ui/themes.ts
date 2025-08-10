/**
 * UI Themes for OpenCode MosAIc Integration
 * Provides theme definitions and management for the OpenCode interface
 */

import { UITheme } from "./interfaces";

export const mosaicTheme: UITheme = {
  name: "mosaic",
  colors: {
    primary: "#2563eb", // Blue 600
    secondary: "#64748b", // Slate 500
    success: "#059669", // Emerald 600
    warning: "#d97706", // Amber 600
    error: "#dc2626", // Red 600
    background: "#0f172a", // Slate 900
    surface: "#1e293b", // Slate 800
    text: "#f8fafc", // Slate 50
    textSecondary: "#94a3b8", // Slate 400
  },
  typography: {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: {
      small: "0.875rem", // 14px
      medium: "1rem", // 16px
      large: "1.125rem", // 18px
    },
  },
};

export const lightTheme: UITheme = {
  name: "light",
  colors: {
    primary: "#2563eb", // Blue 600
    secondary: "#64748b", // Slate 500
    success: "#059669", // Emerald 600
    warning: "#d97706", // Amber 600
    error: "#dc2626", // Red 600
    background: "#ffffff", // White
    surface: "#f8fafc", // Slate 50
    text: "#0f172a", // Slate 900
    textSecondary: "#64748b", // Slate 500
  },
  typography: {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    },
  },
};

export const darkTheme: UITheme = {
  name: "dark",
  colors: {
    primary: "#3b82f6", // Blue 500
    secondary: "#6b7280", // Gray 500
    success: "#10b981", // Emerald 500
    warning: "#f59e0b", // Amber 500
    error: "#ef4444", // Red 500
    background: "#111827", // Gray 900
    surface: "#1f2937", // Gray 800
    text: "#f9fafb", // Gray 50
    textSecondary: "#9ca3af", // Gray 400
  },
  typography: {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    },
  },
};

export const highContrastTheme: UITheme = {
  name: "high-contrast",
  colors: {
    primary: "#0066cc",
    secondary: "#666666",
    success: "#008800",
    warning: "#cc6600",
    error: "#cc0000",
    background: "#000000",
    surface: "#1a1a1a",
    text: "#ffffff",
    textSecondary: "#cccccc",
  },
  typography: {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    },
  },
};

export const themes: Record<string, UITheme> = {
  mosaic: mosaicTheme,
  light: lightTheme,
  dark: darkTheme,
  "high-contrast": highContrastTheme,
};

export class ThemeManager {
  private currentTheme: UITheme = mosaicTheme;
  private listeners: ((theme: UITheme) => void)[] = [];

  constructor(initialTheme: string = "mosaic") {
    this.setTheme(initialTheme);
  }

  public setTheme(themeName: string): void {
    const theme = themes[themeName];
    if (!theme) {
      console.warn(
        `Theme '${themeName}' not found, using default 'mosaic' theme`,
      );
      this.currentTheme = mosaicTheme;
      return;
    }

    this.currentTheme = theme;
    this.notifyListeners();
    this.applyThemeToDOM();
  }

  public getCurrentTheme(): UITheme {
    return this.currentTheme;
  }

  public getAvailableThemes(): string[] {
    return Object.keys(themes);
  }

  public addThemeChangeListener(
    listener: (theme: UITheme) => void,
  ): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  private applyThemeToDOM(): void {
    // DOM manipulation is handled by the client-side OpenCode interface
    // This method is a placeholder for future browser-based implementations
    console.log(`Theme applied: ${this.currentTheme.name}`);
  }

  public generateCSS(): string {
    const theme = this.currentTheme;

    return `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-success: ${theme.colors.success};
        --color-warning: ${theme.colors.warning};
        --color-error: ${theme.colors.error};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-text: ${theme.colors.text};
        --color-text-secondary: ${theme.colors.textSecondary};
        
        --font-family: ${theme.typography.fontFamily};
        --font-size-small: ${theme.typography.fontSize.small};
        --font-size-medium: ${theme.typography.fontSize.medium};
        --font-size-large: ${theme.typography.fontSize.large};
      }
      
      .theme-${theme.name} {
        background-color: var(--color-background);
        color: var(--color-text);
        font-family: var(--font-family);
        font-size: var(--font-size-medium);
      }
      
      .mosaic-button {
        background-color: var(--color-primary);
        color: var(--color-text);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-family: var(--font-family);
        font-size: var(--font-size-medium);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mosaic-button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      
      .mosaic-button:active {
        transform: translateY(0);
      }
      
      .mosaic-button.secondary {
        background-color: var(--color-secondary);
      }
      
      .mosaic-button.success {
        background-color: var(--color-success);
      }
      
      .mosaic-button.warning {
        background-color: var(--color-warning);
      }
      
      .mosaic-button.error {
        background-color: var(--color-error);
      }
      
      .mosaic-card {
        background-color: var(--color-surface);
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .mosaic-input {
        background-color: var(--color-surface);
        color: var(--color-text);
        border: 1px solid var(--color-secondary);
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-family: var(--font-family);
        font-size: var(--font-size-medium);
        width: 100%;
      }
      
      .mosaic-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      }
      
      .mosaic-progress {
        background-color: var(--color-surface);
        border-radius: 0.5rem;
        height: 0.5rem;
        overflow: hidden;
      }
      
      .mosaic-progress-bar {
        background-color: var(--color-primary);
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .mosaic-status-indicator {
        display: inline-block;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        margin-right: 0.5rem;
      }
      
      .mosaic-status-indicator.active {
        background-color: var(--color-success);
        animation: pulse 2s infinite;
      }
      
      .mosaic-status-indicator.idle {
        background-color: var(--color-secondary);
      }
      
      .mosaic-status-indicator.error {
        background-color: var(--color-error);
      }
      
      .mosaic-status-indicator.warning {
        background-color: var(--color-warning);
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .mosaic-notification {
        background-color: var(--color-surface);
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-left: 4px solid var(--color-primary);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .mosaic-notification.success {
        border-left-color: var(--color-success);
      }
      
      .mosaic-notification.warning {
        border-left-color: var(--color-warning);
      }
      
      .mosaic-notification.error {
        border-left-color: var(--color-error);
      }
      
      .mosaic-tab {
        background-color: transparent;
        color: var(--color-text-secondary);
        border: none;
        padding: 0.5rem 1rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .mosaic-tab:hover {
        color: var(--color-text);
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .mosaic-tab.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
      
      .mosaic-sidebar {
        background-color: var(--color-surface);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        height: 100vh;
        overflow-y: auto;
      }
      
      .mosaic-main-content {
        background-color: var(--color-background);
        flex: 1;
        overflow-y: auto;
      }
    `;
  }
}

export const themeManager = new ThemeManager();

import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";

const preset: Partial<Config> = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive))",
          foreground: "oklch(var(--destructive-foreground))",
        },
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-spin": "spin-glow var(--glowing-border-speed) linear infinite",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "spin-glow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      zIndex: {
        max: "99999999",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          "--background": "1 0 0",
          "--foreground": "0.145 0 0",
          "--card": "1 0 0",
          "--card-foreground": "0.145 0 0",
          "--popover": "1 0 0",
          "--popover-foreground": "0.145 0 0",
          "--primary": "0.205 0 0",
          "--primary-foreground": "0.985 0 0",
          "--secondary": "0.97 0 0",
          "--secondary-foreground": "0.205 0 0",
          "--muted": "0.97 0 0",
          "--muted-foreground": "0.556 0 0",
          "--accent": "0.97 0 0",
          "--accent-foreground": "0.205 0 0",
          "--destructive": "0.577 0.245 27.325",
          "--destructive-foreground": "1 0 0",
          "--border": "0.922 0 0",
          "--input": "0.922 0 0",
          "--ring": "0.708 0 0",
          "--chart-1": "0.81 0.1 252",
          "--chart-2": "0.62 0.19 260",
          "--chart-3": "0.55 0.22 263",
          "--chart-4": "0.49 0.22 264",
          "--chart-5": "0.42 0.18 266",
          "--radius": "0.625rem",
          // Font stacks (may be overridden by next/font variables)
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          "--font-serif":
            "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          "--font-mono":
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          // Sidebar tokens (no "-background" suffix in the provided theme)
          "--sidebar": "0.985 0 0",
          "--sidebar-foreground": "0.145 0 0",
          "--sidebar-primary": "0.205 0 0",
          "--sidebar-primary-foreground": "0.985 0 0",
          "--sidebar-accent": "0.97 0 0",
          "--sidebar-accent-foreground": "0.205 0 0",
          "--sidebar-border": "0.922 0 0",
          "--sidebar-ring": "0.708 0 0",
        },
        ".dark": {
          "--background": "0.145 0 0",
          "--foreground": "0.985 0 0",
          "--card": "0.205 0 0",
          "--card-foreground": "0.985 0 0",
          "--popover": "0.269 0 0",
          "--popover-foreground": "0.985 0 0",
          "--primary": "0.922 0 0",
          "--primary-foreground": "0.205 0 0",
          "--secondary": "0.269 0 0",
          "--secondary-foreground": "0.985 0 0",
          "--muted": "0.269 0 0",
          "--muted-foreground": "0.708 0 0",
          "--accent": "0.371 0 0",
          "--accent-foreground": "0.985 0 0",
          "--destructive": "0.704 0.191 22.216",
          "--destructive-foreground": "0.985 0 0",
          "--border": "0.275 0 0",
          "--input": "0.325 0 0",
          "--ring": "0.556 0 0",
          "--chart-1": "0.81 0.1 252",
          "--chart-2": "0.62 0.19 260",
          "--chart-3": "0.55 0.22 263",
          "--chart-4": "0.49 0.22 264",
          "--chart-5": "0.42 0.18 266",
          "--sidebar": "0.205 0 0",
          "--sidebar-foreground": "0.985 0 0",
          "--sidebar-primary": "0.488 0.243 264.376",
          "--sidebar-primary-foreground": "0.985 0 0",
          "--sidebar-accent": "0.269 0 0",
          "--sidebar-accent-foreground": "0.985 0 0",
          "--sidebar-border": "0.275 0 0",
          "--sidebar-ring": "0.439 0 0",
          // Font stacks (kept identical for dark)
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          "--font-serif":
            "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          "--font-mono":
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        },
        body: {
          backgroundColor: "oklch(var(--background))",
          color: "oklch(var(--foreground))",
        },
      });
    }),
    animate,
  ],
};

export default preset;

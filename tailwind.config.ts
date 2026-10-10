import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // The Matrix Today brand palette
        //
        // NOTE: two eras of tokens live here on purpose. The `navy` / `orange`
        // pair is the v1 saturated look used by the public site and dashboard.
        // The `navy-warm` / `amber` / `cream-warm` pair is the refined
        // editorial palette introduced with the auth pages, aligned to the
        // homepage's actual warm mood. Neither set is being removed — this
        // gives us a non-breaking migration path: the public site can adopt
        // the warm tokens one utility at a time.
        tmt: {
          // v1 (saturated) — still used across public site + dashboard.
          navy: "#062F3D",
          "navy-light": "#0a4a5e",
          orange: "#FF7D00",
          "orange-light": "#FA9721",
          cream: "#FFFCEE",

          // v5 (warm editorial) — used by auth pages, homepage-aligned.
          "navy-warm": "#0C3444",
          "navy-warm-light": "#12475A",
          amber: "#D98A1A",
          "amber-light": "#E8A03D",
          "amber-deep": "#B67210",
          "cream-warm": "#F5EFE0",
          "cream-warm-deep": "#EFE7D3",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Inter everywhere. Loaded via @fontsource in src/app/layout.tsx.
        // Overriding `sans` means every unstyled element inherits it, so no
        // surface can silently fall back to a serif.
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },

        // Auth-page keyframes (login hero decoration).
        "orb-drift": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "25%":     { transform: "translate(18px,-22px) scale(1.06)" },
          "50%":     { transform: "translate(-12px,10px) scale(0.96)" },
          "75%":     { transform: "translate(8px,20px) scale(1.03)" },
        },
        "twinkle": {
          "0%,100%": { opacity: "0.08", transform: "scale(0.6)" },
          "50%":      { opacity: "1",    transform: "scale(1.3)" },
        },
        "wm-0": { from: { transform: "translateY(0) rotate(-10deg)" }, to: { transform: "translateY(28px) rotate(-3deg)" } },
        "wm-1": { from: { transform: "translateY(0) rotate(10deg)" },  to: { transform: "translateY(-22px) rotate(17deg)" } },
        "wm-2": { from: { transform: "translateY(0) rotate(22deg)" },  to: { transform: "translateY(20px) rotate(29deg)" } },
        "wm-3": { from: { transform: "translateY(0) rotate(-5deg)" },  to: { transform: "translateY(-24px) rotate(2deg)" } },
        "wm-4": { from: { transform: "translateY(0) rotate(36deg)" },  to: { transform: "translateY(16px) rotate(43deg)" } },
        "card-in": {
          from: { opacity: "0", transform: "translateY(36px) scale(0.95)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "amber-glow": {
          "0%,100%": { boxShadow: "0 0 0 3px rgba(217,138,26,0.10), inset 0 1px 4px rgba(12,52,68,0.06)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(217,138,26,0.18), inset 0 1px 4px rgba(12,52,68,0.06)" },
        },
        "halo-pulse": {
          from: { transform: "scale(0.88)", opacity: "0.55" },
          to:   { transform: "scale(1.18)", opacity: "0" },
        },
        "scan-line": {
          "0%":   { top: "-4px", opacity: "0.4" },
          "80%":  { opacity: "0.4" },
          "100%": { top: "105%",  opacity: "0" },
        },
        "border-shimmer": {
          from: { backgroundPosition: "200% center" },
          to:   { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin-slow 20s linear infinite",
        "spin-reverse": "spin-reverse 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

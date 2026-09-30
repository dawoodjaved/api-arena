/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F5F7",
        ink: {
          DEFAULT: "#0B1220",
          soft: "#1E293B",
          muted: "#64748B",
          faint: "#94A3B8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#EEF1F4",
        },
        accent: {
          DEFAULT: "#0D7377",
          hover: "#0A5C5F",
          soft: "#E6F4F4",
          line: "#B8D9DA",
        },
        primary: {
          DEFAULT: "#0D7377",
          hover: "#0A5C5F",
          dark: "#084B4E",
        },
        bg: {
          primary: "#F3F5F7",
          secondary: "#EEF1F4",
          card: "#FFFFFF",
          "card-hover": "#F8FAFB",
        },
        text: {
          primary: "#0B1220",
          secondary: "#64748B",
          muted: "#94A3B8",
          light: "#1E293B",
        },
        border: {
          DEFAULT: "rgba(11, 18, 32, 0.08)",
          light: "rgba(13, 115, 119, 0.2)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        container: "1120px",
        content: "1120px",
        narrow: "720px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11, 18, 32, 0.04), 0 8px 24px rgba(11, 18, 32, 0.06)",
        lift: "0 12px 32px rgba(11, 18, 32, 0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "240" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.6s ease-out both",
        "draw-line": "draw-line 1.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

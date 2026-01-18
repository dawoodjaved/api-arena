import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F7FFF",
          hover: "#6B92FF",
          dark: "#3D66E6",
        },
        bg: {
          primary: "#0A0E1A",
          secondary: "#111827",
          card: "#151B2B",
          "card-hover": "#1A2139",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#9CA3AF",
          muted: "#6B7280",
          light: "#D1D5DB",
        },
        accent: {
          purple: "#8B5CF6",
          "purple-light": "#A78BFA",
          green: "#10B981",
          "blue-light": "#60A5FA",
          "chart-blue": "#3B82F6",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          light: "rgba(79, 127, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'hero': '64px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
        '5xl': '128px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 40px rgba(79, 127, 255, 0.3)',
        'glow-hover': '0 8px 32px rgba(79, 127, 255, 0.15)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'slow': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        'container': '1440px',
        'content': '1280px',
        'narrow': '960px',
      },
    },
  },
  plugins: [],
};
export default config;

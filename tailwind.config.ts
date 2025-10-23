import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        // Custom hotel color palette
        forest: {
          DEFAULT: "#1a3d2a",
          50: "#f0f7f2",
          100: "#dbeee1",
          200: "#b9dcc7",
          300: "#8fc4a4",
          400: "#62a67d",
          500: "#428b5f",
          600: "#327049",
          700: "#29593c",
          800: "#234732",
          900: "#1a3d2a",
        },
        sage: {
          DEFAULT: "#b8c9a6",
          50: "#f7f9f5",
          100: "#eef2e8",
          200: "#dde6d2",
          300: "#c6d4b3",
          400: "#b8c9a6",
          500: "#9fb088",
          600: "#849670",
          700: "#6a7a5a",
          800: "#56634a",
          900: "#48533e",
        },
        cream: {
          DEFAULT: "#e6c47a",
          50: "#fdf9f0",
          100: "#faf1dc",
          200: "#f4e1b8",
          300: "#edcc8a",
          400: "#e6c47a",
          500: "#dea954",
          600: "#d09340",
          700: "#ad7735",
          800: "#8b5f30",
          900: "#714f29",
        },
        charcoal: {
          DEFAULT: "#595959",
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#595959",
          700: "#4f4f4f",
          800: "#454545",
          900: "#3d3d3d",
        },
        teal: {
          DEFAULT: "#003a5c",
          50: "#f0f8ff",
          100: "#e0f0fe",
          200: "#bae1fd",
          300: "#7cc8fc",
          400: "#36acf8",
          500: "#0c93e9",
          600: "#0075c7",
          700: "#005da1",
          800: "#004f85",
          900: "#003a5c",
        },
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

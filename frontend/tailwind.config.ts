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
        "mars-red": "#E5C07B", // Replaced with a premium gold tone but keeping the class name for compatibility
        "mars-dark": "#1A1500", // Dark gold/brown
        "neon-green": "#00F0FF", // Changed to a sleek cyber cyan
        "deep-space": "#030303",
        "premium-gold": "#D4AF37",
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        gradient: 'gradient 8s ease infinite',
      },
    },
  },
  plugins: [],
};
export default config;

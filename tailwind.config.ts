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
        brand: {
          purple: "#6366f1",
          indigo: "#4f46e5",
          emerald: "#10b981",
        },
        admin: {
          sidebar: "#1e293b",
          accent: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

export default config;

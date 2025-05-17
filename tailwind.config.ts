import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
		colors: {
			border: "hsl(var(--border))",
			input: "hsl(var(--input))",
			ring: "hsl(var(--ring))",
			background: "hsl(var(--background))",
			foreground: "hsl(var(--foreground))",
			primary: {
			  DEFAULT: "#0070F3",
			  foreground: "#FFFFFF",
			},
			secondary: {
			  DEFAULT: "#00BFA5",
			  foreground: "#FFFFFF",
			},
			accent: {
			  DEFAULT: "#FF9800",
			  foreground: "#FFFFFF",
			},
			destructive: {
			  DEFAULT: "hsl(var(--destructive))",
			  foreground: "hsl(var(--destructive-foreground))",
			},
			muted: {
			  DEFAULT: "hsl(var(--muted))",
			  foreground: "hsl(var(--muted-foreground))",
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
			"fade-in": {
			  "0%": { opacity: "0", transform: "translateY(10px)" },
			  "100%": { opacity: "1", transform: "translateY(0)" },
			},
			"fade-in-right": {
			  "0%": { opacity: "0", transform: "translateX(10px)" },
			  "100%": { opacity: "1", transform: "translateX(0)" },
			},
		  },
		  animation: {
			"accordion-down": "accordion-down 0.2s ease-out",
			"accordion-up": "accordion-up 0.2s ease-out",
			"fade-in": "fade-in 0.5s ease-out",
			"fade-in-right": "fade-in-right 0.5s ease-out",
		  },
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

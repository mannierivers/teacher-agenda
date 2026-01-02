/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // 👈 VERY IMPORTANT
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lancer: {
          maroon: "#8a2529", // PMS 506 C
          maroonDark: "#4b121e", // 75th Anniversary Deep Maroon
          gold: "#FCD450", // PMS 122 C
          goldMetallic: "#86764e", // PMS 871 C
          blue: "#0098DB", // PMS 2925 C
          sand: "#d2b97b", // 75th Anniversary Tan
        },
      },
      fontFamily: {
        serif: ["Garamond", "Adobe Garamond Pro", "serif"],
        sans: ["Acumin Pro", "Arial", "sans-serif"],
        display: ["Source Serif 4", "serif"], // For the 75th anniversary look
      },
    },
  },
  plugins: [],
}
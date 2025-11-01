/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        majesticPurple: "#6B32E7",
        vividBurgundy: "#84103B",
        deepIndigo: "#3C1C81",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          400: "#6080ff",
          500: "#4060f0",
          600: "#3050d8",
          700: "#2040b0",
          900: "#0a1a60",
        },
      },
    },
  },
  plugins: [],
};

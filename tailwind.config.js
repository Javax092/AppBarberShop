/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['"DM Sans"', '"Outfit"', "sans-serif"]
      },
      colors: {
        ink: "#0d0d0b",
        sand: "#161614",
        brass: "#c9a96e",
        ember: "#7a3434",
        forest: "#5f7458",
        clay: "#2a2a27",
        smoke: "#8a8780"
      },
      boxShadow: {
        card: "0 18px 38px rgba(0,0,0,0.28)",
        luxe: "0 30px 84px rgba(0,0,0,0.46)"
      },
      backgroundImage: {
        hero: "linear-gradient(145deg, rgba(18,18,16,0.96) 0%, rgba(10,10,9,0.92) 100%)",
        opaitaon: "radial-gradient(circle at top left, rgba(201, 169, 110, 0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(201, 169, 110, 0.08), transparent 30%), linear-gradient(145deg, #111109 0%, #0d0d0b 34%, #151512 100%)"
      }
    }
  },
  plugins: []
};

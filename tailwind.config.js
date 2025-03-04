module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        background: "rgba(15, 23, 42, 0.85)",
        card: "rgba(30, 41, 59, 0.85)",
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
      },
      backdropFilter: {
        none: "none",
        blur: "blur(10px)",
      },
    },
  },
  plugins: [],
};

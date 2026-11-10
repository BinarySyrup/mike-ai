import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { initializeGoogleAnalytics } from "./analytics";
import "./styles.css";

initializeGoogleAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "");

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2f6bff", dark: "#245bdd", light: "#e6eeff" },
    background: { default: "#f4f7fb", paper: "#ffffff" },
    text: { primary: "#1b2430", secondary: "#5b6778" },
    divider: "#e3e8ef",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: "none", fontWeight: 500 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

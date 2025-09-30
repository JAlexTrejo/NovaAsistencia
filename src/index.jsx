import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { wrapGlobalFetchForMetrics } from "./lib/net-tap";

// Initialize network instrumentation before app starts
wrapGlobalFetchForMetrics();

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
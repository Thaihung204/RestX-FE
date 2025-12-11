import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import DarkThemeProvider from "../app/theme/DarkThemeProvider";
// import AutoDarkThemeProvider from "../app/theme/AutoDarkThemeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <DarkThemeProvider>
    <App />
  </DarkThemeProvider>
);

// Or auto-detect OS theme:
// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//   <AutoDarkThemeProvider>
//     <App />
//   </AutoDarkThemeProvider>
// );


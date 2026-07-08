import React from "react";
import ReactDOM from "react-dom/client";
import KaraokeDJ from "./App.jsx";
import PublicDisplay from "./PublicDisplay.jsx";

const isPublicScreen = new URLSearchParams(window.location.search).get("public") === "1";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isPublicScreen ? <PublicDisplay /> : <KaraokeDJ />}
  </React.StrictMode>
);

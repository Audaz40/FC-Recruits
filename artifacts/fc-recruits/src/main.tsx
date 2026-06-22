import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API base URL
setBaseUrl("http://localhost:8080");

createRoot(document.getElementById("root")!).render(<App />);

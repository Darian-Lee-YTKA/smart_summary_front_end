import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import { ClerkProvider } from "@clerk/clerk-react";

const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

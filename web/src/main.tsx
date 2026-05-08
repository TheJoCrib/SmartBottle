import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./styles.css";

const convexUrl =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) ??
  "https://tough-bear-173.eu-west-1.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </ErrorBoundary>,
);

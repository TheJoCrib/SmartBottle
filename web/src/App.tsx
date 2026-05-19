import { useEffect, useState } from "react";
import { MirrorPage } from "./MirrorPage";
import { AdminPage } from "./AdminPage";
import { LandingPage } from "./LandingPage";

function getRoute(): "admin" | "mirror" | "landing" {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/admin" || path === "/admin/") return "admin";

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code && code.trim().length > 0) return "mirror";

  return "landing";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  if (route === "admin") return <AdminPage />;
  if (route === "mirror") {
    const code = new URLSearchParams(window.location.search).get("code") || "";
    return <MirrorPage shareCode={code.toUpperCase()} />;
  }
  return <LandingPage />;
}

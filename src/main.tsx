import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";

import App from "./App.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { purgeLegacySupabaseStorage } from "./lib/supabase.ts";
import "./index.css";

async function migrateAndRegisterPwa() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrl =
        registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";

      if (!scriptUrl) {
        return;
      }

      const scriptPath = new URL(scriptUrl).pathname;

      if (scriptPath !== "/sw.js") {
        await registration.unregister();
      }
    })
  );

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await registration.update();
}

purgeLegacySupabaseStorage();
void migrateAndRegisterPwa().catch(() => {});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </React.StrictMode>
);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) {
              return "motion";
            }

            if (id.includes("@supabase")) {
              return "supabase";
            }

            return "vendor";
          }

          if (
            id.includes("/components/AdminView") ||
            id.includes("/components/PanelView") ||
            id.includes("/components/WhatsappView") ||
            id.includes("/components/AutomationsView") ||
            id.includes("/hooks/useAdminDashboard") ||
            id.includes("/hooks/useStaffPanel") ||
            id.includes("/utils/dashboard") ||
            id.includes("/utils/experience")
          ) {
            return "admin";
          }

          return undefined;
        }
      }
    }
  }
});

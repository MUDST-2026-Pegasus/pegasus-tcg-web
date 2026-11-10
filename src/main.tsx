import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import { bootstrapSession } from "@/lib/api/session";
import { initializeFaroClient } from "@/observability/faro";
import "@/styles/globals.css";

initializeFaroClient();
void bootstrapSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);

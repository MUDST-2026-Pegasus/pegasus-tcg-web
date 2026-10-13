import { createBrowserRouter } from "react-router-dom";

import { RouteError } from "@/components/common/RouteError";
import { RootLayout } from "@/components/layout/RootLayout";
import { adminRoutes } from "@/app/routes/admin.routes";
import { authRoutes } from "@/app/routes/auth.routes";
import { publicRoutes } from "@/app/routes/public.routes";
import { sellerRoutes } from "@/app/routes/seller.routes";

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [publicRoutes, authRoutes, adminRoutes, sellerRoutes],
    },
  ]);


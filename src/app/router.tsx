import { createBrowserRouter } from "react-router-dom";

import { RouteError } from "@/components/common/RouteError";
import { adminRoutes } from "@/app/routes/admin.routes";
import { authRoutes } from "@/app/routes/auth.routes";
import { publicRoutes } from "@/app/routes/public.routes";
import { sellerRoutes } from "@/app/routes/seller.routes";

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      errorElement: <RouteError />,
      children: [publicRoutes, authRoutes, adminRoutes, sellerRoutes],
    },
  ]);

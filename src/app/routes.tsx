import { Routes, Route } from "react-router-dom";

import { HomePage } from "#features/home/pages/HomePage";
import { RegisterPage } from "#features/auth/pages/RegisterPage";

function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground text-sm">Page not found.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

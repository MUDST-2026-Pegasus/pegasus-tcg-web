import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthSessionSync } from "@/features/auth/auth.queries";
import { createQueryClient } from "@/lib/api";
import { env } from "@/lib/env";
import { I18nProvider } from "@/lib/i18n";

function AuthSessionSync() {
  useAuthSessionSync();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  // ต้องสร้างครั้งเดียว ถ้าสร้างตอน render ตรง ๆ cache จะหายทุกครั้งที่ re-render
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionSync />
      <I18nProvider>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </I18nProvider>
      {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

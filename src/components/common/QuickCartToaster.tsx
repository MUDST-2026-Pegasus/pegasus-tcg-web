import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/components/ui/toast";
import { quickCartToast } from "./quick-cart-toast";
function QuickCartToastList() {
  const { toasts } = useToastManager<{ imageUrl?: string | null }>();
  return toasts.map((item) => (
    <Toast
      key={item.id}
      toast={item}
      className="bg-foreground text-background [&_[data-slot=toast-description]]:text-background/70 [&_[data-slot=toast-action]]:border-0 [&_[data-slot=toast-action]]:bg-transparent [&_[data-slot=toast-action]]:text-background"
    >
      <ToastContent>
        {item.data?.imageUrl && (
          <img
            src={item.data.imageUrl}
            alt=""
            className="h-12 w-9 shrink-0 rounded object-contain"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}
export function QuickCartToaster() {
  return (
    <ToastProvider toastManager={quickCartToast}>
      <ToastPortal>
        <ToastViewport>
          <QuickCartToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

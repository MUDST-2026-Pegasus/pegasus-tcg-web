import { ApiError } from "@/lib/api/errors";

interface CheckoutErrorAlertProps {
  title: string;
  error: unknown;
  actions: { label: string; onClick: () => void }[];
}

/** Error box on the checkout page: API message when there is one, else a connection hint. */
export function CheckoutErrorAlert({ title, error, actions }: CheckoutErrorAlertProps) {
  return (
    <div role="alert" className="checkout-alert checkout-alert-error">
      <p className="font-semibold">{title}</p>
      <p>
        {error instanceof ApiError
          ? error.message
          : "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"}
      </p>
      {actions.map(({ label, onClick }) => (
        <button
          key={label}
          type="button"
          className="checkout-link justify-self-start"
          onClick={onClick}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

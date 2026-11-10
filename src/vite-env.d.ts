/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PEGASUS_STORE_USERNAME?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FARO_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: "popup" | "redirect";
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

interface GoogleAccountsId {
  initialize: (config: GoogleAccountsIdConfig) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonConfiguration,
  ) => void;
  prompt?: () => void;
  cancel?: () => void;
}

interface Window {
  Cypress?: unknown;
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}

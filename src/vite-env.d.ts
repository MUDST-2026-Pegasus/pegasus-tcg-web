/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PEGASUS_STORE_USERNAME?: string;
  readonly VITE_FARO_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
}

interface Window {
  Cypress?: unknown;
}

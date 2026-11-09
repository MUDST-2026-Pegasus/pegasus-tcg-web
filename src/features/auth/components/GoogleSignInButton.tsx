import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const GOOGLE_BUTTON_OPTIONS: GoogleButtonConfiguration = {
  theme: "outline",
  size: "large",
  shape: "rectangular",
  text: "continue_with",
  width: 400,
};

function getGoogleClientId(): string {
  const configured = env.googleClientId;
  if (configured) {
    return configured;
  }
  if (
    typeof window !== "undefined" &&
    window.Cypress &&
    window.google?.accounts?.id
  ) {
    return "cypress-google-client-id";
  }
  return "";
}

function hasGoogleIdentityServices(): boolean {
  return typeof window !== "undefined" && Boolean(window.google?.accounts?.id);
}

export function GoogleConsentText() {
  return (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      By continuing with Google, you agree to the Pegasus{" "}
      <Link
        to="/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        to="/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        Privacy Policy
      </Link>
    </p>
  );
}

export function GoogleOrDivider() {
  return (
    <div
      className="flex items-center gap-3"
      role="separator"
      aria-orientation="horizontal"
    >
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onCredential,
  isLoading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = getGoogleClientId();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);

  const [gsiStatus, setGsiStatus] = useState<"idle" | "ready" | "error">(() =>
    clientId && hasGoogleIdentityServices() ? "ready" : "idle",
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const scriptReady =
    Boolean(clientId) &&
    gsiStatus !== "error" &&
    (gsiStatus === "ready" || hasGoogleIdentityServices());
  const scriptFailed = gsiStatus === "error";

  useEffect(() => {
    if (!clientId || hasGoogleIdentityServices()) {
      return;
    }

    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_SRC}"]`,
    );

    if (script && script.getAttribute("data-gsi-status") === "error") {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      if (cancelled) {
        return;
      }
      if (hasGoogleIdentityServices()) {
        script?.setAttribute("data-gsi-status", "loaded");
        setGsiStatus("ready");
      } else {
        script?.setAttribute("data-gsi-status", "error");
        setGsiStatus("error");
      }
    };

    const handleError = () => {
      script?.setAttribute("data-gsi-status", "error");
      if (!cancelled) {
        setGsiStatus("error");
      }
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !scriptReady || scriptFailed) {
      return;
    }

    const googleId = window.google?.accounts?.id;
    const container = buttonContainerRef.current;
    if (!googleId || !container) {
      return;
    }

    googleId.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: (response: GoogleCredentialResponse) => {
        const credential = response.credential?.trim();
        if (credential) {
          onCredentialRef.current(credential);
        }
      },
    });
    container.innerHTML = "";
    googleId.renderButton(container, GOOGLE_BUTTON_OPTIONS);
  }, [clientId, scriptReady, scriptFailed]);

  if (!clientId || scriptFailed || (!scriptReady && !isLoading)) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {isLoading && (
        <button
          type="button"
          disabled
          aria-busy="true"
          className="mx-auto flex h-10 w-full max-w-[400px] items-center justify-center gap-2 rounded-[4px] border border-border bg-muted px-4 text-sm font-medium text-muted-foreground"
        >
          <Spinner className="size-4" />
          <span>Signing in with Google...</span>
        </button>
      )}
      <div
        ref={buttonContainerRef}
        data-testid="google-signin-button"
        aria-disabled={disabled || undefined}
        className={cn(
          "mx-auto flex min-h-10 w-full max-w-[400px] justify-center",
          isLoading && "hidden",
          disabled && "pointer-events-none opacity-60",
        )}
      />
      <GoogleConsentText />
      <GoogleOrDivider />
    </div>
  );
}

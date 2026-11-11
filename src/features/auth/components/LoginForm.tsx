import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getAuthErrorAlert } from "@/features/auth/auth.errors";
import { useGoogleSignIn, useLogin } from "@/features/auth/auth.queries";
import { authRedirectTarget, rememberPendingClaim } from "@/features/promotions/claim-redirect";
import { BackHomeLink } from "@/features/auth/components/BackHomeLink";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { useAuthSchemas, type LoginFormValues } from "@/features/auth/auth.schema";

import { applyApiErrors } from "@/lib/form";
import { translateError, useTranslate } from "@/lib/i18n";

export function LoginForm() {
  const { t } = useTranslate("buyer");
  const { loginSchema } = useAuthSchemas();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const googleSignIn = useGoogleSignIn();
  const isGoogleSigningIn = Boolean(googleSignIn.isPending);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form;

  const handleGoogleCredential = async (credential: string) => {
    clearErrors();
    login.reset?.();
    try {
      await googleSignIn.mutateAsync({ credential });
      rememberPendingClaim(location.search);
      navigate(authRedirectTarget(location.search, location.state), { replace: true });
    } catch {
      // Error is handled via googleSignIn.error state
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    googleSignIn.reset?.();
    try {
      await login.mutateAsync(values);
      rememberPendingClaim(location.search);
      navigate(authRedirectTarget(location.search, location.state), { replace: true });
    } catch (error) {
      // 401 ตั้งใจไม่ชี้ว่าช่องไหนผิด กันไม่ให้เดาว่าอีเมลนี้มีบัญชีจริงไหม
      applyApiErrors(error, setError);
    }
  });

  const formAlert = googleSignIn.isError
    ? getAuthErrorAlert(
        googleSignIn.error,
        t("auth.login.failed", "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง"),
      )
    : login.isError
      ? {
          description: translateError(
            login.error,
            t("auth.login.failed", "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง"),
          ),
        }
      : null;

  return (
    <form className="flex w-full flex-col gap-5" onSubmit={onSubmit} noValidate>
      {formAlert && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          {formAlert.title && <AlertTitle>{formAlert.title}</AlertTitle>}
          <AlertDescription>{formAlert.description}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <Field className="gap-2" data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">{t("auth.fields.email", "อีเมล")}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.fields.emailPlaceholder", "กรอกอีเมล")}
            aria-invalid={Boolean(errors.email)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("email")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field className="gap-2" data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">{t("auth.fields.password", "รหัสผ่าน")}</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={t("auth.login.passwordPlaceholder", "กรอกรหัสผ่าน")}
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting || isGoogleSigningIn}
        className="h-12 w-full rounded-lg text-base"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("auth.login.submitting", "กำลังเข้าสู่ระบบ…") : t("auth.login.submit", "เข้าสู่ระบบ")}
      </Button>

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        isLoading={isGoogleSigningIn}
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-2 pt-2">
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.login.noAccount", "ยังไม่มีบัญชี?")}{" "}
          <Link to={{ pathname: "/register", search: location.search }} className="font-medium text-primary">
            {t("auth.login.signUp", "สมัครสมาชิก")}
          </Link>
        </p>
      </div>
      <BackHomeLink />
      <p className="pt-2 text-center text-xs leading-relaxed tracking-[0.24px] text-muted-foreground">
        {t("auth.login.agreePrefix", "การดำเนินการต่อถือว่าคุณยอมรับ")}{" "}
        <Link
          to="/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          {t("auth.terms", "ข้อกำหนดการใช้บริการ")}
        </Link>{" "}
        {t("auth.and", "และ")}{" "}
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          {t("auth.privacy", "นโยบายความเป็นส่วนตัว")}
        </Link>
        .
      </p>
    </form>
  );
}

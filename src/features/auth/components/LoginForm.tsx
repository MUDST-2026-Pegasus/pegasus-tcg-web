import { translate, useLanguage } from "@/lib/language";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useLogin } from "@/features/auth/auth.queries";
import { authRedirectTarget, rememberPendingClaim } from "@/features/promotions/claim-redirect";
import { BackHomeLink } from "@/features/auth/components/BackHomeLink";
import { loginSchema, type LoginFormValues } from "@/features/auth/auth.schema";
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

export function LoginForm() {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      rememberPendingClaim(location.search);
      navigate(authRedirectTarget(location.search, location.state), { replace: true });
    } catch (error) {
      // 401 ตั้งใจไม่ชี้ว่าช่องไหนผิด กันไม่ให้เดาว่าอีเมลนี้มีบัญชีจริงไหม
      applyApiErrors(error, setError);
    }
  });

  const formMessage = login.isError
    ? getErrorMessage(login.error, translate("เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not sign you in. Please try again."))
    : null;

  return (
    <form className="flex w-full flex-col gap-5" onSubmit={onSubmit} noValidate>
      {formMessage && (
        <Alert variant="destructive">
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <Field className="gap-2" data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">{translate("อีเมล", "Email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={translate("กรอกอีเมลของคุณ", "Enter your email")}
            aria-invalid={Boolean(errors.email)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field className="gap-2" data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">{translate("รหัสผ่าน", "Password")}</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={translate("กรอกรหัสผ่านของคุณ", "Enter your password")}
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-lg text-base"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? translate("กำลังเข้าสู่ระบบ…", "Signing in…") : translate("เข้าสู่ระบบ", "Log in")}
      </Button>

      <div className="flex flex-col gap-2 pt-2">
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          {translate("ยังไม่มีบัญชี?", "Don't have an account?")}{" "}
          <Link to={{ pathname: "/register", search: location.search }} className="font-medium text-primary">
            {translate("สมัครสมาชิก", "Sign up")}</Link>
        </p>
      </div>
      <BackHomeLink />
    </form>
  );
}

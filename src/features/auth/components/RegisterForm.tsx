import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { getAuthErrorAlert } from "@/features/auth/auth.errors";
import { useGoogleSignIn, useRegister } from "@/features/auth/auth.queries";
import { authRedirectTarget, rememberPendingClaim } from "@/features/promotions/claim-redirect";
import { BackHomeLink } from "@/features/auth/components/BackHomeLink";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import {
  useAuthSchemas,
  type RegisterFormValues,
} from "@/features/auth/auth.schema";

import { applyApiErrors } from "@/lib/form";
import { translateError, useTranslate } from "@/lib/i18n";

export function RegisterForm() {
  const { t } = useTranslate("buyer");
  const { registerSchema } = useAuthSchemas();
  const navigate = useNavigate();
  const location = useLocation();
  const registerAccount = useRegister();
  const googleSignIn = useGoogleSignIn();
  const isGoogleSigningIn = Boolean(googleSignIn.isPending);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form;

  const handleGoogleCredential = async (credential: string) => {
    clearErrors();
    registerAccount.reset?.();
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
      // ไม่ส่ง roles = ได้ BUYER (ขอเป็น SELLER ที่หน้า become-a-seller)
      await registerAccount.mutateAsync({
        username: values.username,
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      });
      rememberPendingClaim(location.search);
      navigate(authRedirectTarget(location.search, location.state), { replace: true });
    } catch (error) {
      // 409 ไม่มี violations มาด้วย ต้องชี้เองว่า code ไหนลงช่องไหน
      applyApiErrors(error, setError, {
        codeToField: {
          EMAIL_ALREADY_USED: "email",
          USERNAME_ALREADY_USED: "username",
        },
      });
    }
  });

  const formAlert = googleSignIn.isError
    ? getAuthErrorAlert(
        googleSignIn.error,
        t("auth.register.failed", "สร้างบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง"),
      )
    : registerAccount.isError
      ? {
          description: translateError(
            registerAccount.error,
            t("auth.register.failed", "สร้างบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง"),
          ),
        }
      : null;

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={onSubmit} noValidate>
      {formAlert && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          {formAlert.title && <AlertTitle>{formAlert.title}</AlertTitle>}
          <AlertDescription>{formAlert.description}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.username) || undefined}>
          <FieldLabel htmlFor="username">{t("auth.fields.username", "ชื่อผู้ใช้")}</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder={t("auth.register.usernamePlaceholder", "ตั้งชื่อผู้ใช้")}
            aria-invalid={Boolean(errors.username)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("username")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.username]} />
        </Field>
        <Field data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName">{t("auth.fields.displayName", "ชื่อที่แสดง")}</FieldLabel>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder={t("auth.register.displayNamePlaceholder", "ชื่อที่สมาชิกคนอื่นจะเห็น")}
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
            disabled={isGoogleSigningIn}
            className="h-12 rounded-lg border-border bg-background px-4"
          />
          <FieldError errors={[errors.displayName]} />
        </Field>
        <Field data-invalid={Boolean(errors.email) || undefined}>
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
        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">{t("auth.fields.password", "รหัสผ่าน")}</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("auth.register.passwordPlaceholder", "ตั้งรหัสผ่าน")}
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
            disabled={isGoogleSigningIn}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>{t("auth.register.passwordHint", "อย่างน้อย {min} ตัวอักษร", { min: 8 })}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
          <FieldLabel htmlFor="confirmPassword">{t("auth.fields.confirmPassword", "ยืนยันรหัสผ่าน")}</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={t("auth.register.confirmPasswordPlaceholder", "กรอกรหัสผ่านอีกครั้ง")}
            aria-invalid={Boolean(errors.confirmPassword)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("confirmPassword")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Field orientation="horizontal">
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox
                id="terms"
                name={field.name}
                checked={field.value ?? false}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
                disabled={isGoogleSigningIn}
                aria-invalid={Boolean(errors.acceptTerms)}
                className="bg-card border-2 border-black-50 size-4.5"
              />
            )}
          />
          <span className="text-sm leading-snug">
            <FieldLabel htmlFor="terms" className="inline cursor-pointer font-normal">
              {t("auth.register.agreePrefix", "ฉันยอมรับ")}
            </FieldLabel>{" "}
            <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {t("auth.terms", "ข้อกำหนดการใช้บริการ")}
            </Link>{" "}
            {t("auth.and", "และ")}{" "}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {t("auth.privacy", "นโยบายความเป็นส่วนตัว")}
            </Link>
          </span>
        </Field>
        <FieldError errors={[errors.acceptTerms]} />
        <Button
          type="submit"
          disabled={isSubmitting || isGoogleSigningIn}
          className="h-12 w-full rounded-lg text-base"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? t("auth.register.submitting", "กำลังสร้างบัญชี…") : t("auth.register.submit", "สมัครสมาชิก")}
        </Button>
      </FieldGroup>

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        isLoading={isGoogleSigningIn}
        disabled={isSubmitting}
      />
      <p className="text-center text-sm text-muted-foreground ">
        {t("auth.register.haveAccount", "มีบัญชีอยู่แล้ว?")} &nbsp;
        <Link to={{ pathname: "/login", search: location.search }} className="font-medium text-primary">
          {t("auth.register.logIn", "เข้าสู่ระบบ")}
        </Link>
      </p>
      <BackHomeLink />
      <p className="pt-2 text-center text-xs tracking-[0.24px] text-muted-foreground">
        {t("auth.register.privacyNote", "เราเก็บข้อมูลของคุณอย่างปลอดภัย และไม่นำไปใช้นอก Pegasus TCG")}
      </p>
    </form>
  );
}

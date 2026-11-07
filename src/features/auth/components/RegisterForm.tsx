import { translate, useLanguage } from "@/lib/language";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useRegister } from "@/features/auth/auth.queries";
import { authRedirectTarget, rememberPendingClaim } from "@/features/promotions/claim-redirect";
import { BackHomeLink } from "@/features/auth/components/BackHomeLink";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/auth.schema";
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

export function RegisterForm() {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const registerAccount = useRegister();

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
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
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

  const formMessage = registerAccount.isError
    ? getErrorMessage(
        registerAccount.error,
        translate("สร้างบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not create your account. Please try again."),
      )
    : null;

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={onSubmit} noValidate>
      {formMessage && (
        <Alert variant="destructive">
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.username) || undefined}>
          <FieldLabel htmlFor="username">{translate("ชื่อผู้ใช้", "Username")}</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder={translate("ตั้งชื่อผู้ใช้ของคุณ", "Create your username")}
            aria-invalid={Boolean(errors.username)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>
        <Field data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName">{translate("ชื่อที่แสดง", "Display name")}</FieldLabel>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder={translate("ชื่อที่สมาชิกคนอื่นจะเห็น", "Name other members will see")}
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
            className="h-12 rounded-lg border-border bg-background px-4"
          />
          <FieldError errors={[errors.displayName]} />
        </Field>
        <Field data-invalid={Boolean(errors.email) || undefined}>
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
        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">{translate("รหัสผ่าน", "Password")}</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={translate("ตั้งรหัสผ่าน", "Create a password")}
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>{translate("อย่างน้อย 8 ตัวอักษร", "At least 8 characters")}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
          <FieldLabel htmlFor="confirmPassword">{translate("ยืนยันรหัสผ่าน", "Confirm password")}</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={translate("ยืนยันรหัสผ่านของคุณ", "Confirm your password")}
            aria-invalid={Boolean(errors.confirmPassword)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("confirmPassword")}
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
                aria-invalid={Boolean(errors.acceptTerms)}
                className="bg-card border-2 border-black-50 size-4.5"
              />
            )}
          />
          <span className="text-sm leading-snug">
            <FieldLabel htmlFor="terms" className="inline cursor-pointer font-normal">
              {translate("ฉันยอมรับ", "I agree to the Pegasus")}</FieldLabel>{" "}
            <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {translate("เงื่อนไขการใช้บริการ", "Terms of Service")}</Link>{" "}
            {translate("และ", "and")}{" "}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {translate("นโยบายความเป็นส่วนตัว", "Privacy Policy")}</Link>
          </span>
        </Field>
        <FieldError errors={[errors.acceptTerms]} />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg text-base"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? translate("กำลังสร้างบัญชี…", "Creating account…") : translate("สมัครสมาชิก", "Sign up")}
        </Button>
      </FieldGroup>
      <p className="text-center text-sm text-muted-foreground ">
        {translate("มีบัญชีอยู่แล้ว?", "Already have an account?  ")}<Link to={{ pathname: "/login", search: location.search }} className="font-medium text-primary">
          {translate("เข้าสู่ระบบ", "Log in")}</Link>
      </p>
      <BackHomeLink />
      <p className="pt-2 text-center text-xs tracking-[0.24px] text-muted-foreground">
        {translate("เราเก็บข้อมูลของคุณอย่างปลอดภัย และไม่นำไปใช้นอก Pegasus TCG", "We keep your information safe. We never use your information outside of Pegasus TCG.")}</p>
    </form>
  );
}

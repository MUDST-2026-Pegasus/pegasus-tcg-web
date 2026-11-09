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
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/auth.schema";
import { applyApiErrors } from "@/lib/form";

export function RegisterForm() {
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

  const activeError = googleSignIn.isError
    ? googleSignIn.error
    : registerAccount.isError
      ? registerAccount.error
      : null;

  const formAlert = activeError
    ? getAuthErrorAlert(
        activeError,
        "Could not create your account. Please try again.",
      )
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

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        isLoading={isGoogleSigningIn}
        disabled={isSubmitting}
      />

      <FieldGroup>
        <Field data-invalid={Boolean(errors.username) || undefined}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder="Create your username"
            aria-invalid={Boolean(errors.username)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("username")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.username]} />
        </Field>
        <Field data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder="Name other members will see"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
            disabled={isGoogleSigningIn}
            className="h-12 rounded-lg border-border bg-background px-4"
          />
          <FieldError errors={[errors.displayName]} />
        </Field>
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={Boolean(errors.email)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("email")}
            disabled={isGoogleSigningIn}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
            disabled={isGoogleSigningIn}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>At least 8 characters</FieldDescription>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm your password"
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
              I agree to the Pegasus
            </FieldLabel>{" "}
            <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Privacy Policy
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
          {isSubmitting ? "Creating account…" : "Sign up"}
        </Button>
      </FieldGroup>
      <p className="text-center text-sm text-muted-foreground ">
        Already have an account? &nbsp;
        <Link to={{ pathname: "/login", search: location.search }} className="font-medium text-primary">
          Log in
        </Link>
      </p>
      <BackHomeLink />
      <p className="pt-2 text-center text-xs tracking-[0.24px] text-muted-foreground">
        We keep your information safe. We never use your information outside of
        Pegasus TCG.
      </p>
    </form>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useLogin } from "@/features/auth/auth.queries";
import { loginSchema, type LoginFormValues } from "@/features/auth/auth.schema";
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

type LocationState = { from?: { pathname?: string } } | null;

export function LoginForm() {
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
      const from = (location.state as LocationState)?.from?.pathname;
      navigate(from ?? "/", { replace: true });
    } catch (error) {
      // 401 ตั้งใจไม่ชี้ว่าช่องไหนผิด กันไม่ให้เดาว่าอีเมลนี้มีบัญชีจริงไหม
      applyApiErrors(error, setError);
    }
  });

  const formMessage = login.isError
    ? getErrorMessage(login.error, "Could not sign you in. Please try again.")
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
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={Boolean(errors.email)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field className="gap-2" data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
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
        {isSubmitting ? "Signing in…" : "Log in"}
      </Button>

      <div className="flex flex-col gap-2 pt-2">
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}

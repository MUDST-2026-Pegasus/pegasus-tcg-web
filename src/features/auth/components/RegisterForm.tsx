import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

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
import { Spinner } from "@/components/ui/spinner";
import { useRegister } from "@/features/auth/auth.queries";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/auth.schema";
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

export function RegisterForm() {
  const navigate = useNavigate();
  const registerAccount = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
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
      navigate("/", { replace: true });
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
        "Could not create your account. Please try again.",
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
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder="Create your username"
            aria-invalid={Boolean(errors.username)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>
            className="h-12 rounded-lg border-border bg-background px-4"
        <Field data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder="Name other members will see"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
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
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            className="h-12 rounded-lg border-border bg-background px-4"
            {...register("password")}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>At least 8 characters</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
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
                className="bg-white border-2 border-black-50 size-4.5"
              />
            )}
          />
          <FieldLabel htmlFor="terms" className="font-normal">
            I agree to the Pegasus{" "}
            <span className="text-primary">Terms of Service</span> and{" "}
            <span className="text-primary">Privacy Policy</span>
          </FieldLabel>
        </Field>
        <FieldError errors={[errors.acceptTerms]} />
        <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Creating account…" : "Sign up"}
        </Button>
      </FieldGroup>
      <p className="text-center text-sm text-muted-foreground ">
        Already have an account? &nbsp;
        <Link to="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
      <p className="text-center text-xs tracking-[0.24px] text-muted-foreground">
        We keep your information safe. We never use your information outside of
        Pegasus TCG.
      </p>
    </form>
  );
}

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: wire up registration
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            placeholder="Create your username"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input
            id="displayName"
            placeholder="Enter your display name"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="Enter your email" className="h-12 rounded-lg border-border bg-background px-4" />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
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
          <Checkbox id="terms" className="bg-white border-2 border-black-50 size-4.5" />
          <FieldLabel htmlFor="terms" className="font-normal">
            I agree to the Pegasus{" "}
            <span className="text-primary">Terms of Service</span> and{" "}
            <span className="text-primary">Privacy Policy</span>
          </FieldLabel>
        </Field>
        <Button type="submit" className="h-12 w-full rounded-lg text-base">
          Sign up
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

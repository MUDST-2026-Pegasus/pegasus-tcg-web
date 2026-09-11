import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function LoginForm() {
  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        // Authentication will be connected in its dedicated task.
      }}
    >
      <FieldGroup className="gap-5">
        <Field className="gap-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-12 rounded-lg border-border bg-background px-4"
          />
        </Field>
      </FieldGroup>

      <Button type="submit" className="h-12 w-full rounded-lg text-base">
        Log in
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

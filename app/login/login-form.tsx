"use client";

import { useActionState } from "react";
import { login, type LoginError, type LoginState } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type LoginFormLabels = {
  email: string;
  emailPlaceholder: string;
  password: string;
  signIn: string;
  signingIn: string;
  errors: Record<LoginError, string>;
};

export default function LoginForm({ labels }: { labels: LoginFormLabels }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(async (_previous, formData) => login(formData), {});

  return (
    <form action={formAction} className="space-y-5">
      <Field htmlFor="email" label={labels.email}>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder={labels.emailPlaceholder} dir="ltr" />
      </Field>
      <Field htmlFor="password" label={labels.password}>
        <Input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" />
      </Field>
      {state.error && <Alert tone="danger">{labels.errors[state.error]}</Alert>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? labels.signingIn : labels.signIn}
      </Button>
    </form>
  );
}

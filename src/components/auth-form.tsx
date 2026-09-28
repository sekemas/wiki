import { useState } from "react";

import { ErrorSummary, Field, SubmitButton, inputClass } from "~/components/forms";
import { follow, postForm } from "~/lib/forms";

/**
 * Log in / sign up. Both post to a POST endpoint that validates on the server
 * and answers with field errors; the form only displays them.
 */
export function AuthForm({
  mode,
  next,
  error,
  defaults = {},
}: {
  mode: "login" | "signup";
  next: string;
  error?: string;
  defaults?: { email?: string; displayName?: string };
}) {
  const [errors, setErrors] = useState<Record<string, string>>(error ? { form: error } : {});
  const [busy, setBusy] = useState(false);
  const action = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setErrors({});
    try {
      const result = await postForm(action, form);
      if (result.ok) {
        follow(result);
        return;
      }
      setErrors(result.errors.form ? result.errors : { ...result.errors, form: result.message });
    } catch {
      setErrors({ form: "The site could not be reached. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form method="post" action={action} onSubmit={onSubmit} className="mt-6 space-y-5">
      {Object.keys(errors).length > 0 ? <ErrorSummary errors={errors} /> : null}
      <input type="hidden" name="next" value={next} />

      {mode === "signup" ? (
        <Field
          id="display_name"
          label="Editor name"
          hint="Shown next to every edit you make, in the revision history. It cannot be changed later, and no two editors can share one."
          error={errors.displayName}
        >
          <input
            id="display_name"
            name="display_name"
            defaultValue={defaults.displayName ?? ""}
            autoComplete="nickname"
            required
            className={inputClass}
            placeholder="Ada Lovelace"
          />
        </Field>
      ) : null}

      <Field id="email" label="Email address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults.email ?? ""}
          autoComplete="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </Field>

      <Field
        id="password"
        label="Password"
        hint={mode === "signup" ? "At least 8 characters. Stored only as an argon2id hash." : undefined}
        error={errors.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          className={inputClass}
        />
      </Field>

      <div className="border-t border-stone-200 pt-5">
        <SubmitButton busy={busy}>{mode === "login" ? "Log in" : "Create account"}</SubmitButton>
      </div>
    </form>
  );
}

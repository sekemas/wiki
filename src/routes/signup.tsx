import { Link, createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "~/components/auth-form";
import { Notice } from "~/components/forms";

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeNext(value: unknown): string {
  const raw = text(value);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: text(search.next),
    error: text(search.error),
    email: text(search.email),
  }),
  head: () => ({ meta: [{ title: "Create an account - Openpedia" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { next, error, email } = Route.useSearch();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <p className="section-label">Account</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
        Create an account
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        Anyone can read Openpedia; an account is what lets you write. Your editor name appears on
        every revision you save, and your password is stored only as a hash — there is no third-party
        login service involved.
      </p>

      {error ? (
        <div className="mt-5">
          <Notice kind="info">{error}</Notice>
        </div>
      ) : null}

      <AuthForm mode="signup" next={safeNext(next)} error={error} defaults={{ email }} />

      <p className="mt-8 text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          to="/login"
          search={{ next, error: undefined, email: undefined }}
          className="text-rose-900 hover:underline"
        >
          Log in
        </Link>
        .
      </p>
    </main>
  );
}

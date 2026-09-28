import { Link, createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "~/components/auth-form";
import { Notice } from "~/components/forms";

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Only same-site paths are accepted as a post-login destination. */
function safeNext(value: unknown): string {
  const raw = text(value);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: text(search.next),
    error: text(search.error),
    email: text(search.email),
  }),
  head: () => ({ meta: [{ title: "Log in - Openpedia" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { next, error, email } = Route.useSearch();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <p className="section-label">Account</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
        Log in
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        Editors sign in with an email address and password. Every edit you save is recorded against
        your editor name in the article&rsquo;s public revision history.
      </p>

      {error ? (
        <div className="mt-5">
          <Notice kind="info">{error}</Notice>
        </div>
      ) : null}

      <AuthForm mode="login" next={safeNext(next)} error={error} defaults={{ email }} />

      <p className="mt-8 text-sm text-stone-600">
        No account yet?{" "}
        <Link
          to="/signup"
          search={{ next, error: undefined, email: undefined }}
          className="text-rose-900 hover:underline"
        >
          Create one
        </Link>{" "}
        — you only need an email address and a name for your edits.
      </p>
    </main>
  );
}

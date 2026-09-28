import type { ReactNode } from "react";

/** A red box listing what went wrong, shown above a form. */
export function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const messages = Object.values(errors).filter((message) => message.length > 0);
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <p className="font-medium">There is a problem with this form:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "success";
  children: ReactNode;
}) {
  const tone =
    kind === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : "border-stone-300 bg-white text-stone-700";
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${tone}`}>{children}</div>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

export const labelClass = "text-sm font-medium text-stone-800";

export function SubmitButton({
  children,
  busy,
  secondary = false,
}: {
  children: ReactNode;
  busy?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className={
        secondary
          ? "rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
          : "rounded-md bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
      }
    >
      {busy ? "Saving…" : children}
    </button>
  );
}

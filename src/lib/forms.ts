/**
 * The one client-side helper the editing forms use.
 *
 * It posts the form to one of the site's own POST endpoints (`src/api.ts`) as
 * form data, asking for JSON so field errors can be shown next to the fields
 * instead of navigated to. The endpoint re-checks the session from the cookie on
 * every call; nothing here decides who the editor is.
 *
 * If JavaScript is unavailable the same `<form>` submits itself to the same URL
 * and the endpoint answers with a redirect instead.
 */

export const FORM_HEADER = "x-openpedia-form";

export type SubmitResult =
  | { ok: true; redirect: string }
  | { ok: false; errors: Record<string, string>; message: string; login?: boolean };

export async function postForm(action: string, form: HTMLFormElement): Promise<SubmitResult> {
  const response = await fetch(action, {
    method: "POST",
    body: new FormData(form),
    credentials: "same-origin",
    headers: { accept: "application/json", [FORM_HEADER]: "fetch" },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body = (payload ?? {}) as {
    ok?: boolean;
    redirect?: string;
    errors?: Record<string, string>;
    message?: string;
    login?: boolean;
  };

  if (response.ok && body.ok === true) {
    return { ok: true, redirect: body.redirect ?? "/" };
  }

  return {
    ok: false,
    errors: body.errors ?? {},
    message: body.message ?? "Something went wrong. Please try again.",
    login: body.login === true,
  };
}

/** Move to a redirect target, reloading the page so the new session is picked up. */
export function follow(result: { redirect: string }): void {
  window.location.assign(result.redirect);
}

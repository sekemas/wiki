/**
 * Plain HTTP POST endpoints for Openpedia, served ahead of the router by
 * `src/server.ts`. Server-only.
 *
 * These exist so every write is a real, testable POST:
 *   POST /api/auth/signup        create an account and log in
 *   POST /api/auth/login         log in
 *   POST /api/auth/logout        log out (deletes the session row)
 *   POST /api/articles/create    create an article
 *   POST /api/articles/update    edit an existing article
 *
 * The forms on the site post here with `fetch` (and ask for JSON, so errors
 * appear next to the field they belong to). A browser submitting the same form
 * without JavaScript gets the same checks, then a redirect: back to the form
 * with an error code, or on to the article with a confirmation. Both paths run
 * the same code below.
 *
 * Security, in one place:
 *   - every write requires a session that is re-checked here from the cookie;
 *     no user id is ever read from the request body;
 *   - a cross-origin POST is refused (403) unless the `Origin` header matches
 *     this host, and the session cookie is SameSite=Lax besides;
 *   - the body must be a form encoding, so a cross-site JSON POST cannot sneak
 *     through as a "simple" request;
 *   - the only redirect targets accepted are paths on this site.
 */
import {
  SESSION_COOKIE,
  clearSessionCookie,
  cookieValue,
  deleteSession,
  sessionCookie,
  userForToken,
} from "./auth";
import { logIn, saveArticle, signUp, type FieldErrors } from "./mutations";

const FORM_HEADER = "x-openpedia-form";

type FormValues = Record<string, string>;

async function readForm(request: Request): Promise<FormValues | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/x-www-form-urlencoded") && !type.includes("multipart/form-data")) {
    return null;
  }
  const form = await request.formData();
  const values: FormValues = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    // Checkboxes send the same key repeatedly: keep the first and join the rest.
    values[key] = values[key] === undefined ? value : `${values[key]},${value}`;
  }
  return values;
}

function multiple(values: FormValues, key: string): string[] {
  const raw = values[key];
  return raw === undefined || raw === "" ? [] : raw.split(",");
}

function wantsJson(request: Request): boolean {
  if (request.headers.get(FORM_HEADER) !== null) return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client (curl) or same-origin form post
  try {
    const target = new URL(request.url);
    const source = new URL(origin);
    return source.host === (request.headers.get("host") ?? target.host);
  } catch {
    return false;
  }
}

/** Only same-site paths may be used as a redirect target. */
function safeNext(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function withQuery(path: string, params: Record<string, string>): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value.length > 0) url.set(key, value);
  }
  const query = url.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

function json(body: unknown, status: number, cookies: string[] = []): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function seeOther(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ location });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

/** Errors: JSON for the forms, a redirect back for a no-JavaScript browser. */
function failures(
  request: Request,
  errors: FieldErrors,
  formPath: string,
  context: Record<string, string> = {},
): Response {
  const first = Object.values(errors)[0] ?? "That did not work.";
  if (wantsJson(request)) return json({ ok: false, errors, message: first }, 400);
  return seeOther(withQuery(formPath, { ...context, error: first }));
}

function requireSession(request: Request, formPath: string, next: string): Response | null {
  const token = cookieValue(request, SESSION_COOKIE);
  const user = userForToken(token);
  if (user) return null;
  if (wantsJson(request)) {
    return json({ ok: false, message: "Log in to save your edit.", login: true }, 401);
  }
  return seeOther(withQuery("/login", { next, error: "Log in to save your edit." }));
}

/* --------------------------------------------------------------- the router */

export async function handleApiRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (request.method !== "POST") {
    return json({ ok: false, message: `${request.method} is not allowed here. Use POST.` }, 405);
  }
  if (!sameOrigin(request)) {
    return json({ ok: false, message: "Cross-origin writes are not allowed." }, 403);
  }

  const values = await readForm(request);
  if (!values) {
    return json(
      { ok: false, message: "Send the form as application/x-www-form-urlencoded or multipart/form-data." },
      415,
    );
  }

  switch (pathname) {
    case "/api/auth/signup": {
      const next = safeNext(values.next, "/");
      const result = await signUp({
        email: values.email ?? "",
        displayName: values.display_name ?? "",
        password: values.password ?? "",
      });
      if (!result.ok) {
        return failures(request, result.errors, "/signup", {
          email: values.email ?? "",
          display_name: values.display_name ?? "",
        });
      }
      const cookie = sessionCookie(result.token, request);
      if (wantsJson(request)) return json({ ok: true, redirect: next }, 200, [cookie]);
      return seeOther(next, [cookie]);
    }

    case "/api/auth/login": {
      const next = safeNext(values.next, "/");
      const result = await logIn({ email: values.email ?? "", password: values.password ?? "" });
      if (!result.ok) return failures(request, result.errors, "/login", { email: values.email ?? "" });
      const cookie = sessionCookie(result.token, request);
      if (wantsJson(request)) return json({ ok: true, redirect: next }, 200, [cookie]);
      return seeOther(next, [cookie]);
    }

    case "/api/auth/logout": {
      const token = cookieValue(request, SESSION_COOKIE);
      if (token) deleteSession(token);
      const cleared = clearSessionCookie(request);
      if (wantsJson(request)) return json({ ok: true, redirect: "/" }, 200, [cleared]);
      return seeOther("/", [cleared]);
    }

    case "/api/articles/create":
    case "/api/articles/update": {
      const isCreate = pathname === "/api/articles/create";
      const formPath = isCreate ? "/new" : `/wiki/${values.slug ?? ""}/edit`;
      const rejection = requireSession(request, formPath, formPath);
      if (rejection) return rejection;
      const user = userForToken(cookieValue(request, SESSION_COOKIE));
      if (!user) return json({ ok: false, message: "Log in to save your edit." }, 401);

      const result = saveArticle(
        {
          slug: isCreate ? undefined : values.slug,
          title: values.title ?? "",
          summary: values.summary ?? "",
          body: values.body ?? "",
          note: values.note ?? "",
          categories: multiple(values, "categories"),
        },
        user,
      );

      if (!result.ok) return failures(request, result.errors, formPath);
      const target = withQuery(
        `/wiki/${result.slug}`,
        result.created ? { created: String(result.revisionId) } : { saved: String(result.revisionId) },
      );
      if (wantsJson(request)) return json({ ok: true, redirect: target, slug: result.slug }, 200);
      return seeOther(target);
    }

    default:
      return json({ ok: false, message: "No such endpoint." }, 404);
  }
}

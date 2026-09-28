/**
 * Writes for Openpedia: sign up, log in, and saving an article (which always
 * records a revision). Server-only.
 *
 * These are the only functions that change the encyclopedia. Both entry points
 * — the POST server function used by the forms, and the POST route handlers in
 * `src/api.ts` — call exactly these, so an edit made through the website and an
 * edit made with `curl` are the same code path with the same checks.
 *
 * A user id never arrives from the client: callers pass the `SessionUser` they
 * resolved server-side from the session cookie.
 */
import { getDb } from "./db";
import {
  MIN_PASSWORD_LENGTH,
  createSession,
  looksLikeEmail,
  normaliseEmail,
  validDisplayName,
  type SessionUser,
} from "./auth";

export type FieldErrors = Record<string, string>;

export type AuthResult =
  | { ok: true; user: SessionUser; token: string }
  | { ok: false; errors: FieldErrors };

export type SaveInput = {
  /** Absent or empty for a brand new article; set when editing an existing one. */
  slug?: string;
  title: string;
  summary: string;
  body: string;
  note: string;
  categories: string[];
};

export type SaveResult =
  | { ok: true; slug: string; revisionId: number; created: boolean }
  | { ok: false; errors: FieldErrors };

const MAX_TITLE = 200;

/* ----------------------------------------------------------------- accounts */

type UserRow = { id: number; email: string; display_name: string; password_hash: string };

function findUserByEmail(email: string): UserRow | null {
  return (
    getDb()
      .query<UserRow, [string]>("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email) ?? null
  );
}

function findUserByName(name: string): UserRow | null {
  return (
    getDb()
      .query<UserRow, [string]>("SELECT * FROM users WHERE display_name = ? COLLATE NOCASE")
      .get(name) ?? null
  );
}

/**
 * Create an account and log it in. Rejects a duplicate email or display name
 * with a message that says which one is taken (both are public on the site, and
 * a second person cannot create the name they wanted without knowing that).
 */
export async function signUp(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthResult> {
  const email = normaliseEmail(input.email);
  const displayName = input.displayName.trim();
  const errors: FieldErrors = {};

  if (email.length === 0) errors.email = "Enter your email address.";
  else if (!looksLikeEmail(email)) errors.email = `“${email}” doesn’t look like an email address.`;

  if (displayName.length === 0) errors.displayName = "Choose the name that will appear on your edits.";
  else if (!validDisplayName(displayName)) {
    errors.displayName =
      "Use 2–40 letters, digits, spaces or . _ - and start and end with a letter or digit.";
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${String(MIN_PASSWORD_LENGTH)} characters.`;
  }

  if (!errors.email && findUserByEmail(email)) {
    errors.email = "That email address already has an account. Log in instead.";
  }
  if (!errors.displayName && findUserByName(displayName)) {
    errors.displayName = "That editor name is taken. Pick another one.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const passwordHash = await Bun.password.hash(input.password, { algorithm: "argon2id" });
  const info = getDb()
    .query("INSERT INTO users (email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(email, displayName, passwordHash, new Date().toISOString());

  const user: SessionUser = { id: Number(info.lastInsertRowid), email, displayName };
  return { ok: true, user, token: createSession(user.id) };
}

/**
 * Check an email/password pair. A wrong email and a wrong password produce the
 * same result, so the login form can never be used to discover which addresses
 * have accounts.
 */
export async function logIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normaliseEmail(input.email);
  const errors: FieldErrors = {};
  if (email.length === 0) errors.email = "Enter your email address.";
  if (input.password.length === 0) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const row = findUserByEmail(email);
  const ok = row ? await Bun.password.verify(input.password, row.password_hash) : false;
  if (!row || !ok) {
    return {
      ok: false,
      errors: { form: "Those details don’t match an account. Check your email and password." },
    };
  }

  const user: SessionUser = { id: row.id, email: row.email, displayName: row.display_name };
  return { ok: true, user, token: createSession(user.id) };
}

/* ------------------------------------------------------------- article slugs */

export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** `foo`, then `foo-2`, `foo-3`… until the slug is free. */
export function uniqueSlug(title: string): string {
  const base = slugify(title) || "article";
  const db = getDb();
  const taken = db.query<{ n: number }, [string]>("SELECT COUNT(*) AS n FROM articles WHERE slug = ? COLLATE NOCASE");
  if ((taken.get(base)?.n ?? 0) === 0) return base;
  for (let suffix = 2; suffix < 500; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if ((taken.get(candidate)?.n ?? 0) === 0) return candidate;
  }
  return `${base}-${String(Date.now())}`;
}

/* ---------------------------------------------------------------- save edits */

/** The plain text of the first paragraph, used when no summary is given. */
function deriveSummary(body: string): string {
  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith("#"));
  if (!firstParagraph) return "";
  return firstParagraph
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, slug: string, label?: string) => label ?? slug)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/**
 * Save an article: update the row, append a revision attributed to the editor,
 * bump `updated_at`, replace the category links. One transaction, so a failure
 * leaves no half-written edit behind.
 */
export function saveArticle(input: SaveInput, editor: SessionUser): SaveResult {
  const title = input.title.trim();
  const body = input.body.replace(/\r\n/g, "\n");
  const categories = [...new Set(input.categories.map((c) => c.trim()).filter((c) => c.length > 0))];
  const note = input.note.trim().slice(0, 500);

  const errors: FieldErrors = {};
  if (title.length === 0) errors.title = "Give the article a title.";
  else if (title.length > MAX_TITLE) errors.title = `Keep the title under ${String(MAX_TITLE)} characters.`;
  if (body.trim().length === 0) errors.body = "An article needs some text before it can be saved.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const summary = input.summary.trim().length > 0 ? input.summary.trim() : deriveSummary(body);
  const db = getDb();
  const now = new Date().toISOString();

  const replaceCategories = (articleId: number): void => {
    db.query("DELETE FROM article_categories WHERE article_id = ?").run(articleId);
    const link = db.query(
      "INSERT INTO article_categories (article_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
    );
    for (const slug of categories) {
      const category = db
        .query<{ id: number }, [string]>("SELECT id FROM categories WHERE slug = ? COLLATE NOCASE")
        .get(slug);
      if (category) link.run(articleId, category.id);
    }
  };

  const existing = input.slug
    ? db
        .query<{ id: number; created_at: string }, [string]>(
          "SELECT id, created_at FROM articles WHERE slug = ? COLLATE NOCASE",
        )
        .get(input.slug)
    : null;

  if (input.slug && !existing) {
    return { ok: false, errors: { title: "That article no longer exists." } };
  }

  return db.transaction((): SaveResult => {
    let articleId: number;
    let slug: string;
    let created: boolean;

    if (existing) {
      articleId = existing.id;
      slug = input.slug ?? "";
      db.query("UPDATE articles SET title = ?, summary = ?, body = ?, updated_at = ? WHERE id = ?").run(
        title,
        summary,
        body,
        now,
        articleId,
      );
      created = false;
    } else {
      slug = uniqueSlug(title);
      const info = db
        .query(
          "INSERT INTO articles (slug, title, summary, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(slug, title, summary, body, now, now);
      articleId = Number(info.lastInsertRowid);
      created = true;
    }

    replaceCategories(articleId);

    const info = db
      .query(
        `INSERT INTO revisions (article_id, title, body, editor_name, editor_user_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(articleId, title, body, editor.displayName, editor.id, note, now);

    return { ok: true, slug, revisionId: Number(info.lastInsertRowid), created };
  })();
}

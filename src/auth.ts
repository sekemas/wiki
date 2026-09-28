/**
 * Accounts and sessions for Openpedia. Server-only.
 *
 * Everything here is built in-house, with no auth service and no extra
 * dependency: passwords are hashed with Bun's argon2id implementation,
 * sessions are random tokens whose SHA-256 hash is the only thing stored, and
 * the browser holds the token in an httpOnly cookie.
 *
 * No plaintext password is stored, logged, returned or put in a URL. Nothing in
 * this module is safe to import from browser-bundled code.
 */
import { getRequest } from "@tanstack/react-start/server";

import { getDb } from "./db";

export const SESSION_COOKIE = "openpedia_session";
/** How long a login lasts, in seconds (30 days). */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type SessionUser = {
  id: number;
  email: string;
  displayName: string;
};

/* ------------------------------------------------------------------ cookies */

/**
 * Read one cookie out of a Request. Hand-rolled so it works both inside a
 * server function (which has the Start request context) and inside a plain
 * route handler, which does not.
 */
export function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function isSecureRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto") === "https";
}

/** `Set-Cookie` value for a freshly created session. */
export function sessionCookie(token: string, request: Request, maxAge = SESSION_MAX_AGE): string {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${String(maxAge)}; HttpOnly; SameSite=Lax${secure}`;
}

/** `Set-Cookie` value that removes the session cookie from the browser. */
export function clearSessionCookie(request: Request): string {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

/* ----------------------------------------------------------------- sessions */

function hashToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Create a session row for a user and return the token the cookie carries. */
export function createSession(userId: number, ttlSeconds = SESSION_MAX_AGE): string {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  getDb()
    .query("INSERT INTO sessions (user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(userId, hashToken(token), nowIso(), expires);
  return token;
}

/** The signed-in user for a session token, or null if it is unknown/expired. */
export function userForToken(token: string | null): SessionUser | null {
  if (!token) return null;
  const row = getDb()
    .query<{ id: number; email: string; display_name: string; expires_at: string }, [string]>(
      `SELECT u.id AS id, u.email AS email, u.display_name AS display_name, s.expires_at AS expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .get(hashToken(token));
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    deleteSession(token);
    return null;
  }
  return { id: row.id, email: row.email, displayName: row.display_name };
}

/** Delete one session: what "log out" does to the database. */
export function deleteSession(token: string): void {
  getDb().query("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

/** Delete every session of a user (used when an account is removed). */
export function deleteUserSessions(userId: number): void {
  getDb().query("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

/* ------------------------------------------------------------- current user */

/**
 * The signed-in user for the request being served, or null. Works inside a
 * server function (server-rendered or called over RPC): the Start request
 * context supplies the request. Returns null rather than throwing when there is
 * no request context at all, so a page can never crash on a missing session.
 */
export function currentUser(): SessionUser | null {
  let request: Request;
  try {
    request = getRequest();
  } catch {
    return null;
  }
  return userForToken(cookieValue(request, SESSION_COOKIE));
}

/* --------------------------------------------------------------- validation */

export function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

/** 2–40 characters of letters, digits, spaces and . _ - ' */
export function validDisplayName(name: string): boolean {
  return /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{0,38}[\p{L}\p{N}.]$/u.test(name.trim());
}

export const MIN_PASSWORD_LENGTH = 8;

/**
 * The site's server entry.
 *
 * Everything under `/api/` is our own POST surface (see `src/api.ts`) and is
 * answered here before the router sees it. Every other request — pages, and the
 * server-function RPC calls the browser makes — goes to the ordinary TanStack
 * Start handler, exactly as the default entry did.
 *
 * Server-only: nothing imports this from a route or a component, so no database
 * code reaches the browser bundle.
 */
import startEntry, { createServerEntry } from "@tanstack/react-start/server-entry";

import { handleApiRequest } from "./api";

const startFetch = (startEntry as { fetch: (request: Request) => Response | Promise<Response> }).fetch;

export default createServerEntry({
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return await handleApiRequest(request);
    }
    return await startFetch(request);
  },
});

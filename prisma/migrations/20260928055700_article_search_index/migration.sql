-- Ranked full-text search, wired in ahead of the editorial-depth phase: a GIN
-- index over the article text so `to_tsvector('english', ...)` matching and
-- ranking use an index instead of a sequential scan. The read pages still search
-- with a simple case-insensitive substring match, which the same text serves.
CREATE INDEX "articles_search_idx" ON "articles"
  USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("body", '')));

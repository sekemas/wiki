/**
 * A small Markdown renderer for Openpedia article bodies.
 *
 * Deliberately focused. It supports headings, paragraphs, unordered and ordered
 * lists, block quotes, fenced code, horizontal rules, `**bold**`, `*italic*`,
 * `` `code` ``, ordinary `[label](/path)` links and wiki-style `[[slug|label]]`
 * links.
 *
 * It is safe by construction: raw HTML in the source is treated as text (there
 * is no HTML passthrough, no dangerouslySetInnerHTML, and no third-party parser
 * between the stored content and the page).
 */
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type Heading = { id: string; text: string };

type Block =
  | { kind: "heading"; level: 2 | 3; text: string; id: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string }
  | { kind: "rule" };

const HEADING_RE = /^(#{2,3})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const RULE_RE = /^(-{3,}|\*{3,}|_{3,})$/;

export function headingAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const used = new Map<string, number>();

  const uniqueId = (text: string): string => {
    const base = headingAnchor(text) || "section";
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };

  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      continue;
    }

    if (trimmed.startsWith("```")) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }

    const heading = HEADING_RE.exec(trimmed);
    if (heading) {
      flush();
      const level = heading[1].length === 2 ? 2 : 3;
      const text = heading[2].trim();
      blocks.push({ kind: "heading", level, text, id: uniqueId(text) });
      continue;
    }

    if (RULE_RE.test(trimmed)) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }

    if (UL_RE.test(trimmed) || OL_RE.test(trimmed)) {
      flush();
      const ordered = OL_RE.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const candidate = lines[i].trim();
        const match = ordered ? OL_RE.exec(candidate) : UL_RE.exec(candidate);
        if (!match) break;
        items.push(match[1].trim());
        i++;
      }
      i--;
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    if (QUOTE_RE.test(trimmed)) {
      flush();
      const quoted: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i].trim())) {
        quoted.push(QUOTE_RE.exec(lines[i].trim())![1]);
        i++;
      }
      i--;
      blocks.push({ kind: "quote", text: quoted.join(" ").trim() });
      continue;
    }

    paragraph.push(trimmed);
  }

  flush();
  return blocks;
}

/** Table of contents, in document order — same ids the renderer emits. */
export function extractHeadings(markdown: string): Heading[] {
  return parseBlocks(markdown)
    .filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading")
    .map((b) => ({ id: b.id, text: b.text }));
}

type InlineOptions = { knownSlugs?: Set<string> };

const INLINE_RE =
  /\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|`([^`\n]+)`/g;

function renderInline(text: string, options: InlineOptions, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const id = `${keyPrefix}-i${String(key++)}`;
    const [raw, wiki, linkLabel, linkHref, bold, boldAlt, italic, italicAlt, code] = match;

    if (wiki !== undefined) {
      const [slugPart, labelPart] = wiki.split("|");
      const slug = slugPart.trim();
      const label = (labelPart ?? slugPart).trim();
      const missing = options.knownSlugs ? !options.knownSlugs.has(slug.toLowerCase()) : false;
      nodes.push(
        <Link
          key={id}
          to="/wiki/$slug"
          params={{ slug }}
          className={
            missing
              ? "rounded-sm bg-amber-50/70 px-0.5 text-amber-800 underline decoration-dotted underline-offset-2 hover:bg-amber-100"
              : "rounded-sm bg-stone-100 px-0.5 text-rose-900 underline decoration-rose-300 decoration-dotted underline-offset-2 hover:bg-rose-50 hover:decoration-rose-500"
          }
          title={missing ? `No article yet: ${slug}` : `Openpedia article: ${label}`}
        >
          {label}
        </Link>,
      );
    } else if (linkLabel !== undefined && linkHref !== undefined) {
      const external = /^[a-z][a-z0-9+.-]*:/i.test(linkHref);
      nodes.push(
        external ? (
          <a
            key={id}
            href={linkHref}
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="text-blue-800 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600"
          >
            {linkLabel}
          </a>
        ) : (
          <a
            key={id}
            href={linkHref}
            className="text-blue-800 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600"
          >
            {linkLabel}
          </a>
        ),
      );
    } else if (bold !== undefined || boldAlt !== undefined) {
      nodes.push(
        <strong key={id} className="font-semibold text-stone-900">
          {bold ?? boldAlt}
        </strong>,
      );
    } else if (italic !== undefined || italicAlt !== undefined) {
      nodes.push(
        <em key={id} className="italic">
          {italic ?? italicAlt}
        </em>,
      );
    } else if (code !== undefined) {
      nodes.push(
        <code key={id} className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.9em] text-stone-800">
          {code}
        </code>,
      );
    } else {
      nodes.push(raw);
    }

    last = match.index + raw.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Render an article body to React nodes. */
export function Markdown({ source, knownSlugs }: { source: string; knownSlugs?: Set<string> }) {
  const blocks = parseBlocks(source);
  return (
    <div className="wiki-body">
      {blocks.map((block, index) => {
        const key = `b${String(index)}`;
        switch (block.kind) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={key}
                id={block.id}
                className="mt-10 mb-3 scroll-mt-24 border-b border-stone-200 pb-1 font-serif text-2xl font-semibold text-stone-900"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={key}
                id={block.id}
                className="mt-7 mb-2 scroll-mt-24 font-serif text-xl font-semibold text-stone-800"
              >
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={key} className="my-4">
                {renderInline(block.text, { knownSlugs }, key)}
              </p>
            );
          case "list":
            return block.ordered ? (
              <ol key={key} className="my-4 list-decimal space-y-1.5 pl-6 marker:text-stone-400">
                {block.items.map((item, i) => (
                  <li key={`${key}-${String(i)}`}>
                    {renderInline(item, { knownSlugs }, `${key}-${String(i)}`)}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="my-4 list-disc space-y-1.5 pl-6 marker:text-stone-400">
                {block.items.map((item, i) => (
                  <li key={`${key}-${String(i)}`}>
                    {renderInline(item, { knownSlugs }, `${key}-${String(i)}`)}
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-5 border-l-4 border-stone-300 bg-stone-50/70 px-4 py-1 text-stone-700 italic"
              >
                {renderInline(block.text, { knownSlugs }, key)}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={key}
                className="my-5 overflow-x-auto rounded-md bg-stone-900 p-4 text-sm text-stone-100"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "rule":
            return <hr key={key} className="my-8 border-stone-200" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default Markdown;

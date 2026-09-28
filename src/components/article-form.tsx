import { useState } from "react";

import { ErrorSummary, Field, SubmitButton, inputClass } from "~/components/forms";
import { follow, postForm } from "~/lib/forms";

export type ArticleFormValues = {
  slug?: string;
  title: string;
  summary: string;
  body: string;
  note: string;
  categorySlugs: string[];
};

/**
 * The writing form, shared by "create an article" and "edit an article".
 *
 * It posts to one of the site's own POST endpoints. The endpoint checks the
 * session cookie itself and refuses the write if there isn't one — this
 * component cannot, and does not need to, say who the editor is.
 */
export function ArticleForm({
  action,
  values,
  categories,
  submitLabel,
  editorName,
  error,
}: {
  action: string;
  values: ArticleFormValues;
  categories: { slug: string; name: string }[];
  submitLabel: string;
  editorName: string;
  error?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>(
    error ? { form: error } : {},
  );
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(values.title);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setErrors({});
    try {
      const result = await postForm(action, form);
      if (result.ok) {
        follow(result);
        return;
      }
      setErrors(result.errors.form ? result.errors : { ...result.errors, form: result.message });
    } catch {
      setErrors({ form: "The site could not be reached. Your text is still in the form — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form method="post" action={action} onSubmit={onSubmit} className="mt-6 space-y-6">
      {rejection(errors) ? <ErrorSummary errors={errors} /> : null}

      {values.slug ? <input type="hidden" name="slug" value={values.slug} /> : null}

      <Field id="article-title" label="Title" error={errors.title}>
        <input
          id="article-title"
          name="title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          required
          maxLength={200}
          className={inputClass}
          placeholder="An article title"
        />
      </Field>

      {!values.slug && title.trim().length > 0 ? (
        <p className="-mt-4 text-xs text-stone-500">
          Web address: /wiki/{slugPreview(title)}
        </p>
      ) : null}

      <Field
        id="article-summary"
        label="Summary"
        hint="The lead paragraph, shown at the top of the article and in search results. Left blank, the first paragraph of the text is used."
        error={errors.summary}
      >
        <textarea
          id="article-summary"
          name="summary"
          defaultValue={values.summary}
          rows={3}
          className={inputClass}
        />
      </Field>

      <Field
        id="article-body"
        label="Article text"
        hint="Markdown: ## headings, **bold**, [links](https://example.com) and [[slug|other article]]."
        error={errors.body}
      >
        <textarea
          id="article-body"
          name="body"
          defaultValue={values.body}
          rows={18}
          required
          className={`${inputClass} font-mono text-[0.8125rem] leading-6`}
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-stone-800">Categories</legend>
        <p className="mt-0.5 text-xs text-stone-500">
          Categories group articles together and decide what appears as “related”.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {categories.map((category) => (
            <label key={category.slug} className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="categories"
                value={category.slug}
                defaultChecked={values.categorySlugs.includes(category.slug)}
                className="h-4 w-4 rounded border-stone-300 text-rose-700 focus:ring-rose-200"
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="article-note"
        label="Edit note"
        hint={`Recorded in the revision history next to your name (${editorName}).`}
        error={errors.note}
      >
        <input
          id="article-note"
          name="note"
          defaultValue={values.note}
          maxLength={500}
          className={inputClass}
          placeholder="What you changed, and why"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-5">
        <SubmitButton busy={busy}>{submitLabel}</SubmitButton>
        <a
          href={values.slug ? `/wiki/${values.slug}` : "/browse"}
          className="text-sm text-stone-600 hover:text-rose-900 hover:underline"
        >
          Cancel
        </a>
        <p className="text-xs text-stone-500">
          Saving records a revision under your editor name. Nothing is deleted, ever.
        </p>
      </div>
    </form>
  );
}

function rejection(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/** Mirrors the server's slug rules closely enough for a preview. */
function slugPreview(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "article"
  );
}

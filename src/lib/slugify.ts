/**
 * URL slug generation.
 *
 * The prototype routed articles by opaque id (`/article/:id`). We route by slug
 * (`/articles/:slug`) so URLs are readable and indexable — a real difference
 * for a publication that wants its stories found via search.
 */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/**
 * Appends a numeric suffix until the slug is unique.
 * `isTaken` should query the database in the backend phase.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || "untitled";
  let candidate = root;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

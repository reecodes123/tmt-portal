"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ArticleContent } from "@/components/public/ArticleContent";
import { sanitizeRichTextForPreview } from "@/lib/sanitize-preview";
import {
  createArticle,
  deleteArticle,
  updateArticle,
  uploadMedia,
} from "@/lib/api-client";
import type {
  Article,
  ArticleStatus,
  Category,
  UserRole,
} from "@/types/domain";

interface Props {
  categories: Category[];
  author: { id: string; displayName: string; role: UserRole };
  /**
   * Whether this account currently has article-approval authority — true
   * for every admin, and for an editor only if the EIC has delegated it.
   * Computed server-side by the page and passed down purely to decide which
   * buttons to show; the API independently re-checks this on every
   * transition into "published" or "needs_revision" regardless of what's
   * rendered here.
   */
  canApprove: boolean;
  existingArticle?: Article;
}

/**
 * Draft-to-publish article editor.
 *
 * Workflow: draft -> in_review -> published, with a rejection loop:
 * in_review -> needs_revision -> (revise) -> in_review -> published. Moving
 * into "published" or "needs_revision" requires approval authority
 * (`canApprove`, i.e. server/permissions.ts's canApproveArticles()) — an
 * ordinary editor without delegated authority can create/edit/submit and
 * resubmit, but cannot approve or reject. See PATCH /api/articles/[id] for
 * the server-side enforcement this UI reflects but never substitutes for.
 */
export function ArticleEditorForm({
  categories,
  author,
  canApprove,
  existingArticle,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(existingArticle?.title ?? "");
  const [subheadline, setSubheadline] = useState(
    existingArticle?.subheadline ?? ""
  );
  const [content, setContent] = useState(existingArticle?.content ?? "");
  const [categorySlug, setCategorySlug] = useState(
    existingArticle?.categorySlug ?? categories[0]?.slug ?? "news"
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    existingArticle?.coverImageUrl ?? ""
  );
  const [photoCredit, setPhotoCredit] = useState(
    existingArticle?.photoCredit ?? ""
  );
  /**
   * The credited writer's byline — plain manually-typed text, e.g. "Airelyn
   * Moreno" or "Juan Dela Cruz and Maria Santos". Deliberately NOT sourced
   * from Positions or the logged-in account: the person who wrote a piece
   * is often not the staff account publishing it, and doesn't need to hold
   * any Editorial Board title. See Article.articleBy in types/domain.ts.
   */
  const [articleBy, setArticleBy] = useState(existingArticle?.articleBy ?? "");
  const [featured, setFeatured] = useState(existingArticle?.featured ?? false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<ArticleStatus | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  /**
   * Preview is purely a client-side view toggle over the form's own React
   * state — no API call, no DB write, nothing to save or submit. That's
   * deliberate: it's the only way to guarantee previewing can never publish,
   * submit, or create a record no matter what — there's simply no network
   * request for a bug to hide in. Going "Back to Editor" just flips this
   * back; the form state underneath was never touched.
   */
  const [showPreview, setShowPreview] = useState(false);

  // Sanitized client-side (lib/sanitize-preview.ts — a browser-native
  // equivalent of the server's sanitizer, see that file for why it's a
  // separate implementation) — necessary because this is live, unsaved
  // editor HTML that has never been through server-side sanitization yet.
  // Matters even for a "just previewing my own draft" case: an Editor's
  // draft can be previewed by an Admin before approval, so unsanitized
  // content here would mean rendering one staff member's raw, never-
  // validated HTML directly into another staff member's browser session.
  // The actual save path is untouched and re-sanitizes independently on the
  // server regardless of what happens here.
  const previewContentHtml = useMemo(() => sanitizeRichTextForPreview(content), [content]);
  const previewCategoryLabel =
    categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug;

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const asset = await uploadMedia(file);
      setCoverImageUrl(asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent, status: ArticleStatus) => {
    e.preventDefault();
    if (!title.trim() || !articleBy.trim()) {
      setError("Headline and Article By are required.");
      return;
    }
    setSaving(status);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        subheadline: subheadline.trim() || undefined,
        content,
        categorySlug,
        coverImageUrl,
        photoCredit: photoCredit.trim() || null,
        articleBy: articleBy.trim(),
        featured,
        status,
      };
      if (existingArticle) {
        await updateArticle(existingArticle.id, payload);
      } else {
        await createArticle(payload);
      }
      router.push(status === "draft" ? "/dashboard/drafts" : "/dashboard/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async () => {
    if (!existingArticle) return;
    if (!window.confirm("Delete this article permanently?")) return;
    setDeleting(true);
    try {
      await deleteArticle(existingArticle.id);
      router.push("/dashboard/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setDeleting(false);
    }
  };

  const status = existingArticle?.status;

  // Which action buttons this render shows — purely presentational. Every
  // transition into "published"/"needs_revision" is independently re-checked
  // server-side (see the module doc comment above), so this only decides
  // what a well-behaved client offers, not what's actually allowed.
  const isDraftStage = !status || status === "draft";
  const isPendingReview = status === "in_review";
  const isNeedsRevision = status === "needs_revision";
  const isPublished = status === "published";

  // Reviewers (draft/new-article stage): whoever can approve publishes
  // directly; everyone else submits for review instead.
  const primaryTarget: ArticleStatus = canApprove ? "published" : "in_review";
  const primaryLabel = canApprove ? "Publish" : "Submit for Review";

  const showSaveDraft = isDraftStage || isNeedsRevision;
  const showSubmitOrPublish = isDraftStage;
  const showApprovalActions = isPendingReview && canApprove;
  const showResubmit = isNeedsRevision;
  // Already in_review without approval authority, or already published:
  // nothing here should change status, just save content edits in place.
  const showPlainSave = (isPendingReview && !canApprove) || isPublished;

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-tmt-navy text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Eye size={16} className="text-tmt-orange" />
            Preview Mode — not published, nothing has been saved
          </span>
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Editor
          </button>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white rounded-xl shadow-md">
          <ArticleContent
            categoryLabel={previewCategoryLabel}
            title={title}
            subheadline={subheadline || null}
            articleBy={articleBy}
            dateLabel="Preview — not yet published"
            coverImageUrl={coverImageUrl || null}
            photoCredit={photoCredit || null}
            contentHtml={previewContentHtml}
          />
        </article>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => save(e, "draft")} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-5">
        <Field label="Headline" htmlFor="title" required>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
            placeholder="A short, clear headline"
          />
        </Field>

        <Field label="Sub-headline" htmlFor="subheadline">
          <input
            id="subheadline"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
            placeholder="Optional supporting line"
          />
        </Field>

        <Field label="Category" htmlFor="category">
          <select
            id="category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-tmt-orange focus:outline-none transition-colors"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cover image" htmlFor="cover">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="w-32 h-20 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-32 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                <ImagePlus size={22} />
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <ImagePlus size={16} />
                  {coverImageUrl ? "Change image" : "Upload image"}
                </>
              )}
            </label>
          </div>
        </Field>

        <Field
          label="Photo credit"
          htmlFor="photoCredit"
          hint='Who took the photo, e.g. "Juan Dela Cruz". Leave blank for none.'
        >
          <input
            id="photoCredit"
            value={photoCredit}
            onChange={(e) => setPhotoCredit(e.target.value)}
            placeholder="Photographer or source name"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
          />
        </Field>

        <Field
          label="Article By"
          htmlFor="articleBy"
          required
          hint="The person (or people) who actually wrote this piece — not necessarily the account publishing it. Independent of Editorial Board titles."
        >
          <input
            id="articleBy"
            value={articleBy}
            onChange={(e) => setArticleBy(e.target.value)}
            placeholder="Enter the name of the article writer"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
          />
        </Field>

        {/* Featured toggle: admin-only, since it affects homepage placement. */}
        {author.role === "admin" && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange"
            />
            Featured on the homepage
          </label>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <label className="block text-sm font-semibold text-tmt-navy mb-3">
          Body
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write the article here…"
        />
      </div>

      {isNeedsRevision && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          This article was sent back for revision. Make your changes, then resubmit
          it for review.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={saving !== null || deleting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-tmt-navy/20 text-tmt-navy hover:bg-tmt-navy/5 font-semibold transition-colors disabled:opacity-60"
        >
          <Eye size={16} />
          Preview Article
        </button>

        {showSaveDraft && (
          <button
            type="button"
            onClick={(e) => save(e, "draft")}
            disabled={saving !== null || deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-60"
          >
            {saving === "draft" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Draft
          </button>
        )}

        {showSubmitOrPublish && (
          <button
            type="button"
            onClick={(e) => save(e, primaryTarget)}
            disabled={saving !== null || deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
          >
            {saving === primaryTarget ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {primaryLabel}
          </button>
        )}

        {showApprovalActions && (
          <>
            <button
              type="button"
              onClick={(e) => save(e, "published")}
              disabled={saving !== null || deleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-60"
            >
              {saving === "published" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve &amp; Publish
            </button>
            <button
              type="button"
              onClick={(e) => save(e, "needs_revision")}
              disabled={saving !== null || deleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors disabled:opacity-60"
            >
              {saving === "needs_revision" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Request Revision
            </button>
          </>
        )}

        {showResubmit && (
          <button
            type="button"
            onClick={(e) => save(e, "in_review")}
            disabled={saving !== null || deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
          >
            {saving === "in_review" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Resubmit for Review
          </button>
        )}

        {showPlainSave && (
          <button
            type="button"
            onClick={(e) => save(e, status as ArticleStatus)}
            disabled={saving !== null || deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
          >
            {saving === status ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        )}

        {existingArticle && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving !== null || deleting}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-tmt-navy mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

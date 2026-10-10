-- Relaxes excerpt from required to optional on both the live article and
-- its revision-history snapshots. Purely loosens a constraint — no existing
-- value is touched, so every article that already has an excerpt keeps it
-- exactly as-is. Excerpt is no longer collected on create/edit (see
-- createArticleSchema in validation.ts); this migration just makes the
-- database agree with that.
ALTER TABLE `article_revisions` MODIFY `excerpt` TEXT NULL;
ALTER TABLE `articles` MODIFY `excerpt` TEXT NULL;

-- Additive: new enum value (needs_revision) on both places ArticleStatus is
-- used, and a new default-false boolean on users. No existing rows change
-- meaning — every current article keeps its current status, every current
-- user starts without delegated approval authority (grantable by an admin
-- afterward).
ALTER TABLE `article_revisions` MODIFY `status` ENUM('draft', 'in_review', 'needs_revision', 'published') NOT NULL;
ALTER TABLE `articles` MODIFY `status` ENUM('draft', 'in_review', 'needs_revision', 'published') NOT NULL DEFAULT 'draft';
ALTER TABLE `users` ADD COLUMN `canApproveArticles` BOOLEAN NOT NULL DEFAULT false;

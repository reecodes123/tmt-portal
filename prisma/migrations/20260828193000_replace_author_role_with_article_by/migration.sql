-- Replaces the abandoned Position-based `authorRoleLabel` byline with a
-- simple manually-entered `articleBy` field. Nullable first so existing rows
-- can be backfilled before the NOT NULL constraint is applied.
ALTER TABLE `articles` ADD COLUMN `articleBy` VARCHAR(160) NULL;

-- Backfill every existing article with the display name of its authoring
-- account, so no already-published article is left with an empty byline.
-- This is only a starting value — editors can retype it to the actual
-- writer's name at any time; it is not a live link to the author's account.
UPDATE `articles` a
JOIN `users` u ON a.`authorId` = u.`id`
SET a.`articleBy` = u.`displayName`
WHERE a.`articleBy` IS NULL;

-- Defensive fallback in case any row's author account no longer exists.
UPDATE `articles` SET `articleBy` = 'Unknown' WHERE `articleBy` IS NULL;

-- Now safe to require it going forward.
ALTER TABLE `articles` MODIFY COLUMN `articleBy` VARCHAR(160) NOT NULL;

-- Drop the field from the Position-based approach this replaces.
ALTER TABLE `articles` DROP COLUMN `authorRoleLabel`;

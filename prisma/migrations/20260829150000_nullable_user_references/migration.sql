-- Changes Article.authorId, MediaAsset.uploadedById, and ActivityLog.actorId
-- from required+Restrict to nullable+SET NULL. This is what actually lets an
-- Editor account be permanently deleted: previously ANY row anywhere that
-- referenced the account (an authored article, an uploaded file, or even a
-- single activity-log entry) blocked deletion outright via MySQL's default
-- Restrict behavior on a required relation.
--
-- No existing data is touched or lost by this migration — every current
-- article/media/activity-log row keeps its current authorId/uploadedById/
-- actorId value exactly as-is. The change only takes effect the next time a
-- referenced user account is deleted: that FK becomes NULL on the historical
-- rows (article/media/log-entry itself untouched) instead of blocking the
-- delete. Every read path already displays this gracefully (toArticle():
-- "Author information unavailable", toActivityLog(): "Unknown").
-- DropForeignKey
ALTER TABLE `activity_logs` DROP FOREIGN KEY `activity_logs_actorId_fkey`;

-- DropForeignKey
ALTER TABLE `articles` DROP FOREIGN KEY `articles_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `media_assets` DROP FOREIGN KEY `media_assets_uploadedById_fkey`;

-- AlterTable
ALTER TABLE `activity_logs` MODIFY `actorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `articles` MODIFY `authorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `media_assets` MODIFY `uploadedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

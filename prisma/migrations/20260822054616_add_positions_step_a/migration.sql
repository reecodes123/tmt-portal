-- DropIndex
DROP INDEX `board_members_tier_sortOrder_idx` ON `board_members`;

-- AlterTable
ALTER TABLE `board_members` ADD COLUMN `positionId` VARCHAR(191) NULL,
    MODIFY `position` VARCHAR(120) NULL,
    MODIFY `tier` ENUM('adviser', 'editor_in_chief', 'editorial_leadership', 'section_editor', 'assistant_editor', 'creatives', 'media', 'broadcast', 'technical', 'news_writer', 'feature_writer', 'sports_writer', 'copyreader', 'literary_writer', 'cartoonist', 'photojournalist', 'consultant', 'associate_editor', 'managing_editor') NULL;

-- CreateTable
CREATE TABLE `positions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `tier` ENUM('adviser', 'editor_in_chief', 'editorial_leadership', 'section_editor', 'assistant_editor', 'creatives', 'media', 'broadcast', 'technical', 'news_writer', 'feature_writer', 'sports_writer', 'copyreader', 'literary_writer', 'cartoonist', 'photojournalist', 'consultant', 'associate_editor', 'managing_editor') NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `positions_name_key`(`name`),
    INDEX `positions_tier_sortOrder_idx`(`tier`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `board_members_positionId_sortOrder_idx` ON `board_members`(`positionId`, `sortOrder`);

-- AddForeignKey
ALTER TABLE `board_members` ADD CONSTRAINT `board_members_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `positions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

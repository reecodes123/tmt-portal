-- DropForeignKey
ALTER TABLE `board_members` DROP FOREIGN KEY `board_members_positionId_fkey`;

-- AlterTable
ALTER TABLE `board_members` DROP COLUMN `position`,
    DROP COLUMN `tier`,
    MODIFY `positionId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `positions` MODIFY `tier` ENUM('adviser', 'editor_in_chief', 'editorial_leadership', 'section_editor', 'assistant_editor', 'creatives', 'media', 'broadcast', 'technical', 'news_writer', 'feature_writer', 'sports_writer', 'copyreader', 'literary_writer', 'cartoonist', 'photojournalist', 'consultant') NOT NULL;

-- AddForeignKey
ALTER TABLE `board_members` ADD CONSTRAINT `board_members_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

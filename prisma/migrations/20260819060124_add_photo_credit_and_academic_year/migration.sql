-- AlterTable
ALTER TABLE `articles` ADD COLUMN `photoCredit` VARCHAR(160) NULL;

-- AlterTable
ALTER TABLE `website_settings` ADD COLUMN `academicYear` VARCHAR(20) NOT NULL DEFAULT '2025–2026';

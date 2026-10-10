-- AlterTable
ALTER TABLE `users` ADD COLUMN `termsAcceptedVersion` INTEGER NULL;

-- CreateTable
CREATE TABLE `about_page` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `heroEyebrow` VARCHAR(120) NULL,
    `heroTitle` VARCHAR(120) NOT NULL,
    `heroSubtitle` TEXT NULL,
    `heroImageUrl` VARCHAR(500) NULL,
    `overview` LONGTEXT NOT NULL,
    `missionPillars` JSON NOT NULL,
    `achievements` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `terms_page` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `content` LONGTEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

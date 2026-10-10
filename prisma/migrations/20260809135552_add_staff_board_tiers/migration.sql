-- AlterTable
ALTER TABLE `board_members` MODIFY `tier` ENUM('consultant', 'editor_in_chief', 'associate_editor', 'managing_editor', 'section_editor', 'assistant_editor', 'creatives', 'media', 'broadcast', 'technical', 'news_writer', 'feature_writer', 'sports_writer', 'copyreader', 'literary_writer', 'cartoonist', 'photojournalist') NOT NULL;

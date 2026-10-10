# Repositories

All database access lives here. **API routes call repositories; they never call
Prisma directly.** This keeps query logic in one place, makes caching/logging
easy to add later, and keeps route handlers focused on HTTP concerns.

Each file replaces one of the prototype's Firebase service files:

| Prototype (deleted)              | Replaced by            |
| -------------------------------- | ---------------------- |
| `services/articlesService.ts`    | `articles.ts`          |
| `services/categoriesService.ts`  | `categories.ts`        |
| `services/usersService.ts`       | `users.ts`             |
| `services/mediaService.ts`       | `media.ts`             |
| `services/feedbackService.ts`    | `feedback.ts`          |
| `services/boardService.ts`       | `boardMembers.ts`      |
| `services/settingsService.ts`    | `settings.ts`          |
| `services/analyticsService.ts`   | `analytics.ts`         |
| `services/engagementService.ts`  | `articles.ts` (counters) |
| —                                | `activityLogs.ts` |
| —                                | `positions.ts` |
| —                                | `aboutPage.ts` |
| —                                | `termsPage.ts` |

## Current state

Fully implemented against Prisma/MySQL — no placeholders. Every function
does a real query; there is no fallback/seed-data mode to fall back on.

# Contributing

## Branch model

- `main` is deployable at all times.
- Feature work happens on branches: `feat/short-description`.
- Bug fixes: `fix/short-description`.
- Open a PR against `main`. Vercel provides a preview URL for review.

## Before you push

```bash
npm run lint
npm run typecheck
npm run build
```

All three should pass.

## Commit messages

Use the conventional-commits style — it makes changelogs and reviews easier:

- `feat: add scheduled publishing`
- `fix: correct role check on category delete`
- `refactor: extract ArticleTable`
- `docs: update setup guide`
- `chore: bump next to 15.2`

## Code review checklist

- Does every API route call `requireUser()` or `requireAdmin()` before
  touching data?
- Are new user-supplied fields validated with Zod?
- If a mutation is added, is it logged via `recordActivity()`?
- Are Server/Client Component boundaries correct? Server for data-heavy pages,
  Client only when interactivity requires it.
- Does anything under `src/server/` get imported from a `'use client'` file?
  That's a leak; fix it.

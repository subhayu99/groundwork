# first-principles-learning-platform

Interactive first-principles learning platform — starting with data structures and algorithms.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm run test
```

## Deployment

Deploys to Vercel automatically on push to `main` via GitHub Actions.

### One-time Vercel setup

1. Create a Vercel project linked to this repo.
2. Add the following secrets to the GitHub repo:
   - `VERCEL_TOKEN` — from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json` after `vercel link`

## Project structure

See `docs/superpowers/specs/2026-05-24-dsa-first-principles-design.md` for the design spec.
See `docs/superpowers/plans/` for implementation plans.

## Naming

The codebase uses `first-principles-learning-platform` as a placeholder name. Rename across the codebase when the final name is chosen:

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" -o -name "*.yml" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i '' 's/first-principles-learning-platform/REAL_NAME/g' {} +
```

# CI handover (E26 / L0.13) — manual apply

The automation token **lacks the `workflow` scope**, so agents cannot write into
`.github/workflows/`. The PR-level CI workflow is staged here for Subhayu to apply
himself.

## Apply `test.yml` (2 steps)

```bash
# 1. copy the staged workflow into place
cp docs/ci/test.yml .github/workflows/test.yml

# 2. commit + push it (any branch works; it activates once on the default branch)
git add .github/workflows/test.yml
git commit -m "ci: PR-level test workflow (typecheck + tests + build)"
git push
```

That's it. From then on every PR into `main` — and every push to a non-main
branch — runs `npx tsc --noEmit`, `npm run test`, and `npm run build` on Node 24.
(Until now CI only ran on push to `main` via `deploy.yml`, so PRs merged unverified
— this closes that gap.)

## While you're in there: bump `deploy.yml` Node 20 → 24

`.github/workflows/deploy.yml` still builds on Node 20 (EOL April 2026). One-line
change, same file-edit session:

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: "24"   # was "20"
          cache: "npm"
```

This also keeps deploy and test CI on the SAME Node major, so a build can't pass
PR CI and then behave differently on deploy.

## Notes

- `test.yml` uses `npm ci` (reproducible, lockfile-exact). `deploy.yml`
  historically used `npm install` because a macOS-generated lockfile once lacked
  Linux-only optional deps (Tailwind's oxide binary); the current lockfile carries
  the Linux entries, so `npm ci` is expected to work. If the install step ever
  fails on a platform-optional package, the drop-in fallback is commented inside
  `test.yml`.
- `main` pushes are deliberately excluded from `test.yml` — `deploy.yml` already
  tests+builds there; running both would double-spend minutes.
- Local `devDependencies` pin `@types/node: ^20`; that's types-only and fine on a
  Node 24 runtime — bump it whenever convenient, no urgency.

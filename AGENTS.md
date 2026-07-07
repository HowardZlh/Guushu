# Guushu — Agent Guidelines

## Git workflow (MANDATORY)

**Never commit or push directly to `main`.** All changes must go through a
short-lived feature branch and a Pull Request.

Follow this workflow for every code change:

1. **Sync first.** Before starting any work, update the local `main`:
   ```
   git checkout main
   git pull origin main
   ```
2. **Branch off the latest `main`.** Create a new branch for the change:
   ```
   git checkout -b <type>/<short-description>
   ```
   Use a descriptive prefix: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`,
   `test/`, `ci/`.
3. **Commit on the feature branch only.** Verify you are NOT on `main` before
   committing:
   ```
   git branch --show-current   # must NOT print "main"
   ```
4. **Push the feature branch** (never push to `main`):
   ```
   git push -u origin <branch-name>
   ```
5. **Open a Pull Request** targeting `main`:
   ```
   gh pr create --base main --head <branch-name> --fill
   ```
   Return the PR URL to the user.
6. **Merge only via PR.** Do not fast-forward or push merge commits to `main`
   locally. Merging happens through the PR (after review/checks).

### Hard rules

- Do **not** run `git commit` while on `main`.
- Do **not** run `git push origin main` (or any push that updates `main`).
- Do **not** force-push (`git push -f` / `--force`) to any shared branch.
- If asked to "commit" or "push" without a branch, first create a branch,
  then proceed via PR. Ask the user only if the intent is genuinely ambiguous.
- Keep each PR focused on a single logical change.

## Build & test

- Build the site: `python build.py` (output in `_site/`).
- L1 tests (pure JS, no build): `node test/run-all.js`
- L2/L3 tests (require a build first): `python build.py && node test/run-build.js`
- Regenerate snapshot baseline after intentional content changes:
  `UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"`

Run the relevant tests before opening a PR.

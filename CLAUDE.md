# Malasakit PMS

Practice Management System: Django backend (`backend/`), React + TypeScript + Vite frontend (`frontend/`), Android project (`android/`).

## Documentation rule (mandatory)

Every analysis, fix, enhancement or refactor must be recorded in `docs/development/`:

| File | Purpose |
|------|---------|
| [docs/development/CHANGELOG.md](docs/development/CHANGELOG.md) | Dated record of each change: what changed, why, files, tests, risks |
| [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) | Current stack, module map and architectural decisions |
| [docs/development/FEATURES.md](docs/development/FEATURES.md) | Current feature behavior and business rules, by feature area |
| `docs/development/features/<name>.md` | Deep-dive notes for complex workflows, linked from FEATURES.md |

### Workflow

1. **Before changing code:** read this file, the relevant FEATURES.md section (or feature file) and recent CHANGELOG entries. Check them against the code and flag any notes that are out of date.
2. **Analyze** the current implementation and propose the change.
3. **After approval:** implement in small, reviewable chunks.
4. **After implementing:** add a CHANGELOG entry using the template there, and update FEATURES.md / ARCHITECTURE.md in place.
5. **Before finishing:** tell the user which doc files were created or updated and summarize what changed in them.

Analysis-only tasks: record findings with status **Proposed** or **Pending**, never **Implemented**.

### Hard rules

- The codebase is the source of truth for current behavior. Notes record the reasoning, decisions and verified history.
- Never document unimplemented work as done.
- Never claim tests passed unless they were actually run; record the command and the real result.
- When a decision changes, update the existing note and mark the old behavior `Superseded (YYYY-MM-DD)`. Don't leave contradictory notes in different files.
- No credentials, API keys, passwords, `.env` values, patient information or other secrets in any note.

## UI conventions

- Show every time of day in **12-hour format with AM/PM** (for example `4:27 PM`), never 24-hour. Set `hour12: true` explicitly when formatting; the browser's default locale can give 24-hour times. Applies to screens, printouts, PDFs and emails.

## Checks

- Frontend: `npm run build` (runs `tsc -b` then `vite build`) and `npm run lint`, from `frontend/`.
- Backend: `python manage.py check` and `python manage.py makemigrations --check --dry-run`, from `backend/`.
- Backend tests: run **one app per command** (`python manage.py test apps.patients`); several apps in one command fail with a duplicate `tests` module error. `apps.clinical_templates` has one failing test (`test_print_note_displays_creator`) that also fails on a clean `HEAD`.
- Local dev uses a shared Redis cache that is **not namespaced by database**. When running a second backend against another database, set `REDIS_URL=` (empty) so it uses a local-memory cache and cannot read or pollute your dev cache.
- The `test_*.py`, `check_*.py` and `fix_*.py` files in the repo root, `backend/` and `frontend/` are ad-hoc scripts, not a maintained test suite. Don't present them as test coverage.

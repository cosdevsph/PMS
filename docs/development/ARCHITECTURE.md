# Architecture

Current architecture of Malasakit PMS. Only facts confirmed in the code go here. Last verified: 2026-10-20.

When something changes, update this file in place and add a CHANGELOG entry. Record significant decisions in the [Decisions](#decisions) log.

## Repository layout

| Path | Contents |
|------|----------|
| `backend/` | Django project (`config/`) and apps (`apps/`) |
| `frontend/` | React + TypeScript single-page app built with Vite |
| `android/` | Android project (Gradle Kotlin DSL) |
| `docs/development/` | Development notes (this folder) |

## Backend

**Stack** (pinned in `backend/requirements.txt`): Django 5.2.7, Django REST Framework 3.16.1, `rest_framework_simplejwt` (JWT auth with token blacklist), Celery 5.6.3 + django-celery-beat 2.9.0, Channels 4.3.2 + channels_redis 4.3.0, Daphne 4.2.1 / Uvicorn 0.30.6 / Gunicorn 23.0.0, PostgreSQL via psycopg2-binary 2.9.10, WeasyPrint 63.1 (PDF), WhiteNoise 6.11.0, Cloudinary 1.44.1, django-storages 1.14.6, boto3.

**Config entry points** (`backend/config/`):
- `settings.py` — all settings. Custom user model: `accounts.User`.
- `urls.py` — root URL routing.
- `asgi.py` / `wsgi.py` — server entry points (`ASGI_APPLICATION = 'config.asgi.application'`).
- `celery.py` — Celery app. `cron.py` — scheduled jobs.
- `storage.py` — `AutoMediaCloudinaryStorage`, the media storage used when `DEBUG` is off.
- `pagination.py` — shared DRF pagination.

**Environment-dependent behavior** (from `settings.py`):

| Concern | `DEBUG` on (local) | Production |
|---------|-------------------|------------|
| Database | PostgreSQL from `DB_*` env vars | `DATABASE_URL`, SSL required, `conn_max_age=0` (ASGI-safe), health checks and TCP keepalives |
| Channel layer | In-memory | Redis (`REDIS_URL`) |
| Media storage | Local filesystem (`backend/media`) | Cloudinary (`config.storage.AutoMediaCloudinaryStorage`) |
| Static files | WhiteNoise (compressed manifest) | WhiteNoise (compressed manifest) |

**Apps** (`backend/apps/`): accounts, appointments, billing, clinical_templates, clinics, common, contacts, gateway, integrations, inventory, letters, messages, notifications, outcomes, patients, records, reports, smsgateway, subscriptions, support.

### Security controls

As verified 2026-10-31. The open gaps and proposed fixes are in the CHANGELOG entry "Security controls checklist review" (2026-10-31, Proposed).

| Concern | Current implementation |
|---------|------------------------|
| Authentication | Email + password (`apps.accounts.backend.EmailBackend`), JWT via `rest_framework_simplejwt` with rotation and blacklist. No MFA; OTP only for Owner sign-up and password reset. Lockout: 5 failures per IP+email per 15 min, 50 per IP (`accounts/services/login_throttle_service.py`). |
| Passwords | Django default PBKDF2-SHA256; validators: min length 8, common, numeric, user-attribute similarity. Staff temporary passwords expire in 48 h with forced change. |
| Sessions | Access token 10 h, refresh token 7 days, both in `localStorage`. Inactivity logout (10 h) and close-browser logout are browser-side only (`hooks/useInactivityLogout.ts`, `store/auth.store.ts`). The store's `logout()` does not call `/auth/logout/`, so refresh tokens are not blacklisted on logout. |
| Authorization | `IsAuthenticated` default; permission groups (None/View/Edit per feature) and clinic/branch scoping in `accounts/utils/rbac.py`. Open gaps F5–F7 (see FEATURES.md, Roles & permissions). |
| Audit | Per-domain audit models: `ClinicalNoteAuditLog`, `InvoiceAuditLog`, `UserRoleChangeLog`, `PrivatePackageSessionAuditLog`, `PatientMergeLog`, `OutcomeAssessmentAuditLog`, plus notification logs. No login or record-view log (except outcome measures). |
| In transit | Production: SSL redirect, secure session/CSRF cookies, nosniff, `X_FRAME_OPTIONS=DENY`; database `ssl_require=True`. No HSTS. |
| At rest | Fernet field encryption (`apps/common/encryption.py`, key `FIELD_ENCRYPTION_KEY`, required in production) for clinical note content and outcome answers. Everything else relies on Render (PostgreSQL) and Cloudinary (files) disk encryption. Cloudinary uploads use the default public delivery type. |
| Backups / DR | Render-managed database backups and restore (owner-confirmed, not in code). Cloudinary files are outside Render backups. No written runbook. |

## Frontend

**Stack** (from `frontend/package.json`): React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7, TanStack React Query 5, Zustand 5, Axios, React Hook Form + Zod, Tiptap 3 (rich-text editor), Recharts, Leaflet, Konva, jsPDF / react-pdf.

**Structure** (`frontend/src/`):
- `app/` — `App.tsx`, `providers.tsx`, `router.tsx`.
- `features/<area>/` — feature modules: appointments, auth, billing, clinic-messages, clinic-setup, clinical-documentation, clinical-template, clinics, contacts, dashboard, landing, manage, notifications, patient-portal, patients, profile, records, reports, settings, setup, support.
- Shared: `components/`, `hooks/`, `lib/`, `services/`, `store/`, `types/`, `utils/`, `config/`, `events/`, `data/`.

**Dev and deploy:** `vite.config.ts` proxies API requests to `http://127.0.0.1:8000` in development. `vercel.json` rewrites every path to `index.html` (SPA routing on Vercel).

## Decisions

Architecture Decision Records, newest first. Each one: date, decision, context, alternatives considered, consequences, status (`Accepted` / `Superseded (YYYY-MM-DD)`).

### ADR-008: Outcome measures live in a separate `outcomes` app with immutable versioned definitions

**Status:** Accepted and implemented (2026-10-31); see the CHANGELOG entry of the same date for what differs from the first proposal.
**Decision:** Master definitions are version-controlled JSON loaded into immutable rows keyed by code and version. Each patient assessment stores the version, its answers (encrypted with `FieldEncryptor`), server-computed scores and a snapshot of the scoring rules, so editing a master never changes past results. Clinics enable or disable platform measures. Scoring runs on the server with a fixed set of methods; no formula text from JSON is executed. Chart annotations extend `ClinicalNote.chart_annotation_data` additively with an asset id, version and normalised coordinates.
**Context:** `records.OutcomeMeasure` holds only a free-text name and a score, with no definition, version or answers. Most standard instruments need a licence, so the library must be able to hold definitions that are not yet enabled.
**Alternatives considered:** extending `records.OutcomeMeasure` (no place for items or versions); storing definitions only in code (no clinic-level control).
**Consequences:** four new tables (`outcomes.0001`); the patient merge moves assessments (done); the legacy table stays but is now clinic-scoped. **Differences from the proposal:** no `DRAFT` status; chart markers are kept in the existing `doodle_data` list (no new `points` key, so no backend or note-reload changes); no region IDs. Visibility of a patient's assessments reuses the patients-list branch rule (`outcomes/services.py` `visible_patients`).

### ADR-007: A Branch Manager delegates only inside their clinics and their own level

**Date:** 2026-10-23 · **Status:** Accepted and implemented. No migration.

**Context.** Client feedback: only Owners and Branch Managers grant access; a clinic added to a user widens where they work, not what they may do; a Branch Manager delegates only within their clinics and their own role. Permission groups are one set per clinic group, not per clinic, and a Branch Manager could set any level and reach any user.

**Decision.** Keep the shared groups and enforce the limits where they are written: a ceiling (`ceiling_violations`) on every Branch Manager create / update, a copy lowered to the copier's level, and a "members fit" lock (`group_lock_reason`) that makes a group read-only for a Branch Manager when any member also works outside their clinics. `assign_user` and the staff list use one helper (`users_managed_by`) based on active assignments. Frontdesk and Finance get several clinics through the existing assignment rows (`work_branch_ids`), with the same scope rule as Practitioner schedules. A Branch Manager always manages the three groups; the Owner switch ("Permissions: Edit") is dropped.

**Alternatives considered.**
- *Groups owned per clinic or per Branch Manager:* rejected for now; it needs a data model change and a migration, and the lock plus Duplicate gives the same safety.
- *Keep the Owner switch and add only the ceiling:* rejected by the owner; the ceiling already prevents escalation.

**Consequences.** Every new place that lets a Branch Manager change access must apply `ceiling_violations` and the clinic scope helpers. A shared group can be changed only by the Owner or by copying it.

### ADR-006: A Practitioner's clinics are changed through one schedule write, and access follows active rows

**Date:** 2026-10-23 · **Status:** Accepted and implemented. No migration.

**Context.** A Practitioner works at several clinics through one `UserBranchAccess` row per clinic (the clinic's slice of the combined `duty_schedule`). Three separate write paths existed (user update, `assign_branch`, `update_branch_assignment`), the seat pre-checks counted per clinic while the seat counter counted people, and access helpers ignored `is_active`, so removing a clinic did not remove access.

**Decision.** The user update with the combined `duty_schedule` is the one path for changing a Practitioner's clinics (the Permissions panel and the Staff form both use it); the single-clinic endpoints stay but share the overlap check and re-sync the combined schedule. Seats are charged only when someone newly becomes a clinician. Access helpers use `get_assigned_branch_ids` (active rows plus managed clinics). A Branch Manager's write scope on a schedule is enforced by comparing the blocks outside their clinics with what is stored.

**Alternatives considered.**
- *A new endpoint for adding a clinic:* rejected; it would be a fourth path to keep consistent with validation and seat rules.
- *Count a seat per clinic:* rejected by the owner (one person in different places is one clinician).
- *Let a Branch Manager also move hours at other managers' clinics:* rejected; each manager controls only their clinics.

**Consequences.** Anything that asks "which clinics does this person work at" must use active rows (`get_assigned_branch_ids`), not all rows. The seat counter still reads all rows (an archived or inactive Practitioner still counts).

### ADR-005: A Branch Manager's clinics are flagged rows, and the database enforces one manager per clinic

**Date:** 2026-10-22 · **Status:** Accepted and implemented. **Not yet deployed:** `accounts.0026` and `0027` are unapplied on the development database.

**Context.** `UserBranchAccess` holds every kind of branch link: manager scope, practitioner schedules and plain assignments, and it drives seat counts and schedules. Treating all of a Branch Manager's rows as "clinics they manage" let a practitioner assignment count as management, and "one Branch Manager per clinic" was only checked on one save path with no database backing.

**Decision.** Add `is_managed` to `UserBranchAccess`; a Branch Manager manages exactly their managed rows, and any number of them is allowed. A partial unique constraint (`branch` where `is_managed`) enforces one manager per clinic, and a single helper produces the same message on every path (it names the current manager). The migration backfills existing manager rows and stops, changing nothing, if a clinic already has two. A Branch Manager's staff-management access is fixed in code (`BRANCH_MANAGER_ALWAYS_EDIT`) rather than left to a permission group, and the Owner group is hidden and locked because the Owner has no permission settings.

**Alternatives considered.**
- *A separate table of managed clinics:* rejected; it would duplicate rows that already exist and every reader of `branch_accesses` would need two sources.
- *A foreign key `Clinic.branch_manager`:* not chosen; it would move manager scope out of the table that every current reader already uses, while the flag is a smaller change that keeps one source of truth.
- *Let the permission group decide staff access:* rejected by the owner (Rule 2: always).

**Consequences.** Every place that reads "the clinics a Branch Manager manages" must use `get_managed_branch_ids()` / `get_managed_branches()`, not `branch_accesses`. Access-style checks that ask "which clinics may this user open" still use all rows. Production data with two managers on one clinic must be fixed before migrating.

### ADR-004: Role codes are OWNER and BRANCH_MANAGER; legacy codes are input aliases only

**Date:** 2026-10-22 · **Status:** Accepted and implemented. **Not yet deployed:** migrations `accounts.0025`, `support.0004` and `appointments.0023` are unapplied on the development database.

**Context.** The same two roles were called Admin / Administrator / Owner and Admin Assistant / Manager / Branch Manager in different places, and the stored codes (`ADMIN`, `ADMIN_ASSISTANT`, plus a duplicate `MANAGER` permission-group template) did not match what the owner calls them. The codes were used in about 180 places and stored in users, permission groups, the role-change audit log and support tickets.

**Decision.** One vocabulary everywhere: Owner (`OWNER`) and Branch Manager (`BRANCH_MANAGER`). Codes live in `accounts/roles.py` (backend) and `lib/roles.ts` (frontend). Data migrations convert users (`role`, `roles`), permission-group templates (the `MANAGER` and `ADMIN_ASSISTANT` templates are merged), the seeded group name "Admin Assistant", the audit log, support tickets and the appointment booking source `admin`; each has a reverse. Legacy codes are accepted as **input** (serializers, `User.save()`, role endpoints, and the frontend auth store for cached logins) so a tab or script from before the deploy keeps working, and are never returned. The frontend is deployed first. `manage.py report_role_codes` counts stored codes before and after.

**Alternatives considered.**
- *Labels only:* rejected; the database and API would keep saying ADMIN.
- *No aliases:* rejected; any open browser tab would break at deploy time.
- *Renaming API paths and the `unlimited_admins` field too:* deferred; no user-visible gain and it would break older frontends during the rollout.

**Consequences.** Four old checks compared against codes nobody held (support-feedback "see all", comment visibility, permanent case delete); the rename would have switched them on, so they were made explicitly inert (`FEEDBACK_ADMIN_ROLES`, `CASE_HARD_DELETE_ROLES`, both empty) and recorded as findings. Practitioner list cache keys moved to `practitioners_v2_*` so cached lists with old codes are not served. The aliases are to be removed in a later release. Legacy codes are also converted on **read** (`User.get_effective_roles()`, the user serializer output, and the frontend's response normalizer) so rows that have not been migrated yet still behave as Owner / Branch Manager; only database-level lookups need the migration.

### ADR-003: Other-branch Diary access is a per-user list plus a permission-group level

**Date:** 2026-10-22 · **Status:** Accepted and implemented. **Not yet deployed:** `accounts.0024` is unapplied on the development database.

**Context.** Managers were limited to their `UserBranchAccess` branches. The owner wanted a setting on the Permission Groups page to let Managers open other branches' Diary, with the Owner choosing which branches. `UserBranchAccess` also drives clinician seat counts, practitioner lists, schedules and the one-Manager-per-branch rule, and permission groups are shared by many users.

**Decision.** Two parts. The **level** (none / view / edit) is a new permission-group feature key, `diary_other_branches`. The **branches** are a new many-to-many `User.extra_diary_branches`, set only by the Owner and kept only for Managers. A helper (`get_diary_branch_ids(user, write)`) returns own branches plus the extra ones when the level allows (view for reads, edit for writes); only the Diary, Calendar notes and blocks use it. Patients, invoices and reports keep using the user's own branches, and booking reaches other-branch patients through a narrow lookup endpoint.

**Alternatives considered.**
- *Reuse `UserBranchAccess` with a flag:* rejected; it would change seat counts, schedules and the manager-per-branch rule.
- *A branch list on the permission group:* rejected; groups are shared, but the branches differ per Manager.
- *Full branch access (patients, invoices, reports):* rejected by the owner; too much data exposure for a Diary need.

**Consequences.** One additive migration. A branch granted this way is not a managed branch. Read and write lists differ, so any new Diary-like endpoint must use `DiaryBranchScopeMixin` or the helper. The Diary "View" level is read-only only for granted branches; own-branch read-only is not built (CHANGELOG F7).

### ADR-002: Subscriptions track a 12-month term; cancellation is scheduled for term end

**Date:** 2026-10-21 · **Status:** Accepted and implemented. **Not yet deployed:** `subscriptions.0004` and `0005` are unapplied on the development database.

**Context.** Plans carry a 12-month minimum commitment, but the code stored it without using it: each payment reset `start_date` and extended `end_date` by 30 or 365 days, so the term could not be known, and no cancellation existed. Public copy said "cancel anytime".

**Decision.** Add `term_start` and `term_end` to `Subscription`, set when a paid plan is activated and no term is running. Add a cancellation request that always resolves to `cancellation_effective_at = term_end`. When that date passes, the status becomes `CANCELLED` the next time the subscription is read (the same lazy approach as expiry). Requests, withdrawals and the effective moment are recorded in `SubscriptionEvent`. Prices stay in `plans.py`; the public site mirrors them in one frontend data file.

**Alternatives considered.**
- *Cancel at the end of the billing period:* rejected; for monthly payers it means month-to-month, which contradicts the 12-month term.
- *Immediate cancellation with a fee:* rejected by the owner; end of term, no refund.
- *Celery beat job to enforce cancellation:* deferred; lazy enforcement matches how expiry already works and needs no new infrastructure.
- *Fetch public prices from the API:* not possible without a login-free endpoint, so the mirror file is kept and documented.

**Consequences.** Two additive migrations. `start_date` keeps its old meaning (last payment) and must not be read as the term start. Existing paid subscriptions need `backfill_subscription_terms`. Renewal after the first term is not automated.

### ADR-001: Prepaid packages are patient-level Private Package Sessions

**Date:** 2026-10-20 · **Status:** Accepted and implemented (data model, service layer, API, Patient Profile UI, appointment assignment, covered billing, retirement of Case session limits, conversion command). **Not yet deployed:** migrations `patients.0042` and `0043` are unapplied on the development database. Transfers are not built (undecided).

**Context.** Prepaid packages currently exist as a mode of `PatientCase` (stored `completed_sessions` counter, `package_cost`, `package_invoice`), plus an unused `Service.is_package` flag. The balance belongs to one Case, is not visible at patient level, is consumed at booking, and has no controlled correction workflow. Details: [features/private-package-sessions.md §7](features/private-package-sessions.md).

**Decision.** Add a separate patient-level feature, **Private Package Sessions**. A package belongs to the patient, lists clinic services with quantities, has its own price and a single package invoice, and is used by appointments across any Case. Used sessions are derived from links to non-cancelled appointments; remaining sessions are computed, not stored. Changes are recorded in an audit log. It is managed from a new Patient Profile sidebar page and is never exposed in Online Booking. Clinic Services and Cases keep their clinical role; new Cases stop offering package options, and existing package Cases are kept.

**Alternatives considered.**
- *Keep packages on the Case and add a patient summary:* rejected; it shows balances at patient level but ownership stays with one Case, so it cannot cover appointments across Cases.
- *Revive `Service.is_package`:* rejected; it mixes the per-visit service catalogue with prepaid accounting and was already removed from the service form on purpose.
- *Reusable package-definition catalogue:* deferred; packages are negotiated individually, so each package stores its own services and price.

**Consequences.** Four new tables plus one nullable link column (additive; no existing table altered). Case session limits were retired as part of this decision (old columns and logs kept as history). Package visibility follows patient visibility.  Billing, appointment and booking code gain a package hook. Two session concepts coexist and must be labelled clearly: the Case's pre-approved session cap and the patient's prepaid package. Legacy package Cases and `Service.is_package` stay until separately retired.

**Open:** the meaning of "transfer sessions" (Q6) is undecided, so no transfer feature is part of this decision.

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

**Apps** (`backend/apps/`): accounts, appointments, billing, clinical_templates, clinics, common, contacts, gateway, integrations, inventory, letters, messages, notifications, patients, records, reports, smsgateway, subscriptions, support.

## Frontend

**Stack** (from `frontend/package.json`): React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7, TanStack React Query 5, Zustand 5, Axios, React Hook Form + Zod, Tiptap 3 (rich-text editor), Recharts, Leaflet, Konva, jsPDF / react-pdf.

**Structure** (`frontend/src/`):
- `app/` — `App.tsx`, `providers.tsx`, `router.tsx`.
- `features/<area>/` — feature modules: appointments, auth, billing, clinic-messages, clinic-setup, clinical-documentation, clinical-template, clinics, contacts, dashboard, landing, manage, notifications, patient-portal, patients, profile, records, reports, settings, setup, support.
- Shared: `components/`, `hooks/`, `lib/`, `services/`, `store/`, `types/`, `utils/`, `config/`, `events/`, `data/`.

**Dev and deploy:** `vite.config.ts` proxies API requests to `http://127.0.0.1:8000` in development. `vercel.json` rewrites every path to `index.html` (SPA routing on Vercel).

## Decisions

Architecture Decision Records, newest first. Each one: date, decision, context, alternatives considered, consequences, status (`Accepted` / `Superseded (YYYY-MM-DD)`).

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

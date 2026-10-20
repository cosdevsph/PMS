# Changelog

Newest entries first. Each entry records one completed task (or one analysis, marked Proposed/Pending).

**Status values:** `Implemented` (in the code and verified) · `Proposed` (analyzed, not built) · `Pending` (approved, not finished) · `Superseded (YYYY-MM-DD)` (replaced by a later entry; link to it).

Never put credentials, `.env` values or patient data in an entry.

---

## Entry template

Copy this block to the top of the entries list. Write "None" for sections that don't apply instead of deleting them.

```markdown
## YYYY-MM-DD — <Short title>

**Status:** Implemented | Proposed | Pending | Superseded (YYYY-MM-DD, see <entry>)
**Module / feature:** <e.g. Billing → Invoices>

**Original behavior:** <what happened before>
**Problem / requirement:** <bug report or requested change>
**Reason for the change:** <why this approach>

**Files modified:**
- `path/to/file` — <what changed>

**Frontend changes:** <components, pages, state, UI>
**Backend changes:** <models, views, serializers, tasks>
**Database / migrations:** <migration names, data changes, or None>
**API / data contract:** <endpoints, request/response fields added/removed/renamed, or None>

**Business rules & decisions:**
- <rule or decision, and why>

**Tests executed:**
- `<command>` → <actual result, e.g. "passed", "2 errors: ...">
- Manual: <steps taken and what was observed>

**Known limitations / unresolved issues:** <...>
**Regression risks:** <areas that could break and should be re-checked>
```

---

## Entries

## 2026-10-20 — Chunk 6 + 6b + hardening: Case session limits retired, conversion command, branch scoping, browser verification

**Status:** Implemented and tested. **Not deployed:** migrations `patients.0042` and `0043` are not applied to the development database (confirmed with `showmigrations` at the end of this work), and the conversion command has not been run on real data.
**Module / feature:** Private Package Sessions; Cases; Appointments; Letters; Patients. See [features/private-package-sessions.md](features/private-package-sessions.md).

**Original behavior:** Case session limits blocked bookings, were consumed at booking and by clinical notes, restored on cancel/delete, and managed through four Case endpoints and a Case-header UI. Package visibility did not follow patient visibility (the API was scoped to the whole clinic group).
**Problem / requirement:** Owner decisions (2026-10-20): remove the Case session limits (keep the data), convert existing package Cases to Private Package Sessions, render the `{{case.sessions.*}}` letter placeholders blank.
**Reason for the change:** Complete the approved design in ADR-001 so there is a single place where prepaid sessions are counted.

**Files modified (backend):**
- Retirement: `apps/appointments/views.py` (no consume/restore on create, update, cancel, delete), `apps/appointments/serializers.py` (booking block removed; limit fields return neutral values), `apps/patients/views.py` (portal confirm no longer consumes; the four session endpoints removed), `apps/patients/serializers.py` (limit/package fields read-only and neutral), `apps/clinical_templates/signals.py` (note save still completes the appointment, no session use), `apps/letters/services.py` (placeholders blank), `apps/patients/services/case_service.py` (**deleted**).
- Conversion: `apps/patients/services/package_conversion.py` (new), `apps/patients/management/commands/convert_package_cases.py` (new), `apps/patients/models.py` + `migrations/0043_private_package_source_case.py` (new nullable `source_case` link), `package_serializers.py` (exposes `source_case`).
- Scoping: `apps/patients/services/package_service.py` (`visible_branch_ids`), `apps/patients/package_views.py`.
- Tests: new `test_case_limit_retirement.py` (13), `test_package_case_conversion.py` (13); `test_private_package_api.py` now 41 (adds 8 branch-scoping tests incl. an equivalence check against `/api/patients/`); `test_pre_approved_sessions.py` trimmed to the 7 tests that still apply (the Case-cap tests were replaced by the retirement tests).

**Files modified (frontend):** `CaseModal.tsx`, `PatientCasesPage.tsx`, `patientCases.api.ts`, `AppointmentModal.tsx`, `AppointmentCaseResolution.tsx`, `AppointmentView.tsx`, `AddRecurringAppointments.tsx`, `Diary.tsx`, `Calendar.tsx`, `CaseManagementHeader.tsx` (session card and modals removed; the read-only legacy "Package Billing" card is kept), `WorkspaceRightPanel.tsx`, `ClinicalNoteFeedItem.tsx`, `WorkspaceDocumentsFeed.tsx`, `ClinicalNoteNavItem.tsx`, `HardDeleteCaseModal.tsx`, `EditorToolbar.tsx` (Sessions placeholder menu removed), `types/appointment.ts`, `types/patient.ts`, `AppointmentPrivatePackageCard.tsx` (dropdown wording). **Deleted (9):** `CaseDetailsPage`, `CaseSessionsTab`, `AddCaseSessionModal`, `RemoveCaseSessionModal`, `RemoveLimitModal`, `CaseSessionHistoryModal`, `SessionAllocationLimitModal`, `useSessionLimitValidation`, `ConfirmRecurringContinue` (none was imported elsewhere).

**Database / migrations:** `0043` adds one nullable foreign key (`private_package_sessions.source_case`). No Case column or log table is dropped.
**API / data contract:** `POST /patient-cases/{id}/add_sessions|remove_sessions|remove_limit|reset_allocation/` now return 404. Case limit/package fields are read-only; creating a Case with a limit or `PACKAGE` source is ignored. Appointment and Case payloads keep the old limit field names with neutral values. `GET .../session_logs/` is kept. Package visibility now follows the patient list rules (admin: all; manager: managed branches; others: assigned branches, else own branch), so a branch-restricted user gets 404 for packages of patients they cannot see.

**Business rules & decisions (as built):** see the feature file §3, §7, §8. Built-in choices not stated by the owner and awaiting confirmation: unassign is blocked once the appointment has an invoice; package visibility follows patient visibility; price 0 means no invoice.

**Tests executed** (from `backend/`, `virt` environment, throwaway test database unless stated):
- `manage.py test apps.patients` → **141 tests, OK** (7 + 9 + 15 + 41 + 27 + 16 + 13 + 13 across the eight package-related modules, checked individually). `apps.billing` → 6 OK. `apps.accounts` → 5 OK.
- `apps.clinical_templates` → 7 tests, **1 error** (`test_print_note_displays_creator`: `'ClinicalNote' object has no attribute 'template_name'`). **Pre-existing:** reproduced identically on a clean checkout of `HEAD` (temporary git worktree, removed afterwards).
- `manage.py makemigrations --check --dry-run` → No changes detected. `manage.py check` → no issues.
- Mutation checks (each reverted afterwards): restored-session arithmetic in the conversion (the first version of the test did **not** catch it; a test for a session restored by moving the appointment to another Case was added and then failed on the mutation); restore-on-cancel re-added (retirement test fails); branch filter removed (9 failures); earlier chunks' checks as recorded in their entries.
- Frontend: `npx tsc -b --force` → exit 0. `npx eslint` on the 6 new frontend files → 0 problems; every edited existing file has the same or fewer findings than at `HEAD` (compared file by file).
- **Real database, scratch only** (`pms_verify_pkg`, created and dropped by me; your development database was not touched): all migrations applied from scratch; `0043` and `0042` unapplied and re-applied (reversible); `convert_package_cases` dry run wrote nothing, `--apply` created the package, linked the invoice and left the Case untouched, and skipped an unlimited Case with its reason.
- **Browser, scratch stack** (isolated backend on :8001 and Vite on :5174, headless Chromium driven over the DevTools protocol; scratch database; Redis disabled for it): sign-in; the new page and empty state; adding a package with two services and a scheduled appointment (appointment booked and assigned, 1/2 used, invoice at the package price, created/modified-by shown); Edit History; editing quantity, title and price (invoice follows, history lists the changes); the appointment screen card (assign, "covered", locked once an invoice exists); the invoice editor (covered line ₱0, price locked) and saving it (database shows a ₱0 line); the Cases page and New Case form (no session fields; creating a Case works); the Diary renders without the old session badges; a Read-only user sees packages without Add/Edit. No console errors, uncaught exceptions or failed requests in those runs except where noted below.
- **Not verified:** the inline "new Case" form inside the full booking modal (only type-checked: the Diary drag opened the quick "new client" popover instead); the Finance role (it cannot open a patient profile at all, which predates this work); mobile layout; other browsers; production data.

**Incident during verification (resolved, please read):** the development stack on this machine uses a local Redis cache whose keys are not namespaced by database. My first scratch backend shared that Redis, so it read your cached `clinic_services_1` entry (the services dropdown showed your services, not my seeded ones) and may have written cache keys for clinic/user id 1. I stopped it, deleted the five cache-only keys that could have been affected (`practitioners_1_`, `practitioners_1_1`, `sub_active_1`, `clinic_branches_1_user_1`, `clinic_services_1`; they are caches and repopulate on demand), restarted the scratch backend with `REDIS_URL` empty (local-memory cache), and confirmed it then added no Redis keys. No database rows were read or written outside the scratch database.

**Known limitations / unresolved issues:** see [feature file §11](features/private-package-sessions.md). Notably: transfers (Q6) not built; use-before-paid (Q10) not enforced; D4 unconfirmed; legacy package Cases that cannot be converted need manual follow-up; the pre-existing problems listed there are unchanged.
**Regression risks:** Medium. This removes behavior many screens relied on: any clinic that used Case session caps (for example HMO approvals) no longer gets a booking block, counter or "Sessions Remaining" badge. Old numbers remain in the database but are no longer shown or updated. Letters that used the retired placeholders now print blanks. Unconverted legacy package Cases still use the master-invoice billing screen but no longer count sessions.

---

## 2026-10-20 — Chunks 4 + 5: Patient Profile page, appointment assignment, covered billing

**Status:** Implemented in code; **the frontend was type-checked and linted but NOT exercised in a browser**, and the chunk 2 migration is still not applied to any database.
**Module / feature:** Private Package Sessions: Patient Profile UI, Appointment screen, Billing. See [features/private-package-sessions.md](features/private-package-sessions.md).

**Original behavior:** No UI for packages. An appointment had no link to a package. Invoicing (single, generic and bulk) charged the service price for every appointment.
**Problem / requirement:** Owner's design: a "Private Package Sessions" sidebar page with a table, Add / Edit / Edit History; an Add modal (title, services with "add more", optional appointment per service with date, time and Case, price, notes); explicit (never automatic) assignment of new or existing appointments (D1); no double charge for covered appointments (R5).
**Reason for the change:** Complete the user-facing workflow on top of the chunk 3 API, and close the double-billing risk before packages are used.

**Files modified:**
- Frontend (new): `features/patients/privatePackages.api.ts`, `privatePackageHistory.ts`, `components/PrivatePackageModal.tsx`, `components/PrivatePackageHistoryModal.tsx`, `pages/PatientPrivatePackagesPage.tsx`, `features/appointments/components/AppointmentPrivatePackageCard.tsx`.
- Frontend (edited): `features/patients/PatientProfileLayout.tsx` (sidebar item "Private Package Sessions" after Invoices), `app/App.tsx` (route `/patients/:patientId/private-packages`), `features/appointments/components/AppointmentView.tsx` (renders the card), `features/billing/generateNewInvoice.tsx` (covered line prefilled at ₱0, price field locked), `types/appointment.ts` (`private_package_id`, `private_package_title`), `features/patients/patient.api.ts` and `components/MergePatientsModal.tsx` (merge preview shows Private Packages).
- Backend (edited): `apps/patients/services/package_service.py` (`get_usage`, `cover_service_line`, `COVERED_SUFFIX`), `apps/billing/views.py`, `apps/billing/bulk_invoice_service.py`, `apps/appointments/serializers.py`, `apps/appointments/views.py`.
- Tests (new): `apps/patients/test_private_package_billing.py` (16).

**Frontend changes:**
- The page lists packages with services (used / quantity per service), sessions remaining, price and payment state (from the package invoice), status, created-by and modified-by names, and the actions Add, Edit and Edit History. Buttons for Add / Edit are hidden for roles that cannot write (the backend is the real check).
- The Add modal follows the owner's field list. A service row can optionally schedule one appointment (date, time, practitioner, existing Case or "create a new Case"). The modal creates the package first, then books each appointment through the **existing** appointment API (so availability and conflict checks are unchanged) and assigns it with the new endpoint. This is not atomic: if an appointment cannot be booked or assigned, the package is kept and the error is shown naming the service.
- The appointment screen shows either "Covered by a Private Package Session" with "Remove from package", or (when the patient has an active package with a session left for the appointment's service) a dropdown with "Add to package". Nothing is preselected or applied automatically.
**Backend changes:**
- Appointments expose `private_package_id` and `private_package_title` (fetched with `select_related`, no extra query per appointment; tested).
- Billing: when an appointment is assigned to a package, `create_from_appointment` and the generic `POST /invoices/` create its service line at ₱0 with the suffix " (Covered by Private Package Session)", whatever price the client sent; extra lines (e.g. products) are kept and charged. If no sent line matches the service, a ₱0 covered line is added. Editing a covered line to a price above 0 through `/invoice-items/{id}/` is rejected. **Bulk invoicing now skips package-covered appointments** (it would otherwise bill the practitioner's consultation fee for every completed appointment without an invoice).
**Database / migrations:** None in these chunks.
**API / data contract:** Appointment payloads gain two read-only fields. `PATCH /api/invoice-items/{id}/` can now return 400 for a covered line. Bulk-invoice preview and run exclude covered appointments.

**Business rules & decisions (as built):**
- A covered appointment's service line is matched by service name (case-insensitive, optionally with a " (Covered…" suffix). A line the user renames to something else is treated as an extra and stays charged, next to an added ₱0 covered line; this is intentional staff control, not a loophole closed by the server.
- Failed invoice creation leaves the assignment and the package balance untouched (tested with a forced failure).
- Unassigning (and assigning) is blocked once the appointment has an invoice (Q13 / decision recorded in Chunk 3).

**Tests executed** (from `backend/`, `virt` environment, throwaway test database; from `frontend/`):
- `manage.py test apps.patients.test_private_package_billing` → 16 tests, OK. First run: 1 error and 1 failure, both in my tests (a generic-endpoint test that sent `inline_items`, and a badly designed query-count test); fixed in the tests only.
- Mutation checks: disabling the covered-pricing function made 6 of the 16 tests fail; removing the bulk-invoicing exclusion made the bulk test fail; both restored, 16 pass.
- `manage.py test apps.patients` → 114 tests, OK. `manage.py test apps.billing` → 6 tests, OK. `makemigrations --check --dry-run` → No changes detected. `manage.py check` → no issues.
- `npx tsc -b --force` → exit 0. `npx eslint` on the new files → 0 problems. (Existing files already have lint findings; they were not touched except for the small edits listed.)
- **Not run:** the app in a browser, the Add modal flow end to end, any frontend automated test (the project has none), `npm run build`.

**Known limitations / unresolved issues:**
- **Unrelated, pre-existing:** `POST /api/invoices/` crashes with `Invoice() got unexpected keyword arguments: 'inline_items'` when `inline_items` is sent (same code at `HEAD`; the UI defines `createInvoice` but does not call it). Not changed.
- Existing invoice-edit screens can still add priced lines; only the covered line itself is protected.
- The appointment card queries the patient's packages when an appointment is opened (cached under `['private-packages', patientId]`).
- Case session limits and legacy package Cases are unchanged so far (next chunks).
**Regression risks:** Billing: any appointment assigned to a package now bills differently (intended). Bulk invoicing silently skips covered appointments (intended; shown in the preview count). Lines whose description ends with the covered suffix cannot be repriced.

---

## 2026-10-20 — Chunk 3 (3a + 3b): Private Package Sessions service layer and API

**Status:** Implemented (backend only; no UI yet; the chunk 2 migration is still not applied to the development database)
**Module / feature:** Private Package Sessions (Patients), backend. See [features/private-package-sessions.md](features/private-package-sessions.md).

**Original behavior:** The chunk 2 tables existed but nothing could create or use them.
**Problem / requirement:** Create, edit and audit packages (with one package invoice); explicitly assign existing appointments to a package and undo it (D1); role rules (D3); safe under concurrent requests.
**Reason for the change:** Backend foundation for the Patient Profile page and the appointment screen. Business rules sit in one service module so views stay thin.

**Files modified:**
- `backend/apps/patients/services/package_service.py` — new: `create_package`, `update_package`, `assign_appointment`, `unassign_appointment`, scoping helper `clinic_group_ids`, `with_balances` (annotated list query), package-invoice helpers.
- `backend/apps/patients/package_serializers.py` — new: read serializer (items with used/remaining, totals, invoice summary, created-by / modified-by names), write shape check, audit log serializer.
- `backend/apps/patients/package_views.py` — new: `PrivatePackageSessionViewSet`.
- `backend/apps/patients/urls.py` — registers `private-packages`.
- `backend/apps/patients/services/merge_service.py` — a merged-away patient's packages move to the primary patient; the merge preview reports `private_packages`.
- Tests (new): `test_private_package_api.py` (34), `test_private_package_assignment.py` (27).

**Frontend changes:** None
**Database / migrations:** None in this chunk.
**API / data contract (new):**
- `GET /api/private-packages/?patient=&status=` (paginated list with total / used / remaining), `GET .../{id}/`, `POST /api/private-packages/`, `PATCH .../{id}/` (title, price, notes, status, `items` as the full replacement list), `GET .../{id}/history/`.
- `POST .../{id}/assign-appointment/` and `POST .../{id}/unassign-appointment/` with `{appointment, reason?}`.
- No `PUT` and no `DELETE` (405): a package is cancelled by setting `status=CANCELLED`.
- Note: assignment lives on the package resource, not on `/appointments/{id}/` as first sketched; the appointment payload will expose the assigned package in a later chunk.

**Business rules & decisions (as built):**
- Write access: roles `ADMIN`, `ADMIN_ASSISTANT`, `STAFF`, `PRACTITIONER` (D3); `FINANCE` and `READ_ONLY` get 403 on writes but can read (read needs the `patients` view permission). Scope is the user's clinic group (main clinic and branches), as for Cases.
- Create validates patient (in the clinic group, not archived/merged/deleted), services (in the group, active, not deleted, no duplicates, quantity ≥ 1), title, price ≥ 0. It creates the package, items, a `CREATED` audit entry and **one draft invoice at the package price** with one line "Package: {title}" using the existing `Invoice` / `InvoiceItem` code and versioning. A package with price 0 gets no invoice. Creating a package creates no appointment and uses no session.
- Edit: audit entries record who and what; a price change updates the invoice line and adds an invoice version **only if the invoice has no payments**; with payments the edit is rejected (and fully rolled back) with a message to adjust through the invoice. A title change on a paid invoice leaves the invoice untouched. A quantity cannot go below the sessions in use and a service with sessions in use cannot be removed. Status changes are audited separately.
- Assign (always explicit, never automatic): requires the same patient, an `ACTIVE` package, a non-cancelled and non-deleted appointment, no existing assignment, **no active invoice on the appointment (Q13)**, and the appointment's service in the package with a session left. Completed, no-show and DNA appointments may be assigned (Q15). The appointment's Case is never changed.
- Unassign returns the session and is audited (Q15). **Decision made while building, not stated by the owner:** unassigning is also blocked once the appointment has an active invoice, so an invoice that already reflects the package is not silently contradicted. Please confirm or change.
- Concurrency: package edits and assignments lock the package row (`select_for_update`); the one-to-one constraint on the appointment is a second guard.
- The package invoice (unpaid) will appear in the patient's "previous outstanding balances" list like any unpaid invoice with no Case (accepted default).

**Tests executed** (from `backend/`, `virt` environment, throwaway test database):
- `manage.py test apps.patients.test_private_package_api` → 34 tests, OK (first run: 5 errors in my tests — a reused email address and an over-strict query-count assertion — fixed in the tests only).
- `manage.py test apps.patients.test_private_package_assignment` → 27 tests, OK, including two real concurrent-thread tests.
- Mutation checks: removing the transaction from `update_package` made the "price change with payments is rolled back" test fail; removing the row lock from `assign_appointment` made the last-session race test fail in 3 of 3 runs. Both files were restored and the tests passed again. (The same-appointment race still passes without the lock because of the database constraint.)
- `manage.py test apps.patients` → 98 tests, OK. `manage.py test apps.billing` → 6 tests, OK. `makemigrations --check --dry-run` → No changes detected. `manage.py check` → no issues.
- Not run: the frontend, applying migration `0042`, manual API calls against a running server, load testing.

**Known limitations / unresolved issues:**
- Read access is by clinic group only (as for Cases); there is no per-branch restriction for practitioners.
- Appointment creation from the Add modal is not an API feature: the UI will use the existing appointment API, then call assign-appointment (not atomic across the two calls).
- The appointment serializer does not yet show the assigned package; the invoice for a covered appointment is not yet priced at ₱0 (chunk 5).
- Case session limits are still enforced until the removal chunk.
**Regression risks:** Low for existing features: the only edits to existing files are the route registration and the patient-merge transfer (a merge now also moves packages).

---

## 2026-10-20 — Chunk 2: Private Package Sessions data model

**Status:** Implemented (models and migration file only; **the migration has not been applied to the development or any other database**, and nothing reads or writes the new tables yet)
**Module / feature:** Private Package Sessions (Patients), backend. See [features/private-package-sessions.md §4](features/private-package-sessions.md).

**Original behavior:** No patient-level package tables. Packages existed only as a mode of `PatientCase`.
**Problem / requirement:** Approved design (ADR-001): a package owned by the patient, listing services with quantities, with remaining sessions computed and an audit trail.
**Reason for the change:** Foundation for the service layer, API and UI in later chunks. Kept additive so existing Cases, appointments and invoices are untouched.

**Files modified:**
- `backend/apps/patients/models.py` — appended `PrivatePackageSession`, `PrivatePackageSessionItem`, `PrivatePackageSessionUsage`, `PrivatePackageSessionAuditLog` and the helper `_counted_usages`.
- `backend/apps/patients/migrations/0042_private_package_sessions.py` — new, auto-generated; depends on `patients.0041` plus existing `appointments`, `billing`, `clinic_services`, `clinics` migrations.
- `backend/apps/patients/test_private_package_models.py` — new, 15 tests.

**Frontend changes:** None
**Backend changes:** Models only; no views, serializers, URLs, permissions or billing code.
**Database / migrations:** `0042` creates four tables (`private_package_sessions`, `private_package_session_items`, `private_package_session_usages`, `private_package_session_audit_logs`), two indexes and these constraints: `price >= 0`; unique `(package, service)`; `quantity >= 1`. `sqlmigrate` shows only `CREATE TABLE`, `CREATE INDEX` and `ADD CONSTRAINT` statements; no existing table is altered or dropped. Not applied to any database yet. Running it backwards was not tested.
**API / data contract:** None.

**Business rules & decisions (as built):**
- A session counts as used only while its appointment exists, is not soft-deleted and is not `CANCELLED`. So a cancellation or deletion returns the session and a `NO_SHOW` / `DNA` stays used (R6). Remaining sessions are computed (`total_sessions`, `used_sessions`, `remaining_sessions` on the package; `used`, `remaining` on an item) and never stored. `remaining_sessions` is intentionally not clamped at zero, so inconsistent data stays visible.
- One appointment can use at most one session (one-to-one on `appointment`). Usage rows are only ever created by an explicit assignment (D1); creating an appointment creates none (tested).
- Delete behavior: patient, branch and service are `PROTECT` (a patient or service in a package cannot be hard-deleted); the usage `item` is `PROTECT`; the appointment link is `SET_NULL`, so hard-deleting an appointment keeps the usage row as history while returning the session.
- Differences from the earlier proposal: the audit action list is `CREATED`, `UPDATED`, `STATUS_CHANGED`, `APPOINTMENT_ASSIGNED`, `APPOINTMENT_UNASSIGNED` (item edits are recorded as `UPDATED` with field changes); the package has no soft-delete (status `CANCELLED` is used instead); `Usage` has no `package` column (it is reached through `item`).

**Tests executed** (from `backend/`, project `virt` environment, throwaway test database):
- `manage.py test apps.patients.test_private_package_models` → 15 tests, OK (balances for scheduled / cancelled / no-show / DNA / soft-deleted / hard-deleted appointments, isolation between packages, the three constraints, protected deletes, audit log).
- Mutation check: with the "counts as used" rule temporarily broken, 3 tests failed (cancelled, soft-deleted, hard-deleted returns); the file was restored and all 15 passed again.
- `manage.py test apps.patients` → 37 tests (13 existing + 9 from chunk 1 + 15 new), OK.
- `manage.py test apps.billing` → 6 tests, OK.
- `manage.py makemigrations --check --dry-run` → No changes detected. `manage.py check` → no issues.
- Not run: applying `0042` to a real database, the frontend, and `apps.appointments` (no tests exist).

**Known limitations / unresolved issues:**
- The development database still shows `0042` as unapplied until someone runs `manage.py migrate`; production deployment must run it too.
- Patient merge (`patients/services/merge_service.py`) does not yet move packages from the merged-away patient to the primary patient; it must be updated before packages are created (planned for chunk 3).
- `used`/`remaining` run one query each; list screens will need annotated queries (chunk 3).
- Role checks, audit writing, invoice creation and assignment validation are not implemented yet.
**Regression risks:** Low. Additive tables only; no existing model, view or serializer changed. The only existing-table interaction is that the new foreign keys (`PROTECT`) can block hard-deleting a patient or service that belongs to a package.

---

## 2026-10-20 — Chunk 1: Online Booking accepts only public services

**Status:** Implemented
**Module / feature:** Online Booking (patient portal), backend. Part of the Private Package Sessions roadmap ([features/private-package-sessions.md §8](features/private-package-sessions.md)).

**Original behavior:** The public portal listing and the available-slots view only offered services that are active, `show_in_portal`, not deleted and not `is_package`, owned by the clinic's main clinic. The booking submit endpoint (`POST /api/public/portal/{token}/book/`) did not apply that rule: `PortalBookingCreateSerializer.validate_service` checked only `is_active`, and the clinic check in `validate` was a `pass`. A crafted request could therefore book a hidden, legacy-package, soft-deleted or other-clinic service. The public practitioner payload also listed every active service linked to a practitioner, including hidden and package ones.
**Problem / requirement:** Client requirement: package sessions must not be publicly bookable, and a hidden listing alone is not enough if the endpoint accepts the booking.
**Reason for the change:** One shared rule for what the public can book, used by the listing, the practitioner service list and the booking validation so those three cannot disagree. `PublicAvailableSlotsView` (`patients/views.py`) still has its own inline copy of the same filters and was not changed.

**Files modified:**
- `backend/apps/patients/serializers.py`
  - New helper `public_portal_services(main_clinic)`: the single definition of publicly bookable services (same filters as before).
  - `PortalLinkPublicSerializer.get_categories` now uses the helper (behavior unchanged).
  - `PortalBookingCreateSerializer.validate` now rejects a service that is not in `public_portal_services(portal_link.clinic.main_clinic)` with `{"service": "This service is not available for online booking."}`. A booking with no service is still allowed, as before.
  - `PortalPractitionerSerializer.get_services` and the prefetch in `PortalLinkPublicSerializer.get_practitioners` now list only `is_active`, `show_in_portal`, not deleted, not `is_package` services.
- `backend/apps/patients/test_portal_booking_restrictions.py` — new, 9 tests.

**Frontend changes:** None
**Backend changes:** As above.
**Database / migrations:** None. `makemigrations --check --dry-run` reported "No changes detected".
**API / data contract:** `POST /api/public/portal/{token}/book/` returns HTTP 400 with a `service` error for non-public services (previously accepted). `GET /api/public/portal/{token}/` no longer includes hidden or package services under `practitioners[].services`. No fields added or removed.

**Business rules & decisions:**
- Public bookability = active, shown in portal, not deleted, not a legacy package, and owned by the portal's main clinic (a branch portal uses its main clinic's services, as the listing already did).
- This chunk does not depend on the pending defaults D1–D4.

**Tests executed** (from `backend/`, using the project's `virt` environment and the local test database):
- Baseline before any edit: `manage.py test apps.patients` → 13 tests, OK.
- `manage.py test apps.patients.test_portal_booking_restrictions` → 9 tests, OK. The first run had one error caused by my test setup (practitioner not linked to a branch); it was fixed in the test only.
- With the serializer change temporarily reverted, the same 9 tests gave 5 failures (hidden, legacy package, soft-deleted, other-clinic service accepted; hidden services listed under practitioners), then the change was restored. This shows the tests detect the original gap. The inactive-service test passed either way, because that case was already rejected.
- `manage.py test apps.patients` → 22 tests (13 existing + 9 new), OK.
- `manage.py test apps.billing` → 6 tests, OK.
- `manage.py test apps.appointments` → 0 tests (its `tests.py` has none).
- Running several apps in one command (`apps.patients apps.appointments apps.billing`) fails with an `ImportError` about duplicate `tests` modules. This is a test-discovery limitation of the repository, not caused by this change; run apps one at a time.
- `manage.py makemigrations --check --dry-run` → No changes detected.
- Not run: the frontend (no frontend files changed) and a manual run through the browser.

**Known limitations / unresolved issues:**
- During the booking tests the confirmation email logs `Missing staticfiles manifest entry for 'logo/malasakit-logo.png'`. It is caught and the booking still succeeds; it comes from the email template in the test environment and was not investigated.
- Portal confirmation still attaches the patient's latest open Case and consumes its session (`_confirm_portal_booking`). Not changed here; it belongs to later chunks.
- `Service.is_package` is unchanged; removing it waits for a later chunk.
**Regression risks:** A clinic that offers a public service owned by a branch (not the main clinic) would now get a 400 on booking. Such a service was already missing from the public listing and the slots view, so no working flow is expected to depend on it. Not checked against production data.

---

## 2026-10-20 — Prepaid packages: analysis and approved design

**Status:** Proposed (design approved by the product owner; **no code written yet**)
**Module / feature:** Private Package Sessions (Patients, Appointments, Billing, Online Booking)

**Original behavior:** Prepaid packages are modelled as a mode of a Case (`PatientCase.session_source='PACKAGE'`, `package_cost`, `package_invoice`), with leftovers of a removed service-level option (`Service.is_package`). Details and file references: [features/private-package-sessions.md §7](features/private-package-sessions.md).
**Problem / requirement:** The client requires packages that are hidden from Online Booking, tracked on the patient profile, applied before a new charge, and adjustable by staff. A Case-owned counter cannot be used across Cases, has no patient-level view, and has no controlled correction workflow.
**Reason for the change:** Product owner proposal, 2026-10-20: add a separate patient-level **Private Package Sessions** feature, arranged onsite with the practitioner, instead of making a Case, appointment or clinic service a package. See [ADR-001](ARCHITECTURE.md#adr-001-prepaid-packages-are-patient-level-private-package-sessions).

**Files modified:** Documentation only.
- `docs/development/CHANGELOG.md` — this entry.
- `docs/development/ARCHITECTURE.md` — ADR-001.
- `docs/development/FEATURES.md` — index row for Private Package Sessions.
- `docs/development/features/private-package-sessions.md` — new; business rules, proposed data model, open decisions, verified current behavior, roadmap.

**Frontend changes:** None
**Backend changes:** None
**Database / migrations:** None
**API / data contract:** None

**Business rules & decisions:** Recorded in the feature file (R1–R11). Summary: one session = one appointment; a package covers several services by quantity; the package price overrides service prices; one package invoice with no per-visit charge; cancellation returns a session, no-show counts as used; existing package Cases are kept, new ones lose the package options; transfers are not defined yet.

**Decision update, 2026-10-20 (still Proposed):** The original default D1 (auto-link an appointment to a matching package) was **rejected by the product owner and is superseded**. D1 is now **manual assignment**: no automatic linking or consumption; an authorized user assigns an existing package to a new or existing appointment, with validation and an audit entry. Details in [features/private-package-sessions.md §3](features/private-package-sessions.md). The implementation proposal for D1 is awaiting approval; no code was written. Open points it raised: Q13 (appointment that already has an invoice), Q14 (D2 versus leaving the Case counter untouched), Q15 (allowed statuses, undo).

**Further decisions, 2026-10-20 (still Proposed; no code written):** Case session limits are to be **removed** (R12): stop using and keep the old data as history, convert existing package Cases to Private Package Sessions after a data check and owner review, letter placeholders render blank (Q16). An appointment that already has an invoice cannot be assigned to a package (Q13); any non-cancelled appointment can be assigned and the assignment can be undone (Q15). Owner (`ADMIN`), Manager (`ADMIN_ASSISTANT`), Staff and Practitioner can create and edit packages (D3). D2 is superseded by R12. The earlier "keep existing package Cases working" decision (R10) is superseded. Transfer meaning (Q6) is still undecided.

**Tests executed:** None (documentation only). The "current behavior" findings come from reading the code on 2026-10-20; none were verified by running it.

**Known limitations / unresolved issues:**
- Transfer meaning (Q6) and paid-before-use (Q10) are open. D4 (portal bookings are not auto-linked) was not explicitly confirmed.
- Production counts of legacy package services and package Cases are unknown.
- Gaps found in the existing code and **not yet fixed**: Case session actions have no role check; a clinical-note signal can consume a session outside `consume_case_session`. (The public booking submit gap was fixed in the "Chunk 1" entry above.)
**Regression risks:** None (no code changed).

---

## 2026-10-20 — Documentation structure established

**Status:** Implemented
**Module / feature:** Project documentation

**Original behavior:** No project documentation. The root `README.md` was empty, `frontend/README.md` was the stock Vite template, and commit messages (e.g. "New Update", "Malasakit v3.8") didn't record what changed or why.
**Problem / requirement:** The project owner required every analysis and code change to be documented in Markdown so knowledge carries across sessions and regressions are easier to avoid.
**Reason for the change:** A small, verified starting point that grows with each task, rather than a large up-front audit that could contain unverified claims.

**Files modified:**
- `CLAUDE.md` — new; the documentation rule, workflow and check commands (loaded automatically in Claude Code sessions).
- `docs/development/CHANGELOG.md` — new; this file and the entry template.
- `docs/development/ARCHITECTURE.md` — new; verified stack and module map, empty decisions log.
- `docs/development/FEATURES.md` — new; index of feature areas, all marked "Not yet documented".

**Frontend changes:** None
**Backend changes:** None
**Database / migrations:** None
**API / data contract:** None

**Business rules & decisions:**
- Docs live in `docs/development/`. Complex workflows get their own file under `docs/development/features/`.
- FEATURES.md sections are filled in the first time a task touches that feature, after reading the code.

**Tests executed:**
- None (documentation only). Facts in ARCHITECTURE.md were checked against `backend/requirements.txt`, `frontend/package.json`, `backend/config/settings.py` and the directory layout on 2026-10-20.

**Known limitations / unresolved issues:** Feature behavior and business rules are not documented yet. `README.md` is still empty.
**Regression risks:** None (no code changed).

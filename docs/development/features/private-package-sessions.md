# Private Package Sessions

**Status (2026-10-20):** Implemented in code and tested, **not yet deployed anywhere**. The two migrations (`patients.0042`, `patients.0043`) are not applied to the development database, and the conversion of old package Cases has not been run on real data. Transfers are not built (undecided). See §11 for what is open or unverified.
**Related:** [ADR-001](../ARCHITECTURE.md#adr-001-prepaid-packages-are-patient-level-private-package-sessions) · [CHANGELOG](../CHANGELOG.md) (entries "Chunk 1" to "Chunk 6")

## 1. Business context

A patient discusses a prepaid package with a practitioner during an onsite visit. The package covers a number of sessions across one or more clinic services and may span several Cases. It is negotiated personally: it is **never** offered or bookable through Online Booking.

Client requirements this satisfies:
1. Package sessions are hidden from Online Booking.
2. Package sessions are tracked on the patient profile, not only on the Case page.
3. Remaining prepaid sessions are applied before a new charge is generated, **by explicit assignment** (see D1).
4. Authorized staff can correct assignments. **Transfers are not built** because their meaning is undecided (Q6).

## 2. Business rules

Decided by the product owner on 2026-10-20.

| # | Rule |
|---|------|
| R1 | A **session** is one appointment of a patient (e.g. an Initial Consultation is 1 session). |
| R2 | A package can cover **different services**. Each service row has a **quantity**; total sessions = sum of quantities (e.g. Physio × 8 + Initial Consultation × 2 = 10). |
| R3 | A package belongs to the **patient**. It can be used across multiple Cases and is not tied to one Case. |
| R4 | The **package price overrides** the individual service prices. |
| R5 | **One package invoice** at the package price is created with the package. Payments use the existing Payment flow. Appointments assigned to the package carry **no service charge** ("Covered by Private Package Session"). Extra items (e.g. products) are billed normally. |
| R6 | A **cancelled** appointment returns its session to the package. A **No-show / DNA** counts as used. |
| R7 | Managed from a **"Private Package Sessions"** item in the Patient Profile sidebar: a table of the patient's packages with **Add**, **Edit** and **Edit History** (audit log showing *Created by* / *Modified by*). |
| R8 | The Add modal has: title; Clinic Service rows (with "Add more services"; each row can schedule one appointment with date, time, practitioner and an existing or new Case); package price; notes. Appointments scheduled from the modal are an explicit act by the practitioner, consistent with D1. |
| R9 | Clinic Services (model and form) keep their behavior. |
| R10 | ~~Case package options hidden for new Cases; old package Cases kept; no migration.~~ **Superseded by R12 / Q16.** |
| R11 | Remaining sessions are **computed**, never stored as an editable number. |
| R12 | **Case session limits are removed**; session counting lives in Private Package Sessions. Implemented as "stop using, keep the old data as history" (Q16). |

## 3. Decisions

### D1: Manual assignment (decided 2026-10-20)

~~**D1 (original): auto-apply** a matching package to new appointments.~~ **Rejected and superseded.** Current D1, as built:
1. **No automatic assignment.** Creating an appointment never links it, or its Case, to a package and never uses a session. *(Tested for internal booking and Online Booking; recurring booking was not separately tested.)*
2. **Practitioner-controlled.** An authorized user explicitly assigns an appointment to a package.
3. **Existing appointments can be assigned** from the appointment screen, without creating a new one.
4. **Validated before saving:** same patient; package ACTIVE; appointment not cancelled or deleted; not already assigned to any package; the appointment's service is in the package with a session left; **no active invoice on the appointment (Q13)**.
5. **A session is used only on that explicit assignment.**
6. **Cases are never associated, detached or changed** by an assignment.

### Other decisions

| # | Decision |
|---|----------|
| D2 | ~~Covered appointments don't count against the Case cap.~~ Superseded by R12 (no Case cap exists). |
| D3 | **Owner, Manager, Staff and Practitioner can create and edit packages and assign appointments.** Mapped to roles `ADMIN`, `ADMIN_ASSISTANT`, `STAFF`, `PRACTITIONER` (there is no separate "Owner" role). Finance and Read-only users cannot write. The check uses this role list, not the `client_cases` permission (Staff has only `view` there). |
| D4 | Online-portal bookings are not auto-linked to a package (follows from D1). *Not explicitly confirmed by the owner.* |
| Q13 | An appointment that already has an invoice can no longer be added to a package. |
| Q15 | Any non-cancelled appointment can be assigned (completed and no-show/DNA included); assignment can be undone, with an audit entry. |
| Q16 | Case session limits: stop using, keep the data; existing package Cases are converted (after a data check and owner review); `{{case.sessions.*}}` letter placeholders render blank. |
| Built-in choice (not owner-stated) | **Unassigning is also blocked once the appointment has an active invoice**, so an invoice that already reflects the package is never silently contradicted. *Awaiting owner confirmation.* |
| Built-in choice (not owner-stated) | **Visibility follows the patient:** a package is visible exactly when its patient is, using the same rule as the patient list (admin: whole clinic group; manager: managed branches; others: assigned branches, else their own branch). Verified by a test that compares against the real `/api/patients/` list. |
| Built-in choice (not owner-stated) | A package with price 0 gets no invoice. A price change is applied to the invoice only while it has no payments; otherwise it is rejected. |

## 4. Data model (as built)

Migrations `patients/0042_private_package_sessions.py` and `0043_private_package_source_case.py`. Additive; no existing table changed.

- `PrivatePackageSession`: `patient` (PROTECT), `clinic` (branch), `title`, `price` (≥ 0), `notes`, `status` (ACTIVE / COMPLETED / CANCELLED), `invoice` (SET_NULL), `source_case` (SET_NULL; set only for packages converted from a legacy Case), `created_by`, `modified_by`, timestamps.
- `PrivatePackageSessionItem`: `package`, `service` (PROTECT), `quantity` (≥ 1); unique per `(package, service)`.
- `PrivatePackageSessionUsage`: `item` (PROTECT), `appointment` **one-to-one, SET_NULL**, `created_by`. Created only by an explicit assignment (or by the one-time conversion).
- `PrivatePackageSessionAuditLog`: `package`, `user`, `action` (CREATED, UPDATED, STATUS_CHANGED, APPOINTMENT_ASSIGNED, APPOINTMENT_UNASSIGNED), `appointment`, `changes` JSON, `reason`.
- **Balances are computed**: a session counts as used while its appointment exists, is not soft-deleted and is not CANCELLED. Cancelling or deleting returns the session; NO_SHOW / DNA stays used.
- **Concurrency:** package edits and assignments lock the package row (`select_for_update`); the one-to-one on the appointment is a second guard. A patient or service that belongs to a package cannot be hard-deleted.
- Patient merge moves packages to the primary patient (`merge_service.py`) and the merge preview reports them.

## 5. API (as built)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/private-packages/?patient=&status=` | List with total / used / remaining (annotated; query count does not grow with the number of packages) |
| `POST /api/private-packages/` | Create package + items + audit entry + package invoice (price > 0) |
| `GET /api/private-packages/{id}/` | Detail |
| `PATCH /api/private-packages/{id}/` | Edit title, price, notes, status, and `items` (full replacement list) |
| `GET /api/private-packages/{id}/history/` | Audit log |
| `POST .../{id}/assign-appointment/` `{appointment, reason?}` | Explicit assignment |
| `POST .../{id}/unassign-appointment/` `{appointment, reason?}` | Undo an assignment |

No `PUT` and no `DELETE` (packages are cancelled, not deleted). Writes need one of the D3 roles; reads need the `patients` view permission and visibility of the patient. Edit rules: a quantity cannot go below the sessions in use; a service with sessions in use cannot be removed. Appointment payloads also expose `private_package_id` and `private_package_title`.

## 6. Billing (as built)

- Package invoice: one draft invoice at the package price with one line "Package: {title}", created through the existing `Invoice` / `InvoiceItem` code and versioning.
- **Covered appointments:** when an appointment is assigned to a package, `create_from_appointment` and the generic `POST /invoices/` create its service line at **₱0** with the suffix " (Covered by Private Package Session)", whatever price the client sent. Extra lines are kept and charged; a covered line is added if none matches the service. A covered line cannot be edited to a price above 0 through `/invoice-items/{id}/`. The invoice screen prefills the line and locks its price.
- **Bulk invoicing skips package-covered appointments** (it would otherwise bill the practitioner's consultation fee for them).
- A failed invoice creation leaves the assignment and balance untouched (tested).
- The unpaid package invoice appears in the patient's "previous outstanding balances" list like any unpaid invoice with no Case (accepted default).
- Legacy: an appointment that already consumed a Case session before the retirement (an unrestored USED log) is still billed ₱0 "(Covered by Pre-Approved Session)" so promises made earlier are honored. Nothing creates such logs any more.

## 7. Case session limits retired (R12 / Q16, as built)

**Removed or neutralized:**
- Booking is no longer blocked by a Case allowance; creating, cancelling, deleting or moving an appointment, confirming a portal booking and saving a clinical note no longer consume or restore Case sessions (saving a note still marks the appointment COMPLETED).
- The four Case endpoints `add_sessions`, `remove_sessions`, `remove_limit`, `reset_allocation` are gone. `approved_sessions`, `is_unlimited`, `session_source`, `package_cost`, `package_invoice`, `amount_paid` are **read-only** in the Case API; new Cases are `MANUAL` with no limit. `PatientCaseSerializer` and `AppointmentSerializer` keep the old limit field names but return neutral values (`None` / `''` / `ACTIVE` / `False`); `session_limit_source` is kept for the legacy package billing screen.
- `case_service.py` is deleted. Letter placeholders `{{case.sessions.*}}` render blank and are removed from the editor menu.
- Frontend: session fields removed from the Case form and the inline Case form in the booking modal; session tracking card, session history and the booking-limit modal/hook removed; progress bars and "Sessions Remaining" badges removed from the Cases page, Calendar, Case selector and workspace; recurring-appointment limit warning removed; 9 dead files deleted (the session modals, tab, page and hook, plus the recurring warning modal).

**Kept as history:** the Case columns (`approved_sessions`, `completed_sessions`, …), `SessionConsumptionLog` and `PatientCaseSessionLog`, `SessionEngine` (still used for `session_limit_source`), `Service.is_package` / `session_allocation` (creating or converting package services is still rejected), and the read-only "Package Billing" card and master-invoice flow for legacy package Cases that have **not** been converted. Dropping any of these is a separate, later step.

## 8. Conversion of old package Cases (Q16b)

`python manage.py convert_package_cases` (**dry run by default**; `--apply` writes; options `--clinic-id`, `--case-id`, `--user-email`, `--include-counter-mismatch`). Per Case with `session_source='PACKAGE'`:
- Converts when the numbers are consistent. The used sessions come from the consumption log (USED minus restores, excluding cancelled and deleted appointments); services come from the appointments that used sessions; **unused sessions are assigned to the most-used service** because the old package never recorded which services it covered (the dry run prints this as a note for review).
- Creates the package (price = `package_cost`, else the invoice total), items, usages for the appointments that used sessions, an audit entry, and links the existing package invoice. **Never changes the Case, its appointments, its logs or any invoice.** Idempotent via `source_case`.
- **Skipped with a stated reason:** unlimited or no allowance, archived, no appointment used a session yet (services cannot be determined), more used than allowed, counter disagrees with the log (unless `--include-counter-mismatch`), already converted.
- No invoice is created for a Case that has none (the dry run warns).
- **Not run on any real data.** It was exercised only by automated tests and once on a scratch database.

## 9. UI (as built)

- **Patient Profile → "Private Package Sessions"** (after Invoices): table with services (used/quantity each), sessions remaining with a progress bar, price and payment state, status, created-by / modified-by, and **Edit** / **Edit History**. Add/Edit buttons are hidden for roles that cannot write.
- **Add / Edit modal** per R8. Add creates the package, then books each scheduled appointment through the **existing appointment API** (availability and conflict checks unchanged) and assigns it; if one fails the package is kept and the error names the service (not atomic across the calls).
- **Appointment screen:** a "Private Package Session" card: assign (dropdown of the patient's active packages with a session left for that service, nothing preselected) or "Remove from package"; locked with an explanation once an invoice exists.
- **Invoice screen:** covered line prefilled at ₱0 with the price locked.
- **Patient merge dialog** shows the number of packages that will move.

## 10. Lifecycle summary

| Event | Effect |
|-------|--------|
| Package created | Package + items + audit + package invoice; optional appointments booked and assigned by the modal. |
| Appointment booked (any way) | **No package link, no session used.** |
| Appointment explicitly assigned | Validated; session used; audit entry. |
| Assignment removed | Session returns; audit entry (blocked once an invoice exists). |
| Appointment cancelled / deleted | Session returns automatically. |
| No-show / DNA | Stays used. |
| Reschedule | No effect on the link. |
| Invoice for a covered appointment | Service line ₱0 by the server; extras billed. |
| Package edited | Audit entry with who and what; quantity floor enforced. |

## 11. Open decisions, limitations and unverified items

**Open decisions**
- **Q6, "transfer sessions":** undecided. Nothing transfer-related is built (no move between packages, no cross-patient move).
- **Q10, use before fully paid:** not enforced; assignment does not check payment.
- **D4** and the two "built-in choices" above need owner confirmation.

**Must be done before this works in an environment**
- Run `manage.py migrate` (applies `patients.0042` and `0043`). Until then, appointment screens that include the new package fields will error on a database without the tables.
- Run `convert_package_cases` as a dry run on production data, review the list, then `--apply`. Until converted, legacy package Cases keep their old billing screen but no longer track sessions.

**Known limitations**
- Existing package Cases that cannot be converted (unlimited, no usage yet, mismatched counters) are left as history and need manual follow-up.
- Pre-existing, unchanged: `PATCH /api/appointments/{id}/edit/` accepts `patient_case` without checking it belongs to the patient; `AppointmentViewSet` has no per-feature permission; `POST /api/invoices/` crashes when `inline_items` is sent; one `apps.clinical_templates` test (`test_print_note_displays_creator`) fails on a clean checkout of `HEAD`.
- Invoice edit screens can still add priced lines; only the covered line itself is protected. A staff member can rename a covered line; the server then treats it as an extra and adds a ₱0 covered line.
- Test runner: several apps cannot be run in one `manage.py test` command (duplicate `tests` modules); run one app at a time.

**Not verified:** production data and volumes; mobile and non-Chromium browsers; the inline "new Case" form inside the full booking modal (type-checked, not opened in a browser); load behavior.

## 12. Behavior before this work (historical, superseded)

Kept for context. Source: code inspection on 2026-10-20 before any change.
- Packages were a mode of `PatientCase` (`session_source='PACKAGE'`, stored `completed_sessions` counter, `package_cost`, `package_invoice`), set automatically by the frontend when a Case had 2+ approved sessions or was unlimited.
- Sessions were used when an appointment was booked (and re-checked on note save), restored on cancel/delete, and booking was blocked when a Case was exhausted. Case session actions had no role check and a plain PATCH bypassed the logs.
- Covered-session pricing happened on the server only when no line items were sent; the invoice screen priced lines in the browser. Package Cases used a "master invoice" per Case with the first session's service price rather than the package price.
- The public booking submit endpoint accepted any active service, and the public practitioner payload listed hidden services (fixed in Chunk 1).
- There was no patient-level view of package balances.

## 13. Delivery status

| Step | Status |
|------|--------|
| 0 Documentation | Done |
| 1 Online Booking hardening | Done (9 tests) |
| 2 Data model + migration | Done (15 tests); migrations applied to a scratch database only, forward and reverse |
| 3 Service layer + API | Done (68 tests incl. branch scoping) |
| 4 Patient Profile UI | Done; browser-verified on a scratch stack |
| 5 Appointment assignment + billing | Done (16 tests); browser-verified |
| 6b Conversion command | Done (13 tests); **not run on real data** |
| 6 Case session limits retired | Done (13 tests); browser-verified (Cases page and form, appointment screen, Diary) |
| 7 Transfers / overrides | **Blocked on Q6** |
| 8 Regression + docs | Done 2026-10-20 |

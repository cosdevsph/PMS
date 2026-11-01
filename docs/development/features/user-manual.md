# User manual (public documentation page)

**Status (2026-11-01):** Implemented. Nine chapters were added, 21 were renumbered, 41 new screenshots were taken and ten were retaken; see the CHANGELOG entry "User manual: nine new chapters" for the verification.
**Related:** [FEATURES.md → Landing page](../FEATURES.md#landing-page) · [ARCHITECTURE.md → ADR-009](../ARCHITECTURE.md) · [CHANGELOG](../CHANGELOG.md)

## 1. What it is

`/user-manual` is a public page with a table of contents, a search box and one chapter at a time. Chapters are React components registered in `frontend/src/features/landing/data/manual-registry.ts`; their screenshots are WebP files under `frontend/src/assets/manual/Chapter N/`.

- **Page:** `landing/UserManualPage.tsx`. The URL hash picks the chapter (`#chapter-19`); an unknown hash falls back to `#chapter-1`.
- **Chrome:** `components/user-manual/` (`DocChapter` header, progress bar and previous / next links, `DocCallout`, `ManualSearch`, `ManualSidebar`).
- **Search** looks only at each chapter's title and its `searchIndex` string in the registry, not at the chapter text. Add keywords there when a chapter gains a topic.

## 2. Chapter map (35 chapters)

Chapter **ids are permanent URL keys**, not display numbers (ADR-009). Existing chapters kept their original `chapter-N` id, so old links still open the same chapter; new chapters use descriptive ids. The sidebar groups chapters by `partTitle`.

| No. | Chapter | Id | Part | Was |
|----:|---------|----|------|-----|
| 1–5 | Welcome, Creating Your Clinic, Signing In, Clinic Setup, Clinic Branch Management | `chapter-1`…`chapter-5` | I, II | unchanged |
| 6 | **Services & Pricing** | `services-pricing` | II | new |
| 7 | **SMS Gateway Setup** | `sms-gateway` | II | new |
| 8 | Clinic Consent Forms | `chapter-6` | II | 6 |
| 9–11 | User Roles, Creating Staff Accounts, Permissions | `chapter-7`…`chapter-9` | III | 7–9 |
| 12–13 | Practitioner Profiles, Duty Hours | `chapter-10`, `chapter-11` | IV | 10–11 |
| 14–16 | Patient Records, Registering Patients, Patient Cases | `chapter-12`…`chapter-14` | V | 12–14 |
| 17 | **Prepaid Packages & Session Tracking** | `prepaid-packages` | V | new |
| 18 | **Patient Documents & Attachments** | `patient-documents` | V | new |
| 19–22 | Calendar Overview, Creating Appointments, Recurring Appointments, Appointment Management | `chapter-15`…`chapter-18` | VI | 15–18 |
| 23 | **Automated SMS & Notifications** | `automated-notifications` | VI | new |
| 24–25 | Patient Portal (new section 24.3 "Sharing Your Booking Link and QR Code"), Online Booking | `chapter-19`, `chapter-20` | VII | 19–20 |
| 26 | **Clinical Note Templates** | `note-templates` | VIII | new |
| 27–28 | Clinical Notes, Clinical Note Export | `chapter-21`, `chapter-22` | VIII | 21–22 |
| 29 | Invoice and Payment | `chapter-23` | IX | 23 |
| 30 | **Inventory Management** | `inventory` | IX | new |
| 31 | Reports & Analytics | `chapter-24` | X | 24 |
| 32 | **Multi-Branch Reporting** | `multi-branch-reporting` | X | new |
| 33 | Subscription | `chapter-25` | XI | 25 |
| 34 | **Audit Logs & Change History** | `audit-logs` | XI | new |
| 35 | Contact Support | `chapter-26` | XII | 26 |

## 3. Conventions (follow these when adding a chapter)

- **Numbers are typed by hand** inside each chapter: section headings (`24.1`), the overview chips, the screenshot captions (`Screenshot 24.1: …`), import names (`Screenshot24_1`), the asset folder (`Chapter 24`) and the file name (`Chapter24.tsx`). Section `N.M` owns screenshot `N.M`; extra shots in the same section are `N.M.1`, `N.M.2`.
- **Layout of a chapter:** lead paragraph, a sky "overview" box with flow chips, one white card per section (h3, one-line subtitle, steps, callouts, then the screenshot last), and a "Summary" list.
- **Screenshots:** WebP, the full app window at **3420 × 2002** (1710 × 1001 CSS pixels at 2× scale), or a crop of one dialog. No browser frame and no annotations. Give every `<img>` its real `width` and `height`; the first image in a chapter is not lazy-loaded.
- **Renumbering** (done 2026-11-01) is mechanical: move the chapter file and asset folder, then rewrite the numbers with the pattern in the script described in the CHANGELOG. Nothing outside the manual links to chapter numbers; `docs/` mentions are history.
- **Demo data only.** Screenshots show the fictional "Malasakit Clinic – Bacolod / South" clinic; never photograph real clinic or patient data (see §4).
- **Roles:** Owner and Branch Manager only; never "Admin" or "Administrator". Times in 12-hour format.

## 4. How the screenshots were produced (2026-11-01)

1. Copy the dev database into a scratch database (`pg_dump pms_Trial_DB | psql`), run a scratch backend on port 8001 with `REDIS_URL=` and `DB_NAME=<scratch>`, and a temporary Vite config on port 5174 that proxies to it (see the dev-stack memory note).
2. **Anonymize the scratch copy before capturing:** rename the clinic and its branch, replace every staff and patient name, email and phone with fictional values, and set a scratch password. The copy's owner clinic had real-looking names and an email address.
3. Run the scratch backend through a small settings wrapper kept **outside the repo** that overrides `MEDIA_ROOT`, because `config/settings.py` hardcodes `BASE_DIR/media`; otherwise demo uploads would land in the real `backend/media`.
4. Seed what the screens need: services, inventory items, documents, package statuses, reply-based communication entries, a second branch with a practitioner and appointments, a gateway phone with a fresh heartbeat.
5. Drive headless Chromium over the DevTools protocol at 1710 × 1001, scale 2, saving `Page.captureScreenshot` as WebP. Notes: Diary appointment blocks open on **mouse up** (a synthetic `click()` does nothing), the QR card PNG is captured by intercepting the download, and the Occupancy report groups practitioners by their home branch.
6. Review every shot on a contact sheet, then tear everything down (servers, temporary Vite config, scratch database and media).

## 5. What the new chapters say, and where the product falls short

The chapters describe only what the code does. Where the client's list asked for something the product does not do, the chapter says so and the gap is listed here.

| Client item | What exists | Gap, as written in the chapter |
|-------------|-------------|--------------------------------|
| Services: control which appear in online booking | A `show_in_portal` flag shown as the "Portal" column; **no form field** sets it, and saving the edit form switches the service back on | Ch. 6.5: use the Active toggle (which also hides it from the Diary) |
| Booking links: regenerate | Regenerating does **not** change the URL or QR code (the URL uses the clinic slug); the app's message says the old QR is invalid | Ch. 24.2 and 5.4 corrected; **verified by running it**. Fix the message or make regeneration real |
| SMS gateway | One phone per branch; the pairing dialog says "Link to Clinic" but the app button is "Scan QR Code" | Ch. 7.3 notes both. No screenshots of the Android app (no device) |
| Automated SMS | The daily 8 AM reminder, plus cancel and reschedule SMS when a patient uses a link, go through the clinic phone. "Reminder Timing" does not affect the daily reminder | Ch. 23.2–23.3. The **SMS switch exists only on the main branch's form**, but each appointment checks its own branch's switch (default off), so SMS for other branches is doubtful (from reading the code) |
| Scheduled follow-ups | `send_communication_reminders`, `send_rebook_followups` and `send_inactive_checkins` filter with `Clinic.objects.filter(main_clinic__isnull=True)`, but `main_clinic` is a Python property, so Django cannot filter on it and each run should fail (from reading the code, **not run**) | Ch. 23.2 tells readers to check the Logs page |
| Low-stock reminders | On-screen indicators only; nothing is sent. The landing page still says "receive low-stock alerts" | Ch. 30.4 says "on-screen only" |
| Note templates | No version history or activate switch in the screens; Discipline and Location are only labels | Ch. 26.2 and 26.5 |
| Audit logs: user and system activity | Only the Clinical Note audit page; histories exist for packages and invoices. Role changes, patient merges, subscription events and outcome assessments are stored but have no screen | Ch. 34.4 says there is no single activity log yet |
| Multi-branch reporting | Only **Occupancy** has a branch filter; every other report combines all branches, including for a Branch Manager | Ch. 32.3 |
| Documents | PDF, DOC and DOCX up to 5 MB; categories are stored but not shown; deleting is permanent; only documents uploaded at your own branch are listed | Ch. 18 |

## 6. Known limitations and open work

- Chapter 29 (Invoice and Payment) still describes the older case-package fields (Package Subtotal, Master Invoices). Chapter 17 explains the invoice box.
- Chapter 4 screenshot 4.7 shows only the Email toggle; the onboarding page cannot be reopened for a finished clinic, so it was not retaken.
- Only the screenshots named in the CHANGELOG were retaken. The other 127 older screenshots were not audited; the 2026-10-22 note that chapters 6–12 (now 8–14) still show old role labels remains true.
- The marketing claim "receive low-stock alerts" (landing page Features card 7) is not true; see the landing page revision note.

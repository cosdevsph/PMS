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

## 2026-10-24 — Merge-field values print bold with proper spacing

**Status:** Implemented and tested. No migration. Nothing committed.
**Module / feature:** Letters: template toolbar (Letter / Client / Case field menus), letter writer and generated letters.
**Original behavior:** A merge field in the template (e.g. First Name) became plain text in the patient's letter ("John Doe" looked like the rest of the text). Inserting fields from the toolbar added no spaces, so two fields next to each other could join ("JohnDoe"). Values went into the HTML unescaped, and a value containing a backslash could break the replacement.
**Problem / requirement:** Owner: the values shown in the patient letter must be bold and spaced properly.
**Files modified:** `backend/apps/letters/services.py` (`replace_variables`, new `_render_value`, `RAW_HTML_VARIABLES`), `backend/apps/letters/tests.py` (+5 tests), `frontend/.../editor/EditorToolbar.tsx` (`insertVariable`).
**Backend changes:** Each resolved value is HTML-escaped and wrapped in `<strong>` (the signature image is the one exception and stays raw). An empty value removes the field and one following space, so "Dear {{title}} {{first_name}}" has no double space; the replacement can no longer misread a backslash in a value.
**Frontend changes:** Inserting a field adds a space before it unless it starts a line or follows a space, opening bracket or quote, and a space after it only when text follows that is not a space or closing punctuation. Typing a comma right after the last field gives "[Last Name],".
**Database / migrations:** None. **API / data contract:** `preview` / `generate` content now contains `<strong>` around values.
**Business rules & decisions:** Every merge field prints bold (also dates and clinic fields), as the owner asked for values to be bold; each field is bolded separately, the space between "John" and "Doe" is plain text. Only letters generated from now on are affected; saved letters keep their stored HTML.
**Tests executed:** `manage.py test apps.letters` → 27 OK (bold per field, space preserved, escaping and backslash value, empty value without a double space, raw-text variable, unknown field). `npx tsc -b` → clean; eslint on `EditorToolbar.tsx` → clean. Manual (scratch database copy, removed afterwards): inserting First Name then Last Name from the Client menu gave "Dear [First Name] [Last Name]," with the comma typed directly after; a letter created from a template with those fields showed "Dear John Doe," and "Born 02/01/1990." with each value at font weight 700, in the letter writer.
**Known limitations:** Not checked in a rendered PDF (the HTML uses plain `<strong>`, which the PDF engine supports). The viewer, print window and the saved-letter page use the same stored HTML but were not opened separately. A field typed directly before text with no space ("[Name]text") gets a space only when inserted before existing text.
**Regression risks:** Every merge field in every new letter prints bold; templates that already put the field inside bold or headings show it bold anyway.

---

## 2026-10-24 — Follow-up: the appointment's branch wins for the letterhead

**Status:** Implemented and tested (backend tests); not checked in a browser. No migration. Nothing committed.
**Problem / requirement:** Owner: a patient of Branch A with an appointment at Branch B must get Branch B's letterhead (where the appointment was created). The previous change used the patient's branch only.
**Rule now:** letterhead clinic = the appointment's clinic, else the patient's `home_branch`, else the patient's clinic (`LetterGeneratorService.letterhead_clinic(patient, fallback, appointment)`). Supersedes the "patient's branch only" rule of the entry below; the older "writer's clinic" is still not used.
**Files modified:** `letters/services.py`, `views.py` (`generate`, `preview`, and `letterhead?patient=&appointment=`), `serializers.py` (a saved letter uses its own appointment), `tests.py` (+3 tests; 22 run, the new class also re-runs the patient-branch tests), `frontend/.../letterTemplates.api.ts` (`getLetterhead(branchId, patientId, appointmentId)`), `ClinicalLetterEditor.tsx` (passes the appointment).
**Tests executed:** `manage.py test apps.letters` → 22 OK; `npx tsc -b` → clean. Not run: a browser check.
**Known limitations:** The appointment only counts when the letter is created for one (from an appointment, `initialAppointmentId`). A letter written from the case's Letters tab with no appointment uses the patient's branch, so it still shows Branch A for a Branch A patient. An appointment of a different patient is ignored.
**Regression risks:** Letterhead on letters tied to appointments; the viewer for those letters.

---

## 2026-10-24 — Letterhead follows the patient's branch

**Status:** Implemented and tested (backend tests); not checked in a browser. No migration. Nothing committed.
**Module / feature:** Letters: letterhead of generated letters, the letter writer (`ClinicalLetterEditor.tsx`), the viewer.
**Original behavior:** The letterhead was the appointment's clinic, else the clinic of the person writing the letter. A practitioner who works at Clinics A and B could put Clinic B's letterhead on a Clinic A patient's letter.
**Problem / requirement:** Owner: the letterhead (clinic name, logo, address) must be that of the clinic branch the patient belongs to. Example: patient of Clinic A, practitioner assigned to A and B → Clinic A letterhead.
**Reason for the change:** One rule everywhere: `LetterGeneratorService.letterhead_clinic(patient)` = the patient's `home_branch`, else the patient's `clinic`.

**Files modified:** `backend/apps/letters/services.py` (resolver), `views.py` (`generate`, `preview`, and `letterhead` accepts `?patient=<id>`, 404 for a patient outside the user's clinic group), `serializers.py` (the letter's `clinic_profile` uses the patient's branch, so the viewer and print also change for older letters), `tests.py` (+4 tests), `frontend/.../api/letterTemplates.api.ts` (`getLetterhead(branchId, patientId)`), `ClinicalLetterEditor.tsx` (fetches the patient's letterhead).
**Database / migrations:** None. **API / data contract:** `GET /api/letters/templates/letterhead/?patient=<id>` added; `clinic_profile` in letter responses now reflects the patient's branch.
**Business rules & decisions:**
- The appointment's clinic no longer decides the letterhead (before it did). Decision taken from the example (the patient's branch rules); say if a letter for an appointment at another branch should use that branch instead.
- Previously generated PDFs keep the letterhead they were created with; the viewer and print show the patient's branch.
- Supersedes the earlier rule "letterhead = the appointment's clinic, else the writer's clinic".
**Tests executed:** `manage.py test apps.letters` → 15 OK; mutation (resolver returns the writer's clinic) → tests fail, restored → 15 OK. `npx tsc -b` → clean; eslint on the API file → clean. **Not run:** a browser check of the writer.
**Known limitations:** The template editor still previews the letterhead of the chosen Location (or your clinic) with a sample patient; real letters use the patient's branch. A patient with no `home_branch` uses the patient's clinic (the main clinic for older records).
**Regression risks:** Letters for patients of a branch; viewer / print letterhead of old letters.

---

## 2026-10-24 — Follow-up: Letter template editor is full page and compact

**Status:** Implemented. Presentation only; no behavior, API or data change. Nothing committed.
**Module / feature:** Manage → Clinical → Letter Templates editor.
**Problem / requirement:** Owner request: the New Letter Template page should be full page with the top bar hidden, and spacing, text and input sizes reduced for a compact view.
**Files modified:** `LetterTemplateEditor.tsx` (the editor is a fixed full-screen layer, so the top navigation and the "Back to Manage" strip are covered), `LetterTemplateHeader.tsx` (smaller title bar and buttons, 32 px fields, Category / Discipline / Location / Description on one row, smaller labels), `LetterDocumentEditor.tsx` (less padding around the page), `LetterDocumentLayoutPanel.tsx` (narrower panel, tighter spacing).
**Tests executed:** `npx tsc -b` → clean; `npx eslint` on the four files → clean. Manual (scratch database copy, removed afterwards): the editor opens full screen with no top bar, the settings fit one row, the panel and page show without scrolling the header. The Cancel / back arrow is the way out (the top bar is hidden by design).
**Known limitations:** On narrow screens the four settings stack to one column. The 1920-wide layout was not checked beyond the 1700 px browser used.
**Regression risks:** None beyond this screen; dropdowns (discipline list) keep their z-order inside the editor layer.

---

## 2026-10-24 — Letter templates: professional editor, real letterhead preview, one shared layout, fixed PDF spacing

**Status:** Implemented and tested. No migration. Nothing committed. Supersedes the "Proposed" analysis entry below for findings F1–F3, F8 and F9; the rest stay Proposed.
**Module / feature:** Manage → Clinical → Letter Templates editor; letter writer, viewer, preview and print; `backend/apps/letters/`. See FEATURES "Letters & letter templates" and [features/letter-templates.md](features/letter-templates.md).

**Original behavior:** See the analysis entry below. In short: the template editor showed grey dashed placeholders; the letterhead / date / addressee layout was built four times; the letter writer never showed the letterhead; the generated PDF had large gaps between every line.
**Problem / requirement:** Owner request (2026-10-24): make the template header and editor more professional and clinic-ready. Direction given: (1) a professional header and editor shell; (2) a real letterhead / date / addressee preview with one shared layout; addressee stays the patient; no sign-off or footer yet; toolbar and merge-field work later.
**Reason for the change:** One layout source means the template editor, the letter writer, the viewer, the print window and the PDF show the same thing. The PDF bug was found while checking: rendering the old PDF showed a flex letterhead that xhtml2pdf ignores and, worse, a `padding-top` wrapper div that makes xhtml2pdf inflate the spacing of every paragraph inside it (affecting every generated letter, not only the letterhead).

**Files modified:**
- `backend/apps/letters/services.py` — new `build_layout_html` (table-based, every value HTML-escaped; empty address lines and a missing logo are skipped) and `top_spacer_html` (a 30 px spacer, or none with "Remove top space").
- `backend/apps/letters/views.py` — `generate` and `preview` use the shared builder and the spacer (about 90 duplicated lines removed); new `GET /api/letters/templates/letterhead/?branch=<id>`.
- `backend/apps/letters/tests.py` — new, 11 tests (was empty).
- `frontend/src/features/clinical-documentation/components/letter/` — new `LetterLayoutBlocks.tsx` (letterhead, date, addressee, top space; inline styles so they also work in the print window), `letterLayout.ts`, `buildLetterPrintHtml.tsx`; `ClinicLetterhead.tsx` is now a thin wrapper.
- `ClinicalLetterEditor.tsx` (letter writer: adds the missing letterhead, uses the shared blocks), `ViewClinicalLetterModal.tsx` (screen and print), `DocumentPreviewModal.tsx`, `api/letterTemplates.api.ts` (`getLetterhead`).
- `frontend/src/features/manage/pages/clinical/components/editor/` — `LetterTemplateHeader.tsx` (title bar and settings), `LetterTemplateEditor.tsx` (state, dirty tracking, letterhead fetch), `LetterDocumentEditor.tsx` (real preview), `LetterDocumentLayoutPanel.tsx` ("Page layout" with a helper line per toggle).

**Frontend changes:** Header: breadcrumb, large inline title, Active / Inactive switch, "Unsaved changes / All changes saved" indicator, Save disabled until there is something to save (edit mode), inline "title required" message instead of `alert()`. Settings: Category (General, Referral, Report, Medical certificate), Discipline (a saved custom discipline now shows in the list), Location, optional Description (the last two fields existed on the template but had no control). Page: the real clinic or branch letterhead (logo, name, address, phone, email), today's date and a clearly marked sample addressee, with a "hidden" note for any block switched off. Unsaved tracking covers every field, including the four toggles; leaving asks to confirm, and closing the tab warns. The letter writer now shows the letterhead.
**Backend changes:** see Files modified.
**Database / migrations:** None (`makemigrations --check` → no changes).
**API / data contract:** New read-only `GET /api/letters/templates/letterhead/` (`?branch=` must belong to the user's clinic group, else 404; omitted = the user's clinic). Generated PDF HTML changed (tables, escaped values, spacer instead of a padded wrapper); request and response shapes of `generate` and `preview` are unchanged.

**Business rules & decisions:**
- "Remove top space" now means the same everywhere: no 30 px gap above the first block (before: padding, wrapper padding, or ignored in print).
- Letter blocks are built from the clinic's invoice print settings, as before; the template's Location still does not change which letterhead a generated letter uses (the appointment's branch, else the writer's clinic). The editor previews the chosen Location and says so.
- Out of scope, still Proposed: addressee choice, sign-off / signature / footer, toolbar and merge-field fixes, template filtering by discipline or branch, list Location name, permission check on templates.

**Tests executed:**
- `manage.py test apps.letters` → 11 OK (layout flags, escaping, no flexbox, missing logo, empty lines, spacer, PDF builds, letterhead endpoint scope and login). `manage.py check` → no issues.
- `npx tsc -b` → clean; `npx eslint` on the changed editor and letter-layout files → no new findings (the findings left in `ClinicalLetterEditor.tsx` and `DocumentPreviewModal.tsx` are the ones that existed before).
- PDF check (real xhtml2pdf output rendered to an image): before, one line per ~100 px with no divider and the body pushed off page 1; after, a divider, tight address lines, an escaped clinic name (`Rehab & Care <Clinic>` printed as text) and the body on page 1. A letter with "remove top space", no letterhead and no addressee was also generated.
- Manual (scratch copy of the dev database, `REDIS_URL=` empty, removed afterwards): new template shows the real letterhead and a sample patient; saving with no title shows the inline error; changing category, description, a toggle and the body shows "Unsaved changes"; save persists category, description and flags; reopening shows "All changes saved"; a toggle-only change triggers the leave confirmation and toggling back clears it; in the patient's Letters tab a new letter shows the letterhead, date and addressee, the toggles hide and show them, saving opens the viewer with the same blocks, and the print window HTML has the letterhead, addressee and body with the clinic name escaped. No console errors.

**Known limitations / unresolved issues:**
- PDF letterhead logo rendering was not tested (the scratch clinic had no logo); the logo cell is built but unchecked in a real PDF.
- The PDF layout is the backend twin of the React blocks, so the two can still drift in small ways (fonts, line gaps).
- Existing letters keep their stored PDF; only letters generated from now on use the new layout.
- The sample addressee is fixed text; it is not editable.
- Findings F4–F7 and F10–F12 are untouched.
**Regression risks:** Every PDF letter (spacing and layout changed); letter print window; the letter writer and viewer pages; the template editor's save payload (now sends category and description).

---

## 2026-10-24 — Letter templates: analysis of the editor and the letter workflow

**Status:** Proposed (analysis only; no code changed). Findings F1–F3, F8 and F9 were addressed on 2026-10-24, see the entry above.
**Module / feature:** Manage → Clinical → Letter Templates (`LetterTemplateHeader.tsx`, `LetterTemplateEditor.tsx` and neighbours) and letter generation (`backend/apps/letters/`).

**Original behavior:** Recorded in [features/letter-templates.md](features/letter-templates.md) and FEATURES "Letters & letter templates": a full-screen editor with a settings bar (title, discipline, location), a toolbar, an A4 page with grey placeholders for letter head, date and addressee, and a right-hand "Document Layout" panel with four toggles (Letter Head, Remove Top Space, Date, Addressee) that only decide which blocks are added when a letter is generated.
**Problem / requirement:** Owner request (2026-10-24): enhance the template header and editor to be more professional and suited to what clinics need. First step: understand the current code and workflow.
**Reason for the change:** Record how things work today and what was found, so the redesign can be planned from facts.

**Files modified:** Documentation only.
- `docs/development/features/letter-templates.md` — new: screens and files, editor behavior, data model, generation steps, findings F1–F12, unverified items.
- `docs/development/FEATURES.md` — new section "Letters & letter templates"; index row updated (was "Not yet documented").
- `docs/development/CHANGELOG.md` — this entry.

**Frontend changes:** None
**Backend changes:** None
**Database / migrations:** None
**API / data contract:** None

**Business rules & decisions:** None decided yet. The owner's enhancement direction (header and editor design, real letterhead preview, addressee choice, signature / footer blocks, toolbar and merge-field list, template filtering) is still to be given; each change needs an approved plan.

**Tests executed:** None (documentation only). Findings come from reading the code on 2026-10-24; none were verified by running it. Unverified: the PDF letterhead layout (F2), duplicate template names, and any behavior of `xhtml2pdf`.

**Known limitations / unresolved issues:** Findings F1–F12 are open (see the feature note §6). The letters app has no automated tests (`apps/letters/tests.py` is empty).
**Regression risks:** None (no code changed).

---

## 2026-10-23 — Client feedback on access and branch assignment: delegation limits, Branch Manager group management, Frontdesk/Finance at several clinics

**Status:** Implemented and tested. No migration. Nothing committed.
**Module / feature:** Roles and permissions, staff, Setup → Users → Permissions and Staff form. See FEATURES "Roles & permissions".

**Client expectations and verdicts (analysis, checked against the code before changing anything):**
1. *Only Owner and Branch Manager grant access* — aligned (staff create/update, branch endpoints and group assignment are Owner/Branch Manager only; role changes are Owner only; clinicians and staff cannot).
2. *Owner gives another branch; the user keeps their role permissions there* — Practitioners already worked at several clinics (previous entry); Frontdesk and Finance belonged to one clinic only. Not aligned for them; fixed below.
3. *A Branch Manager delegates only within their branches and their own limits* — not aligned: (a) levels of a group could be set above the Branch Manager's own; (b) permission groups are shared by the whole clinic group, so one Branch Manager's edit changed another manager's staff; (c) `assign_user` reached users at any clinic.
4. *A clinician sets availability per branch and per day* — already supported (the Staff form has a clinic per working period per day, plus the Permissions panel from the previous entry). The "cannot add the other branch" symptom came from the seat pre-check counting one seat per branch at the plan limit and from a Branch Manager being unable to save a Practitioner shared with another manager's clinic; both were fixed in the previous entry (needs deploying; production runs an earlier build). Availability stays Owner / Branch Manager managed (decision: no self-service).

**Owner decisions (2026-10-23):** a Branch Manager changes a group only if all its members fit their clinics (else Duplicate); Frontdesk and Finance multi-clinic now; a Branch Manager always manages the Frontdesk / Practitioner / Finance groups, capped at their own levels; no clinician self-service.

**Original behavior:** A Branch Manager needed "Permissions: Edit" on their own group (default: No Access, so the page was view-only) and could then set any level on any of the three groups, for the whole clinic group; `assign_user` accepted users of any clinic; Frontdesk / Finance had one clinic.
**Reason for the change:** Make the code match the client's rule: widen where, never what; Branch Managers delegate only inside their clinics and their own level.

**Files modified:**
- `backend/apps/accounts/utils/rbac.py` — new `own_levels`, `ceiling_violations`, `cap_levels`, `manager_scope_ids`, `clinics_of`, `users_managed_by`, `is_within_manager_scope`, `group_lock_reason`.
- `backend/apps/accounts/views.py` — `PermissionGroupViewSet`: a Branch Manager always may manage the three groups (no `permissions` switch); `_assert_can_manage` also refuses a group shared with other managers' clinics; ceiling on create/update; duplicate caps the copy and returns `lowered_features`; `assign_user` limited to the manager's own staff; `UserViewSet.get_queryset` uses `users_managed_by` (active assignments only); staff create calls `_sync_work_branches`; module constant `FEATURE_LABELS`.
- `backend/apps/accounts/serializers.py` — group serializer adds read-only `locked_reason`; `UserSerializer` adds write-only `work_branch_ids` (Frontdesk / Finance clinics) with `_validate_work_branches` and `_sync_work_branches`; `validate_clinic_branch` accepts an unchanged home clinic.
- `backend/apps/accounts/test_delegation_rules.py` — new, 21 tests. `test_permission_group_rbac.py` — three tests rewritten for the new rule (see Superseded).
- `frontend/.../users/Permissions.tsx` — `canManage = Owner or Branch Manager`; locked groups show the reason and keep Duplicate; level ceiling passed down; "Clinics for staff" panel; duplicate toast lists lowered features. `permissions/AccessControl.tsx`, `FeatureSections.tsx` — levels above the viewer's own are disabled ("Above your own access"). `permissions/StaffBranchPanel.tsx`, `staffClinics.ts` — new. `permissions/BranchAccessPanel.tsx` — exports the add-menu and chip. `services/StaffService.ts`, `PermissionGroupService.ts`, `types/staff.types.ts` — new calls and fields. `components/modals/CreateStaffAccountModal.tsx` — "Also works at" checklist for Frontdesk / Finance (locked rows for other managers' clinics).

**Database / migrations:** None. **API / data contract:** `PATCH/POST /api/users/` accepts `work_branch_ids` (STAFF / FINANCE only; the first id is the home clinic; at least one; Owner: any clinic of the group; Branch Manager: may add or remove only the clinics they manage and must leave others as they are, else 400). Permission-group responses add `locked_reason`; duplicate adds `lowered_features`. Group update/create by a Branch Manager returns 400 "You cannot give more access than you have yourself: <features>" and update/delete of a shared group returns 403 "…Duplicate it and give the copy to your staff."; `assign-user` returns 403 for users at other managers' clinics.

**Business rules & decisions:**
- A clinic added to Frontdesk / Finance widens where they work, never what they may do: their permission group is unchanged and there is no clinician seat (only Practitioners are clinicians).
- Ceiling: a Branch Manager cannot raise a row above their own effective level (staff always-edit included); rows already above it may stay or be lowered; the Owner has no ceiling. Duplicating lowers the copy to the copier's level.
- A group is changeable by a Branch Manager only if every member's clinics (active assignments plus home clinic) are inside the clinics they manage; the Owner can always change it.
- Superseded (2026-10-23): "a Branch Manager needs Permissions: Edit on their group to manage Frontdesk / Practitioner / Finance" (they always may, within the limits above), and "Branch Managers' view-only notice asks the Owner for Permissions: Edit" (removed). Rows rewritten in tests: manager without Permissions: Edit "cannot edit any group / cannot create or delete" now means "cannot go above their own level" and "cannot touch Custom groups".

**Tests executed:**
- `manage.py test apps.accounts` → 139 OK (118 + 21 new); `apps.patients` → 141 OK; `apps.subscriptions` → 49 OK (one app per command). `check` → no issues; `makemigrations --check --dry-run` → no changes.
- Mutation checks (each reverted): no ceiling → 2 fail; no members-fit lock → 2 fail; no `assign_user` scope → 1 fails; Branch Manager may change foreign staff clinics → 3 fail; staff list ignores `is_active` → 1 fails; restored → 21 OK.
- `npx tsc -b` → clean; `npx eslint` on the changed and new files → clean except `CreateStaffAccountModal.tsx` (same 18 findings as at `HEAD`) and two existing `any` types in `staff.types.ts`.
- Manual (scratch copy of the dev database, `REDIS_URL=` empty, removed afterwards): a Branch Manager in the default group (Permissions: No Access) sees editable dropdowns on the Finance group and no view-only notice; the Permissions row offers only "No Access" (View and Edit disabled, "Above your own access"); the Frontdesk group shared with another manager's clinic is read-only with the reason and Duplicate (no Delete), and the copy is editable; the "Clinics for staff" panel offers only the Branch Manager's own unassigned clinic and adding it works while the permission group is unchanged; in the Staff form the "Also works at" list shows the home clinic fixed, the other manager's clinic is not offered, and saving added the clinic. No console errors.

**Known limitations / unresolved issues:**
- A Branch Manager sees other managers' clinics only as "Managed by another Branch Manager" (no name). A locked group cannot be unlocked by the Branch Manager; they duplicate it and move their staff to the copy.
- Frontdesk / Finance clinics have no per-clinic days or hours (only Practitioners do). A staff user who is also a Practitioner or Branch Manager is excluded from this field.
- Saving any Frontdesk / Finance user from the Staff form now writes an active assignment row for their home clinic.
**Regression risks:** Permission-group editing and assignment by Branch Managers; the staff list a Branch Manager sees (active assignments only); Diary / patient scope for Frontdesk and Finance with several clinics; the Staff form payload for STAFF / FINANCE users.

---

## 2026-10-23 — Follow-up: why a Branch Manager's level dropdowns on the Permissions page are not clickable

**Status:** Superseded (2026-10-23, see "Client feedback on access and branch assignment"): a Branch Manager no longer needs Permissions: Edit, and the notice was removed.
**Module / feature:** Setup → Users → Permissions.

**Original behavior:** A Branch Manager sees the Frontdesk, Practitioner and Finance groups with the level shown as a plain pill (no dropdown) unless their own group has **Permissions: Edit**; the default Branch Manager group has Permissions set to No Access, so the page is view-only. The only hint was "View-only. Contact the Owner to make changes."
**Problem / requirement:** Owner report: the "Edit / View / No Access" dropdown is not clickable for a Branch Manager.
**Finding:** Not a click or layout bug. Isolated check on a copy of the dev database: with the default Branch Manager group (Permissions: No Access) the page shows 0 dropdowns and the view-only notice; after the Owner sets Permissions: Edit on the Branch Manager group and the Branch Manager opens the page again, 32 dropdowns appear, the menu opens with a real mouse click, a level can be changed and the card's Save changes works (hit-tests showed nothing covering the control). The change reaches an already open session only after the page is opened again (the session re-reads permissions then).
**Reason for the change:** The notice did not say what to ask the Owner for.

**Files modified:** `frontend/.../users/Permissions.tsx` — for a Branch Manager the notice now says to ask the Owner to set Permissions (Administration) to Edit for their Branch Manager group.
**Database / migrations:** None. **API / data contract:** None.

**Tests executed:** `npx tsc -b` → clean; `npx eslint` on the file → clean. Manual (scratch database copy, `REDIS_URL=` empty, removed afterwards): the new notice shows for a Branch Manager whose group has Permissions: No Access; dropdown open / change / save checked as described above.

**Known limitations / unresolved issues:** Open decision for the Owner: whether Branch Managers should always be able to manage the Frontdesk, Practitioner and Finance groups (like the staff rule), instead of depending on the Permissions row of their group. Not changed.
**Regression risks:** None beyond this screen's notice text.

---

## 2026-10-23 — Practitioners working at several clinics: set by the Branch Manager, counted as one clinician

**Status:** Implemented and tested. No migration. Nothing committed.
**Module / feature:** Roles and permissions, staff, subscriptions. Setup → Users → Permissions and Staff form. See FEATURES "Roles & permissions" and "Subscriptions & pricing".

**Original behavior:** A Practitioner could already work at several clinics (each clinic is a `UserBranchAccess` row built from the `branch_id` on each block of the combined `duty_schedule`), but: (1) the clinician-limit **pre-checks** on staff create, staff update and `assign_branch` counted one seat **per clinic**, so at the plan limit adding a clinic, or creating a Practitioner for two clinics, was refused with CLINICIAN_LIMIT_REACHED although the seat counter itself counts a clinician once; (2) the access helpers (Diary clinics, patients, packages) read **all** assignment rows including deactivated ones, so a Practitioner removed from a clinic kept that clinic's Diary and patients; (3) `assign_branch` and `update_branch_assignment` did not check overlapping hours with the Practitioner's other clinics; (4) a Branch Manager saving a Practitioner who also works at another manager's clinic was refused (the other clinic is outside their scope) or would have dropped it; (5) the Permissions page had no Practitioner clinic controls.
**Problem / requirement:** Owner, 2026-10-23: the Owner creates Branch Managers; a Branch Manager creates Practitioner, Frontdesk and Finance and should also set a Practitioner's Diary, Calendar and patient access with other branches by giving the Practitioner more clinics. A Practitioner in several clinics counts as **1 clinician** (one person in different places). Decisions: an added clinic means "works there" (assigned, bookable on its hours, sees that clinic's patients and notes); a Branch Manager may add only clinics they manage, the Owner any; set from both the Permissions page and the Staff form; Practitioners only for now.
**Reason for the change:** One write path (the user update with a combined `duty_schedule`) so validation, overlap checks and `_sync_practitioner_branch_schedules` apply everywhere; seat checks aligned with the counter that already existed; access that follows the clinics the person actually works at.

**Files modified:**
- `backend/apps/accounts/views.py` — create: 1 seat for a new Practitioner; update: 1 seat only when the Practitioner role is newly added, 0 for any clinic change; `assign_branch`: no capacity check (the user already holds a seat), overlap check, combined schedule re-synced; `update_branch_assignment`: overlap check (when the clinic stays active), re-sync; `deactivate_branch_assignment`: re-sync.
- `backend/apps/accounts/utils/schedule.py` — new: overlap finder and message, the combined schedule built from active clinic rows, `branch_overlap_error`, `sync_combined_schedule`, `blocks_outside`.
- `backend/apps/accounts/serializers.py` — `_validate_duty_schedule`: overlap now uses the shared helper (same message); a Branch Manager may resend unchanged blocks of clinics they do not manage but may not add, change or remove them (`_stored_schedule`, `_block_is_stored`).
- `backend/apps/accounts/utils/rbac.py` — new `get_assigned_branch_ids` (active rows plus managed clinics); `get_allowed_branches` uses it.
- `backend/apps/patients/views.py`, `patients/services/package_service.py` — patient / branch / package scoping uses `get_assigned_branch_ids`; `patients/serializers.py` — the public portal's practitioner list ignores deactivated clinics (same rule the Diary list already used).
- `backend/apps/accounts/test_practitioner_clinics.py` — new, 23 tests.
- `frontend/.../users/permissions/PractitionerBranchPanel.tsx`, `practitionerSchedule.ts` — new panel and schedule helpers; `Permissions.tsx` — shows the panel in Diary & Calendar for Practitioner groups, fetches staff for a Branch Manager who can manage groups; `services/StaffService.ts` — `saveStaffSchedule`; `components/modals/CreateStaffAccountModal.tsx` — hours at a clinic the Branch Manager does not manage are shown locked and sent back unchanged; the "N Clinician Seats" label now reads "1 Clinician Seat" with a note.

**Frontend changes:** New "Clinics for Practitioners" panel inside the Diary & Calendar card of a group whose members are Practitioners (the Owner, or a Branch Manager who may manage that group): per Practitioner, the clinics they work at with days and hours, "Add more branch" (clinic, days, from/to), edit hours, remove (never the last clinic; clinics outside the viewer's scope are locked). Backend refusals (overlap, scope) appear inline. Staff form: locked rows for other managers' clinics; locked days cannot be switched off; new blocks never default to a locked clinic.
**Backend changes:** see Files modified.
**Database / migrations:** None (`makemigrations --check` → no changes).
**API / data contract:** No new endpoints. `PATCH /api/users/{id}/` with `duty_schedule` (blocks carry `branch_id`) is the path for changing a Practitioner's clinics. `assign_branch` and `update_branch_assignment` return 400 with the overlap message. A Branch Manager changing hours at a clinic they do not manage gets 400 ("You can only change working hours at the clinics you manage." / "Branch #N is not one of the clinics you manage.").

**Business rules & decisions:**
- One person, one seat: a Practitioner costs one clinician seat when they become a clinician, and none for adding, changing or removing clinics. Supersedes the per-clinic pre-check behavior; the counter (`get_clinician_allocations_for_clinic`) is unchanged.
- A Branch Manager adds/changes/removes hours only at clinics they manage; other clinics' hours must be resent unchanged. The Owner can use any clinic of the group.
- A clinic the person no longer works at (deactivated row) grants no Diary, patient or package access. A Branch Manager's managed clinics do not depend on `is_active`.
- Hours at two clinics may not overlap on the same day (back-to-back is allowed).
- Assumption (not explicitly chosen): when adding a clinic the panel asks for days and hours (default Mon–Fri 8:00 AM–5:00 PM) rather than guessing them.

**Tests executed:**
- `manage.py test apps.accounts.test_practitioner_clinics` → 23 OK. Mutation checks (each change reverted afterwards): per-clinic seat math on update → 8 tests fail; ignoring `is_active` in access → 1 fails; removing the unchanged-foreign-blocks rule → 1 fails; restored → 23 OK.
- `manage.py test apps.accounts` → 118 OK; `apps.patients` → 141 OK; `apps.subscriptions` → 49 OK (one app per command). `apps.appointments` and `apps.clinics` have no tests (0 ran). `apps.clinical_templates` was not re-run (known pre-existing failure unrelated).
- `manage.py check` → no issues; `makemigrations --check --dry-run` → no changes.
- `npx tsc -b` → clean; `npx eslint` on the changed and new files → 0 findings except `CreateStaffAccountModal.tsx`, which has the same 18 findings (17 errors, 1 warning) at `HEAD`; none added.
- Manual (isolated stack: scratch copy of the dev database, `REDIS_URL=` empty, plan limit 2 with 2 clinicians in use): as a Branch Manager with Permissions: Edit, the Practitioner group shows the panel; a Practitioner shared with another manager's clinic shows that clinic locked; the clinic list offers only the Branch Manager's own clinics; adding a clinic with overlapping hours shows the overlap message and changes nothing; adding with valid hours succeeds at the limit and the seat count stays 2 of 2; the Practitioner then sees that clinic's patient; removing the clinic removes the patient from their view; the last clinic's remove button is disabled; in the Staff form the other manager's clinic hours are locked and saving untouched keeps them. No console errors. The scratch stack and database were removed.

**Known limitations / unresolved issues:**
- Only Practitioners (Frontdesk / Finance later). A Practitioner without a permission group is not listed in the panel (use the Staff form). A clinic whose hours are not the same single block on each day is shown but can be edited only in the Staff form.
- A Practitioner who is also a Branch Manager would also show their managed clinics in the panel list (the assignment list does not flag managed rows).
- A Branch Manager sees the clinics they do not manage only as "Managed by another Branch Manager" (the other manager's name is not visible to them).
- The stored combined schedule is compared with the incoming one to decide what is "unchanged"; legacy rows whose stored times were formatted differently could be refused with the clear message and need saving once by the Owner.
**Regression risks:** Staff create/update clinician-limit behavior (now lenient for clinic changes; a new clinician is still refused at the limit); Diary, patient list and package visibility for Practitioners and Staff (active rows only); the public portal practitioner list; the Staff form schedule editor for Branch Managers.

---

## 2026-10-23 — Follow-up: a Branch Manager no longer sees the Branch Manager (or other Owner-only) permission groups

**Status:** Implemented and tested. No migration. Nothing committed.
**Module / feature:** Setup → Users → Permissions; `PermissionGroupViewSet` list/retrieve.

**Original behavior:** After "Branch Managers can manage only the Frontdesk, Practitioner and Finance groups", a Branch Manager could still see the Branch Manager group (read-only, with a lock) and the other Owner-only groups.
**Problem / requirement:** Owner report with screenshot (2026-10-23): a Branch Manager should only have the Frontdesk, Practitioner and Finance groups, and should not have the Branch Manager permission group at all.
**Reason for the change:** Hiding is cleaner than showing a locked card, and keeps Branch Manager permissions out of a Branch Manager's view.

**Files modified:** `accounts/views.py` (`get_queryset`: for list and retrieve, a Branch Manager gets only the Frontdesk, Practitioner and Finance groups; the Owner group stays hidden from everyone), `accounts/test_permission_group_rbac.py` (2 new tests), `frontend/.../users/Permissions.tsx` (list filter mirrors the backend; the Owner-only lock note and the Owner-only lock icons were removed since those groups no longer appear; the lock on a Branch Manager's own group remains when it is one of the three).
**Database / migrations:** None. **API / data contract:** `GET /api/permission-groups/` for a Branch Manager returns only those three templates; `GET /api/permission-groups/{id}/` for any other group returns 404. Writes to those groups still return 403 with the "Only the Owner…" message (unchanged).

**Business rules & decisions:** Supersedes the limitation noted in "Branch Managers can manage only the Frontdesk, Practitioner and Finance permission groups" ("A Branch Manager can still see (read-only) the Owner-only groups' levels"). Read-Only and Custom groups are also hidden from a Branch Manager.

**Tests executed:** `manage.py test apps.accounts` → 95 OK (93 + 2 new); `npx tsc -b --force` → clean; `npx eslint` on the screen and folder → 0 findings. Manual (isolated stack on a copy of the dev database): the API returns Finance, Frontdesk, Practitioner to both a Branch Manager with Permissions: Edit and one in the default Branch Manager group, and the Owner still gets the Branch Manager, Custom and the three other groups; the screen lists exactly Frontdesk, Practitioner and Finance ("GROUPS (3)") for both Branch Managers; no console errors. The scratch stack and database were removed.

**Known limitations / unresolved issues:** None known. A Branch Manager whose own group is not one of the three (the usual case) cannot see their own group's levels on this screen.
**Regression risks:** none outside this screen.

---

## 2026-10-23 — Branch Managers can manage only the Frontdesk, Practitioner and Finance permission groups

**Status:** Implemented and tested. No migration. Nothing committed.
**Module / feature:** Roles and permissions; Setup → Users → Permissions. See FEATURES "Roles & permissions".

**Original behavior:** A Branch Manager whose group granted Permissions: Edit could change, create, duplicate, delete and assign any group except the Owner's and their own, including the Branch Manager group, so they could widen the permissions of Branch Managers (including other managers).
**Problem / requirement:** Owner decision (2026-10-23, marked important): Branch Managers must not edit Branch Manager permissions; they should manage only the Frontdesk, Practitioner and Finance groups; the Owner and Branch Manager groups can be managed only by the Owner.
**Reason for the change:** Closes the way a Branch Manager could raise their own or another manager's access, and matches the chain of authority (the Owner decides what Branch Managers can do).

**Files modified (backend):** `accounts/models.py` (`BRANCH_MANAGER_MANAGEABLE_TEMPLATES`), `accounts/views.py` (`_assert_can_manage` refuses any other template for a non-Owner; create accepts only the three templates for a Branch Manager; duplicate checks the source and a Branch Manager's copy keeps its template, the Owner's copy stays Custom; `assign_user` hands out only the three groups), `accounts/serializers.py` (`validate_permission_group`: a non-Owner can give staff only those three groups; re-sending the current group is fine), `accounts/test_permission_group_rbac.py` (10 new tests).
**Files modified (frontend):** `permissions/meta.ts` (same list), `Permissions.tsx` (Owner-only groups open read-only for a Branch Manager with a note "Only the Owner can change this group. Branch Managers can manage the Frontdesk, Practitioner and Finance groups."; no Duplicate / Delete there), `GroupSidebar.tsx` (lock icon on those groups), `GroupModals.tsx` (a Branch Manager's New group offers only Frontdesk, Practitioner, Finance).

**Database / migrations:** None. **API / data contract:** Branch Manager requests that touch other groups now return 403 (create: 403 with a `role_template` message; user API: 400 on `permission_group`).

**Business rules & decisions:** Read-Only and Custom groups are also Owner-only (the rule names only the three, so everything else is the Owner's). The Owner is unchanged and can manage all groups, including handing any group to staff.

**Tests executed:** `manage.py test apps.accounts` → 93 OK (83 + 10 new); `check` clean. Mutation checks (each reverted): scope check removed → 2 failures; assign-user rule removed → 1; user-API group check removed → 1. `npx tsc -b --force` → clean; `npx eslint` on the screen and folder → 0 findings. Manual (isolated stack on a copy of the dev database, as a Branch Manager whose group grants Permissions: Edit): API: PATCH on the Branch Manager group → 403 "Only the Owner can change this group…", PATCH on Frontdesk / Practitioner / Finance → 200, creating a Branch Manager group → 403, creating a Frontdesk group → 201 with the Frontdesk template. Screen: the Branch Manager and the Locked Branch Manager (custom) groups show a lock in the list, no editable dropdowns (0), the note, and no Duplicate button; Frontdesk, Practitioner, Finance and the new Night Frontdesk show 32 dropdowns each and Duplicate; the New group modal offers only Frontdesk, Practitioner and Finance; no console errors. The scratch stack and database were removed.

**Known limitations / unresolved issues:** A Branch Manager can still see (read-only) the Owner-only groups' levels. Groups already assigned to staff before this change keep working (the rule limits what a Branch Manager can change or hand out, not existing assignments).
**Regression risks:** a Branch Manager who relied on editing Custom or Read-Only groups now needs the Owner to do it.

---

## 2026-10-23 — Follow-up: duplicate explanation removed from the "Other Branches' Diary" row

**Status:** Implemented and checked (type-check, lint, served module). Frontend only; nothing committed.
**Module / feature:** Setup → Users → Permissions (`permissions/meta.ts`).

**Original behavior:** The "Other Branches' Diary" row carried a long hint (View / Edit / No Access and patient lookup), and the "Branch access for Branch Managers" panel under the Diary card repeated the same information in its own banner.
**Problem / requirement:** Owner request (2026-10-23): the row hint is redundant; keep the panel's explanation because it is more precise and tied to the specific Branch Managers.
**Files modified:** `frontend/src/features/setup/pages/users/permissions/meta.ts` (hint removed; a comment points to the panel). The row, its dropdown and the panel are unchanged. The hints on Staff Management and Setup – Users (Branch Managers always have Edit) were not part of this request and stay.
**Database / migrations:** None. **API / data contract:** None.
**Tests executed:** `npx tsc -b --force` → clean; `npx eslint` on `meta.ts` → 0 findings; the running dev server serves `meta.ts` without the hint and `BranchAccessPanel.tsx` with its banner text. No browser run for this one-line removal.
**Known limitations / unresolved issues:** Someone who has not scrolled to the panel gets no explanation next to the row itself; the row is labelled "Other Branches' Diary" only.
**Regression risks:** none.

---

## 2026-10-23 — Follow-up: plain-language labels on the Permission Groups screen

**Status:** Implemented and tested. Frontend only; no API, database or migration change. Nothing committed.
**Module / feature:** Setup → Users → Permissions (`permissions/meta.ts`, `AccessControl.tsx`, `FeatureSections.tsx`, `Permissions.tsx`).

**Original behavior:** A row showed the feature name on the left and a bare level pill ("Edit") on the right, with nothing saying who the level applies to.
**Problem / requirement:** Owner request (2026-10-23): add good labelling, for example "Your branch manager can: | Edit |".
**Reason for the change:** The level only makes sense together with whose access it is; reading "Edit" alone is ambiguous when several groups exist.

**Files modified (frontend):**
- `permissions/meta.ts`: `AUDIENCE_LABELS` by template (Your branch managers / frontdesk staff / practitioners / finance staff / read-only users; "Members of this group" for custom groups).
- `permissions/FeatureSections.tsx`: every row shows "<audience> can:" in front of its level (dropdown, or the read-only badge for viewers who cannot change the group); the row wraps cleanly on narrow screens; the card counts now read "N can edit · N view only · N no access".
- `permissions/AccessControl.tsx`: the dropdown's accessible name now reads "<feature>. <audience> can: <level>. Change access level".
- `Permissions.tsx`: passes the audience of the selected group.

**Database / migrations:** None. **API / data contract:** None. **Business rules & decisions:** none changed; wording only.

**Tests executed:** `npx tsc -b --force` → clean; `npx eslint` on the screen and its folder → 0 findings. Manual (isolated stack on a copy of the dev database, headless Chromium, as Owner): the Branch Manager group shows "Your branch managers can:" before each level, Frontdesk "Your frontdesk staff can:", Practitioner "Your practitioners can:", Finance "Your finance staff can:", the custom group "Members of this group can:"; the dropdown's accessible name includes the same sentence; the card counts show the new wording; no horizontal overflow at 390 px; no console errors. The scratch stack and database were removed.

**Known limitations / unresolved issues:** "Your branch managers can: No Access" reads a little stiffly; the level names themselves were not reworded.
**Regression risks:** none outside this screen.

---

## 2026-10-23 — Follow-up: per-row level dropdown and per-card Save on the Permission Groups screen

**Status:** Implemented and tested. Frontend only; no API, database or migration change. Nothing committed.
**Module / feature:** Setup → Users → Permissions (`Permissions.tsx`, `permissions/AccessControl.tsx`, `permissions/FeatureSections.tsx`). Refines "Permission Groups screen redesign".

**Original behavior:** A header button "Edit permissions" switched the whole group into edit mode (a sticky Save / Discard bar). The level pill on each row ("Edit", "View", …) was a read-only badge, so clicking it did nothing.
**Problem / requirement:** Owner request (2026-10-23): remove the redundant "Edit permissions" button; make the level pill on each row work, opening a dropdown with No access / View / Edit; show Save changes only on the card that has changes.
**Reason for the change:** Editing is faster when the control is the value itself, and saving per card keeps one area's change from being tied to another's.

**Files modified (frontend):**
- `Permissions.tsx`: global edit mode removed (no header button, no sticky bar). Unsaved choices are held as `pending` (only features whose level differs from the saved one; choosing the saved level again clears it). `saveSection` saves one card: it sends the saved map with that card's changes applied (the API replaces the whole map), updates optimistically and rolls back on failure; other cards keep their pending changes. Switching group, duplicating or refreshing asks before discarding unsaved changes. Duplicate now has a text label.
- `permissions/AccessControl.tsx`: `LevelDropdown` replaces the three-way selector: a pill with a chevron that opens No Access / View / Edit with a one-line explanation each and a check on the current one; opens upward when there is little room below; closes on outside click or Escape; Arrow keys and Enter work. `AccessBadge` remains for viewers who cannot change the group.
- `permissions/FeatureSections.tsx`: each row uses the dropdown and shows a "Changed" marker; a card with changes gets an amber border and a footer strip "N unsaved changes in <card>" with Discard and Save changes (nothing is shown on cards without changes). ~~"Set all" per card~~ **Removed the same day** (owner: redundant next to the per-row dropdown); `setMany` and the `onSetMany` prop went with it.

**Database / migrations:** None. **API / data contract:** None.

**Business rules & decisions:** unchanged. Per-card save is a UI grouping only; the stored value is still one permission map per group.

**Tests executed:** `npx tsc -b --force` → clean; `npx eslint` on `Permissions.tsx` and `permissions/` → 0 findings. Manual (isolated stack on a copy of the dev database, headless Chromium, as Owner): no "Edit permissions" button and no Save button on load; the Dashboard pill opened a dropdown with the three options and "Edit" marked current; choosing View showed "1 unsaved change in Dashboard" and a Changed marker on that row only; changing Invoices added a second strip on Billing & Finance only; saving the Dashboard card stored Dashboard = view while Billing & Finance stayed pending; discarding that card restored Invoices to Edit (database: dashboard view, invoices edit); Enter opened a menu, ArrowUp moved focus, Enter selected and closed it, and Escape closed it; the bottom-most menu opened fully inside the viewport; no console errors. The scratch stack and database were removed.

**Known limitations / unresolved issues:** The pending changes are lost on a page reload (the browser is not warned, only in-app navigation between groups and refresh asks). The Branch access panel still shows the live (unsaved) "Other Branches' Diary" level, while the clinics it lists take effect only once that level is saved.
**Regression risks:** none outside this screen.

---

## 2026-10-23 — Permission Groups screen redesign, branch access panel, and a fix for creating groups

**Status:** Implemented and tested. No database or migration change. Nothing committed.
**Module / feature:** Setup → Users → Permissions (`frontend/src/features/setup/pages/users/Permissions.tsx` and the new `permissions/` folder); `accounts` permission-group API.

**Original behavior:** A stack of collapsed cards, each with a row of small No Access / View / Edit buttons that were only clickable after an edit icon. Choosing which clinics a Branch Manager manages or can open in the Diary was possible only in the Staff form. Creating a group from this page failed: the API required `clinic`, which the screen never sent, and its reply lacked the `id` and `permissions_map` the screen needed.
**Problem / requirement:** Owner request (2026-10-23): a professional, modern Permission Group screen with the same function (No Access / View / Edit); when the Owner sets the Diary for a Branch Manager, show a selection of which clinics get Diary and patient access, with "Add more branch" for the clinics the Branch Manager manages. Decisions: the selection is per Branch Manager inside the group; "Add more branch" exists for both lists (clinics they manage, and Diary & patient access to other clinics); patient access stays booking lookup only.
**Reason for the change:** Make the permission matrix quick to read and edit, and put the clinic choice where the Owner decides the Diary level.

**Files modified (frontend):**
- `Permissions.tsx` (rewritten): two-pane layout (group list left, selected group right), group summary with Full edit / View only / No access counts, feature search, unsaved-change tracking (a "Changed" marker per row and a Save / Discard bar), a confirm before discarding changes when switching group or refreshing, optimistic save with rollback (unchanged), live refresh on permission events (unchanged), own-group and Owner-group protection (unchanged).
- New in `pages/users/permissions/`: `meta.ts` (feature catalogue, template defaults and styles, moved unchanged from the old file), `AccessControl.tsx` (read-only badge and the three-way selector), `FeatureSections.tsx` (one card per area, per-area "Set all"), `GroupSidebar.tsx`, `GroupModals.tsx`, `BranchAccessPanel.tsx`.
- **Branch access panel** (Owner only; shown inside the Diary & Calendar card for Branch Manager groups): one card per Branch Manager in the group with two lists, each with "+ Add more branch": **Clinics they manage** (a clinic that already has another Branch Manager is disabled and shows "Managed by <name>"; the last clinic cannot be removed) and **Diary & patient access to other clinics** (follows the group's "Other Branches' Diary" level; disabled while it is No Access, and explains that patient access is booking lookup only). Changes save at once through the existing user update (`branch_ids`, `extra_diary_branch_ids`), keeping the manager's primary clinic first, and errors from the one-manager-per-clinic rule are shown.
**Files modified (backend):** `accounts/views.py` (`PermissionGroupViewSet.create`: the group's clinic is set server-side from the requester, a `clinic` in the payload is ignored, and the reply is the full group), `accounts/test_permission_group_rbac.py` (3 new tests).

**Database / migrations:** None. **API / data contract:** `POST /api/permission-groups/` no longer needs `clinic` and returns the full group (`id`, `member_count`, `permissions_map`, …); a `clinic` sent by a client is ignored.

**Business rules & decisions:** unchanged (see FEATURES): the Owner group stays hidden; clinic changes are Owner-only; a clinic can have one Branch Manager. The screen adds no new permission.

**Tests executed:** `manage.py test apps.accounts` → 83 OK (80 + 3 new); `apps.patients` → 141 OK; `check` and `makemigrations --check` clean. `npx tsc -b --force` → clean; `npx eslint` on the new screen and folder → 0 findings (the old file also had 0). Manual (isolated stack on a copy of the dev database, headless Chromium, as Owner): the page lists the five non-Owner groups with no Owner group; the Branch Manager group shows the branch panel with Branch Manager 2; the "clinics they manage" menu shows Clinics 1 and 2 disabled "Managed by Flow BM1 Flow"; adding Clinic 1 to Diary & patient access saved (database: Branch Manager 2's extra Diary clinic = Clinic 1, managed clinic still Clinic 3); in edit mode changing Dashboard to View and Other Branches' Diary to No Access showed "2 unsaved changes", turned the panel amber and disabled its Add button; searching "invoice" kept only Billing & Finance; Save stored the values (database: dashboard = view, diary_other_branches = none); at 390 px wide there is no horizontal page overflow; no console errors. A first screenshot showed the clinic menu clipped by its card and clinic names truncated; fixed and re-checked. The scratch stack and database were removed.

**Known limitations / unresolved issues:** The branch panel loads the staff list, so it appears for the Owner only. The screen was not checked with a Branch Manager who has Permissions: Edit, nor with keyboard-only navigation (the controls are buttons with roles and labels). On a phone the app's right-hand rail overlaps about 30 px of the page (existing layout).
**Regression risks:** anything importing from the old `Permissions.tsx` constants (none found; they moved to `permissions/meta.ts`).

---

## 2026-10-22 — Branch Manager clinics: one manager per clinic, staff management, Owner has no permission settings

**Status:** Implemented and tested. **Not applied to the development database or production:** migrations `accounts.0026_user_branch_access_is_managed` and `0027_one_branch_manager_per_clinic` (after `0024` and `0025`, which are also still unapplied on dev). Nothing committed.
**Module / feature:** Roles and permissions (Owner / Branch Manager); Setup → Staff and Permissions. See FEATURES "Roles & permissions" and ADR-005.

**Original behavior:** A Branch Manager's clinics were all their `UserBranchAccess` rows, which also hold practitioner assignments, so a Branch Manager who practised at another clinic wrongly "occupied" it. "One Branch Manager per clinic" was checked only when a user was saved with `branch_ids`; `PUT /users/{id}/roles/` and other paths skipped it, and nothing in the database enforced it. A Branch Manager creating staff was forced into their primary clinic and could not move staff. Their access to the Staff page followed their group's Staff Management / Setup – Users levels. The Owner group was listed and editable on the Permissions page and could be duplicated or assigned.
**Problem / requirement:** Owner decisions (2026-10-22): the Owner has no permission settings and always has full access (the Owner group is hidden); a Branch Manager can manage any number of clinics; no clinic may have two Branch Managers; a Branch Manager always manages the staff of their own clinics, choosing among their own clinics.
**Reason for the change:** Make the clinic-ownership rule real (database-enforced, one clear message on every path) and stop depending on a permission group for something that must always be true.

**Files modified (backend):**
- `accounts/models.py`: `UserBranchAccess.is_managed` and the constraint `one_branch_manager_per_clinic`; `User.get_managed_branch_ids()`; `get_managed_branches()` uses managed rows only; `BRANCH_MANAGER_ALWAYS_EDIT` (`staff_management`, `setup_users`) applied in `has_feature_permission`.
- `accounts/migrations/0026` (field + backfill + duplicate stop), `0027` (constraint).
- `accounts/utils/rbac.py`: `find_manager_conflicts`, `validate_branches_free_for_manager` (shared by the serializer, the roles endpoint and the views).
- `accounts/serializers.py`: Rule 1 validation via the helper; `_sync_branch_accesses` rewritten (locks rows, keeps a practitioner assignment when management ends, deletes a row that existed only for management); `_clear_managed_branches`; `manager_branches` shows managed clinics for Branch Managers; clinic scope for Branch Manager actors (`clinic_branch` and practitioner schedule blocks); `validate_permission_group`; `permissions_map` applies the always-edit rule.
- `accounts/views.py`: `create` (Branch Manager picks any managed clinic, default primary, foreign clinic → 403), `update` (moves staff between managed clinics; never changes which clinics anyone manages), `manage_roles` (optional `branch_ids`, rule check, frees clinics when the role is removed), archive frees managed clinics, scope reads use managed clinics (`clinics/views.py` too), debug `print` calls removed; `PermissionGroupViewSet`: Owner group hidden from list/retrieve, refused for create/update/delete/duplicate/assign for everyone, Owners take no group, a Branch Manager cannot change another Branch Manager's group.
- Tests: `accounts/test_branch_manager_rules.py` (28 new); fixtures in `patients` and `accounts` tests now mark manager rows as managed.

**Files modified (frontend):** `hooks/usePermissions.ts` (always-edit for Branch Managers), `Permissions.tsx` (no Owner card, no Owner template, hints on the two staff rows, intro line), `Staff.tsx` (builds clinic → manager map), `CreateStaffAccountModal.tsx` (Branch Manager picks among managed clinics; clinics held by another Branch Manager are disabled and show "Managed by <name>").

**Database / migrations:** `0026` adds `is_managed` (default False) and backfills it True for every branch-access row of a non-deleted Branch Manager (those rows came from the manager form). If a clinic already has two such managers the migration **stops, changes nothing** and prints each clinic with its managers; the owner removes the extra one and migrates again. Archived managers never block. `0027` adds the partial unique constraint. Reverse of `0026` is a no-op (the column is dropped); reverse of `0027` drops the constraint.
**API / data contract:** `PUT /api/users/{id}/roles/` accepts `branch_ids` when BRANCH_MANAGER is being set (400 with the current manager's name when a clinic is taken). `manager_branches` now lists managed clinics. `POST/PATCH /api/users/` by a Branch Manager: `clinic_branch` may be any managed clinic. `permission_group` on users: non-Owners cannot pick the Owner group, another clinic's group, or change their own. Permission-group endpoints answer 403 for any change to the Owner group and 400 for assigning it or assigning a group to an Owner.

**Business rules & decisions:** see FEATURES. Decided here: "managed" is a flag on the branch-access row (so practitioner assignments are not management); archiving or un-roling a Branch Manager frees their clinics; a deactivated (not archived) Branch Manager keeps theirs.

**Tests executed** (from `backend/`, `virt` environment):
- `manage.py test`, one app per command: `apps.accounts` → 80 OK (52 + 28 new); `apps.patients` → 141 OK; `apps.subscriptions` 49, `apps.common` 16, `apps.records` 7, `apps.support` 4, `apps.gateway` 49, `apps.smsgateway` 22, `apps.billing` 6 → all OK; `apps.clinical_templates` → 7 tests, 1 pre-existing error. `check` and `makemigrations --check` clean.
- New tests cover: several clinics per manager; the database constraint; Rule 1 on every path (user save, create, roles endpoint with rollback, role removal, archive); a practitioner assignment is not management; staff creation per own clinic, refused for a foreign clinic, move between own clinics only; staff edit stays with a group that says none; the Owner group hidden, locked and not assignable; the backfill and the duplicate stop (the migration leaves no column behind). Mutation checks (each reverted): Rule 1 helper disabled → failures; always-edit removed → failure; clinic scope removed → failure; Owner group listable → failure.
- **Migration rehearsal** on a `pg_dump` copy of the development database (scratch DB, `REDIS_URL=` empty, dropped afterwards; your database was only read): `0026` and `0027` applied; the two Branch Managers (different clinics) became managed; a second manager for a clinic was then refused by the database.
- Frontend: `tsc` clean; `eslint` on the 4 changed files has the same finding count as `HEAD`.
- Manual (isolated stack on the migrated copy, headless Chromium + live API): API as Owner giving Branch Manager 1's Clinic 2 to Branch Manager 2 → 400 "Clinic "Flow Clinic 2" already has a Branch Manager (Flow BM1 Flow)"; Permissions page shows no Owner card and says the Owner is not configured there; the Owner's form for Branch Manager 2 shows Clinics 1 and 2 disabled "Managed by Flow BM1 Flow" and Clinic 3 ticked; as Branch Manager 1 (group says no access to staff management, users, permissions or subscriptions) Setup still shows Users → Staff, the form offers exactly Clinic 1 and Clinic 2 ("You manage 2 clinics…") with no Owner or Branch Manager role cards, and via the API creating staff in Clinic 1 and 2 → 201, in Clinic 3 → 403, moving staff Clinic 2 → 1 → 200 and → 3 → 400; `permissions_map` shows staff_management and setup_users `edit`, subscriptions `none`. Typing a complete new-staff form through the browser did not register in my automation, so the create path was confirmed through the API rather than the form's submit button.

**Known limitations / unresolved issues:**
- Run `python manage.py migrate` on dev; until `0026` is applied the code errors on any branch-access query (the column does not exist).
- **Before deploying to production**, check for clinics with two Branch Managers, because the migration stops on them (see runbook).
- A Branch Manager who also practises: removing a clinic from their managed list keeps the row as a practitioner assignment.
- The Setup → Permissions page for a Branch Manager still follows the `permissions` level (view-only banner at None); only staff management and Setup – Users are always edit.
- Branch Manager staff scope is "staff whose branch or assignment is one of the managed clinics"; a staff member assigned to both a managed and a foreign clinic stays visible and editable.
- The assign-branch / update-branch-assignment (practitioner assignment) endpoints keep their previous scope rule (managed clinics ∪ primary clinic).
- Real-time updates and reports were not reviewed for the new managed-clinic meaning.

**Production runbook (migrations run automatically on deploy):**
1. On the **current** production code, before deploying, list clinics with more than one Branch Manager: `python manage.py shell -c "from collections import defaultdict; from django.db.models import Q; from apps.accounts.models import UserBranchAccess as R; seen=defaultdict(list); [seen[r.branch.name].append(r.user.email) for r in R.objects.filter(Q(user__roles__contains=['BRANCH_MANAGER'])|Q(user__roles__contains=['ADMIN_ASSISTANT']), user__is_deleted=False).select_related('user','branch')]; print({k:v for k,v in seen.items() if len(v)>1} or 'no clinic has two Branch Managers')"`. For each clinic listed, remove the extra manager's branch assignment (Setup → Staff) or change their role.
2. Back up the database.
3. Deploy (frontend first, then backend). The migrations apply automatically; if one stops, the message lists the clinics.
4. Smoke test: Owner → Staff (Branch Manager rows show their clinics; a taken clinic is disabled in another manager's form); Branch Manager → Staff → New Staff Member (clinic choice) and the Diary.
5. Rollback: redeploy the previous backend and run `python manage.py migrate accounts 0025` (drops the flag and constraint); data is otherwise untouched.

**Regression risks:** anything that reads a Branch Manager's `branch_accesses` as "their clinics" (now `is_managed` only: patient and package visibility, Diary scope, staff list, clinics list); tests or scripts creating manager rows without `is_managed=True`; staff forms for Branch Managers with one clinic (locked notice) versus several (select).

---

## 2026-10-22 — Follow-up: legacy role codes shown raw in the Staff table (rows not migrated yet)

**Status:** Implemented and tested. Migrations still **not applied** to the development database.
**Module / feature:** Roles (Owner / Branch Manager) — display and read-time handling. Follows "Rename roles: Admin → Owner, Admin Assistant → Branch Manager".

**Original behavior:** On the development database (rows still hold `ADMIN` / `ADMIN_ASSISTANT` because the rename migration has not been run), the Staff table's ROLE(S) column printed the raw codes: the badge lookup did `ROLE_LABEL[r] ?? r` and the staff list was not converted the way the logged-in user is. The same raw-code display existed in the invoice, consent, client-form and clinical-note email pickers and in chat. Worse, the backend read a legacy `ADMIN` row as nobody (`is_owner` was False).
**Problem / requirement:** Owner report: the table must show Owner and Branch Manager (the report wrote "Branch Owner", taken to mean Branch Manager, the name decided on 2026-10-22).
**Reason for the change:** The rename must be safe in the window between deploying the code and running `migrate`, in production as well as development.

**Files modified:**
- Backend: `accounts/models.py` (`get_effective_roles()` converts legacy codes on read; `is_owner` and `is_branch_manager` use it), `accounts/serializers.py` (user output never returns legacy codes), `appointments/views.py` (practitioner and staff payloads), `messages/views.py` (same rule as before, legacy code converted), `accounts/test_role_rename.py` (3 new tests).
- Frontend: `lib/roles.ts` (`roleLabel`, `normalizeRolesDeep`), `lib/axios.ts` (every API response is normalized), and the role displays in `StaffTableRow.tsx`, `TopNavigation.tsx`, `ProfileHeader.tsx`, `ChatWindow.tsx`, `ContactList.tsx`, `SendInvoiceEmailModal.tsx`, `SendConsentFormModal.tsx`, `SendClientFormModal.tsx`, `SendClinicalNoteModal.tsx` (they use `roleLabel`; an unknown code is shown in Title Case, never raw).

**Database / migrations:** None new. **API / data contract:** User payloads return `OWNER` / `BRANCH_MANAGER` even for rows not yet migrated.

**Business rules & decisions:** Legacy codes are aliases on read as well as on input until the aliases are removed. Database-level lookups (`roles__contains=['OWNER']`, `role__in=[...]`) cannot convert, so they only match after `migrate`: the "last Owner" protection counts, the Owner-without-branch rule in the practitioner list, and the messaging contact list. Run `migrate` promptly after a deploy (production runs it automatically).

**Tests executed:** `manage.py test apps.accounts` → 52 OK (49 + 3 new); `apps.patients` 141, `subscriptions` 49, `common` 16, `records` 7, `support` 4, `gateway` 49, `smsgateway` 22, `billing` 6 → all OK; `apps.clinical_templates` → 7 tests, 1 pre-existing error. `check` and `makemigrations --check` clean. Mutation check: `get_effective_roles` stops converting → 1 failure; restored → OK. Frontend: `tsc` clean; `eslint` on the 11 edited files has the same finding count as `HEAD` for each. `normalizeRolesDeep` and `roleLabel` run directly on a legacy payload (esbuild + node, not a committed test): pass. Manual: scratch copy of the dev database with only `accounts.0024` applied and three users written with the old codes (as in your database); the login API returned `OWNER`, and the Staff table showed Owner, Practitioner, Branch Manager and Owner with no raw codes and no console errors; the scratch DB and stack were removed afterwards.

**Known limitations / unresolved issues:** The database-level lookups above still need `migrate`. The response normalizer converts any `role`, `user_role` or `roles` value equal to `ADMIN` / `ADMIN_ASSISTANT` in every API response; it and the other aliases are removed in the later clean-up release.
**Regression risks:** Any non-role response field named `role`, `user_role` or `roles` that legitimately holds `ADMIN` (none found).

---

## 2026-10-22 — Rename roles: Admin → Owner, Admin Assistant → Branch Manager (codes, data and wording)

**Status:** Implemented and tested. **Not applied to the development database or production:** migrations `accounts.0025_rename_roles_owner_branch_manager`, `support.0004_rename_role_snapshots` and `appointments.0023_booking_source_owner` (and `accounts.0024`, still unapplied on dev). Nothing committed.
**Module / feature:** Roles and permissions (all apps); landing/manual/AI assistant wording. See FEATURES "Roles & permissions (Owner / Branch Manager)" and ADR-004. Earlier entries in this file use the old names; they are history.

**Original behavior:** The same two roles were named Admin / Administrator / Owner and Admin Assistant / Manager / Branch Manager in different places. Stored codes were `ADMIN` and `ADMIN_ASSISTANT` (plus a duplicate `MANAGER` permission-group template with identical defaults), used in about 180 places across about 55 files and stored in users, permission groups, the role-change audit log, support tickets and the appointment booking source.
**Problem / requirement:** Owner decision (2026-10-22): use only "Owner" and "Branch Manager" everywhere, in the database and the whole system, for local development and production data. Choices made: rename codes and labels with legacy codes accepted as input for a transition period; merge the `MANAGER` and `ADMIN_ASSISTANT` templates into `BRANCH_MANAGER`; convert history (audit log, support tickets); production runs migrations automatically on deploy.
**Reason for the change:** One vocabulary removes confusion for owners, staff and support, and the stored data matches the screens.

**Files modified (backend):**
- `apps/accounts/roles.py` (new): role constants, `LEGACY_ROLE_ALIASES`, `LEGACY_TEMPLATE_ALIASES`, `normalize_role`, `normalize_roles`, `normalize_template`, `normalize_role_payload`.
- `apps/accounts/models.py`: new `ROLE_CHOICES` / `TEMPLATE_CHOICES`, `DEFAULT_PERMISSIONS` and `ROLE_DEFAULT_PERMISSIONS` keys, `User.save()` converts legacy codes, `User.is_owner` and `User.is_branch_manager` replace `is_admin` / `is_manager`.
- `apps/accounts/serializers.py`, `views.py`, `signals.py`, `utils/rbac.py`; `apps/common/permissions.py` (`IsOwnerOnly`, `IsOwnerBranchManagerOrStaff`); and every other literal or check in `appointments`, `patients`, `messages`, `notifications`, `support`, `clinics`, `subscriptions`, `clinical_templates`, `reports`, plus the tests. The API field `is_manager` is now `is_branch_manager`.
- Wording: error messages, emails and the AI assistant prompt (`common/services/gemini_service.py`).
- Migrations (new): `accounts/0025` (schema choices + data), `support/0004`, `appointments/0023` (booking source `admin` → `owner`). Each has a reverse.
- `accounts/management/commands/report_role_codes.py` (new, read-only; `--strict` fails if a legacy code remains).
- Cache: practitioner list keys are now `practitioners_v2_*` so cached lists with old codes are never served.
- Tests (new): `accounts/test_role_rename.py` (10).

**Files modified (frontend):** `lib/roles.ts` (new: constants, labels, `normalizeUser` and friends); `store/auth.store.ts` and `services/authService.ts` (cached and fetched users are normalized, so a login saved before the deploy still works); `types/auth.ts`, `usePermissions.ts`, `Permissions.tsx` (one "Branch Manager" template), `PermissionGroupService.ts`, `CreateStaffAccountModal.tsx`, `StaffTableRow.tsx`, `TopNavigation.tsx`, `ProfileHeader.tsx`, `Diary.tsx` and about 20 more files for literals and wording; pricing and plan copy ("Unlimited Owner, Branch Manager and staff accounts"); user manual chapters 1, 6–12 and 25 (screenshots in the manual still show the old labels).

**Database / migrations:** `accounts.0025` converts `users.role` and `users.roles`, `permission_groups.role_template` (`ADMIN_ASSISTANT` and `MANAGER` → `BRANCH_MANAGER`), the seeded group name "Admin Assistant" → "Branch Manager" (if the clinic already has a group of that name the seeded one becomes "Branch Manager (default)"; names people chose are never touched) and its default description, and `user_role_change_log` (`role`, `roles_before`, `roles_after`). `support.0004` converts `user_role`; `appointments.0023` converts booking source `admin` → `owner`. Mapping tables are written inside the migrations (not imported). The reverse maps back; the `MANAGER` / `ADMIN_ASSISTANT` template merge cannot be split again, so reversed groups come back as `ADMIN_ASSISTANT`.
**API / data contract:** Roles and templates are returned as `OWNER` / `BRANCH_MANAGER`; legacy codes are accepted on input (user create/update, `PUT /users/{id}/roles/`, permission-group create/update). User payloads: `is_manager` → `is_branch_manager`. **Deliberately unchanged:** the owner-registration paths (`register-admin`, `send-admin-otp`, `verify-admin-otp`), the plans field `unlimited_admins`, and the "System Admin" label on support tickets (renaming them would break older frontends during the rollout and gives no user-visible gain).

**Business rules & decisions:**
- Names: Owner and Branch Manager only; never Admin, Administrator, Admin Assistant or Manager for these roles.
- Legacy codes are input aliases only and are removed in a later release (follow-up).
- Behavior is meant to be identical apart from names. Exception handled on purpose: four existing checks compared against `OWNER` / `MANAGER`, codes no user ever held, so they never matched (support feedback "see all", internal-comment visibility, and permanent deletion of cases). The rename would have switched them on, so they were made explicitly inert with empty tuples (`FEEDBACK_ADMIN_ROLES`, `CASE_HARD_DELETE_ROLES`) and recorded as findings below. Owner decision: keep behavior identical.
- Retained as before: Owners are still mapped to the Branch Manager template group when a group is derived from roles (the Owner bypasses group checks anyway).

**Tests executed** (from `backend/`, `virt` environment, throwaway test databases):
- `manage.py test`, one app per command: `apps.accounts` → 49 OK (39 earlier + 10 new); `apps.patients` → 141 OK; `apps.subscriptions` → 49 OK; `apps.common` → 16 OK; `apps.billing` → 6 OK; `apps.records` → 7 OK; `apps.support` → 4 OK; `apps.smsgateway` → 22 OK; `apps.gateway` → 49 OK; `apps.messages` → 0 tests. `apps.clinical_templates` → 7 tests, **1 error** (`test_print_note_displays_creator`), **pre-existing**.
- `manage.py check` → no issues. `makemigrations --check --dry-run` → No changes detected.
- New tests cover: forward and backward conversion of every table (including the group-name conflict and custom names), the report command (clean and with a planted legacy value), booking source conversion, legacy codes on input (model, role endpoint, permission-group template), the new seeded group, and a source scan that fails if a legacy role code appears outside `roles.py` and migrations. The first run of these tests caught a real bug in my migration (`bulk_update` on the wrong object), fixed.
- Mutation checks (each reverted): no normalization in `User.save()` → 1 failure; migration skips the audit log → 1 failure; serializer stops accepting legacy templates → 1 failure.
- **Migration rehearsal** on a `pg_dump` copy of the development database (scratch DB, `REDIS_URL=` empty, dropped afterwards; your database was only read): before, 5 `ADMIN`, 2 `ADMIN_ASSISTANT`, 13 `PRACTITIONER` users and 7 seeded groups per template; after the forward migration, 5 `OWNER`, 2 `BRANCH_MANAGER`, 13 `PRACTITIONER`, 7 groups per template named Branch Manager / Finance / Frontdesk / Owner / Practitioner, and `report_role_codes --strict` reported no legacy codes; after reversing, the 28 legacy values were back; after re-applying, clean again.
- Frontend: `npx tsc -b --force` → clean. `npx eslint` on all 83 changed frontend files, compared file by file with `HEAD`: none worse. `normalizeUser` run directly on legacy-shaped users (esbuild + node, not a committed test): `ADMIN` / `['ADMIN','PRACTITIONER']` → `OWNER` / `['OWNER','PRACTITIONER']`, `is_manager` → `is_branch_manager`, `ADMIN_ASSISTANT` → `BRANCH_MANAGER` → pass.
- Manual (isolated stack on the migrated scratch copy, headless Chromium): the API returns `OWNER` and `is_branch_manager` (no `is_manager`); as Owner, the top bar, the staff list badges, the New Staff Member role cards and the Permission Groups page all say Owner / Branch Manager; as Branch Manager, the top bar says Branch Manager and the Diary loads; no console errors. A screenshot review caught leftover text my text check missed ("Branch management & admin" on the role card) plus two "admin" messages in the appointment form; fixed.

**Known limitations / unresolved issues:**
- ~~**Do not run the new code against an unmigrated database.** … Owners lose their Owner access in the meantime.~~ **Superseded (2026-10-22, see "Follow-up: legacy role codes shown raw"):** the code now reads legacy rows as Owner / Branch Manager, so an unmigrated database keeps working. `python manage.py migrate` is still needed (it also applies `accounts.0024`), mainly so the stored data matches and the database-level lookups below match.
- Four dead role checks were kept inert (see Business rules). Findings for a later decision: support feedback "see all" for Owners/Branch Managers would also need a clinic filter (`UserFeedback` is not scoped per clinic, so "all" would span clinics); permanent case deletion has never been allowed to anyone.
- Creating a permission group from the UI ("New Group") likely fails: the API requires `clinic` and the UI payload does not send it. Pre-existing at `HEAD`; not changed and not checked in a browser.
- Two model `help_text` strings still say "admin" (`clinics.Clinic`, `accounts.User`); changing them would add migrations for no visible effect.
- User manual screenshots still show the old labels. Older entries in this file keep the old names.
- Legacy aliases (backend and frontend) must be removed in a later release, after every client has been updated.

**Production runbook (migrations run automatically on deploy):**
1. Back up the production database and note the time.
2. On production (current code), run `python manage.py report_role_codes` and keep the output.
3. Deploy the **frontend first** (it understands both old and new codes), then the backend; migrations run on deploy (accounts, then support and appointments).
4. Run `python manage.py report_role_codes --strict`: expect no legacy codes and the same number of users per role as in step 2 under the new names.
5. Smoke test: Owner login → Setup → Staff and Permissions; Branch Manager login → Diary of their branch.
6. Rollback: redeploy the previous backend and run `python manage.py migrate support 0003`, `migrate appointments 0022`, `migrate accounts 0024` (data is mapped back); if anything is wrong, restore the backup.

**Regression risks:** anything that still sends or reads `ADMIN` / `ADMIN_ASSISTANT` / `is_manager` (outside clients, scripts, saved reports); permission-group seeding for new clinics (now "Branch Manager"); cached practitioner lists (new key prefix); role badges and labels in screens not opened during the manual check.

---

## 2026-10-22 — RBAC: "Other Branches' Diary" for Managers, and permission-group escalation fix

**Status:** Implemented and tested. **Not applied to the development database:** migration `accounts.0024_user_extra_diary_branches`. Nothing committed.
**Module / feature:** Roles & permissions (Owner / Manager); Diary and Calendar; Permission Groups; Staff form. See FEATURES "Roles & permissions (Owner / Manager)" and ADR-003.

**Original behavior:** A Manager (`ADMIN_ASSISTANT`, shown as Admin Assistant / Branch Manager) could only open the branches in their `UserBranchAccess` rows; `?clinic_branch=<other>` returned 403 and the Diary tabs of other branches were disabled. There was **no** setting on the Permission Groups page to change this (the owner expected one; none existed in code or git history). Separately, permission-group create/update/duplicate/delete was open to Managers **and Staff** (`IsAdminOrStaffOnly`), and only Owner-template groups were protected, so any such user could edit their own group and grant themselves any access.
**Problem / requirement:** Owner decisions (2026-10-22): add a permission-group setting that lets Managers open other branches' Diary; the Owner picks which branches per Manager; scope is the Diary plus a patient lookup for booking (patient records, invoices, reports stay hidden); fix the permission-group escalation; leave other findings for later.
**Reason for the change:** Give the Owner the control they believed existed, without touching how seats, schedules and the one-Manager-per-branch rule use `UserBranchAccess`, and close the hole that made any group setting meaningless.

**Files modified (backend):**
- `apps/accounts/models.py` — feature key `diary_other_branches` (default `none` for every non-Owner template); `User.extra_diary_branches` (M2M to `Clinic`).
- `apps/accounts/migrations/0024_user_extra_diary_branches.py` — additive.
- `apps/accounts/utils/rbac.py` — `get_extra_diary_branch_ids`, `get_diary_branch_ids`, `validate_diary_branch` (read vs write branch lists).
- `apps/accounts/serializers.py` — read: `extra_diary_branches`, `diary_branches`, `diary_other_branches_level`; write: `extra_diary_branch_ids` (Owner only, same clinic group, own branches dropped, only Managers keep any, cleared when the Manager role is removed).
- `apps/accounts/views.py` — `PermissionGroupViewSet`: `_assert_can_manage`; permission checked before payload validation in `create`.
- `apps/appointments/views.py` — `DiaryBranchScopeMixin` on `AppointmentViewSet`, `BlockAppointmentViewSet`, `CalendarNoteViewSet`: reads use the read list, unsafe methods the write list; creates and updates into a granted branch at View level are refused.
- `apps/patients/views.py`, `urls.py` — `BookingPatientLookupView`.
- Tests (new): `apps/accounts/test_diary_branch_access.py` (24), `apps/accounts/test_permission_group_rbac.py` (10).

**Files modified (frontend):** `types/auth.ts`, `hooks/usePermissions.ts`, `features/setup/pages/users/Permissions.tsx` (new row with hint; template defaults; `canManage` follows the backend rule), `features/setup/components/modals/CreateStaffAccountModal.tsx` + `types/staff.types.ts` (Owner-only picker), `features/appointments/Diary.tsx` (tabs, "View only" badge, `readOnly`), `Calendar.tsx` (`readOnly`: no slot create, drag, resize, hover "+"), `components/AppointmentView.tsx` (wrapper; read-only shows the new `AppointmentReadOnlySummary.tsx`; profile link hidden for granted branches), `components/SelectOptionModal.tsx` and `AppointmentModal.tsx` (booking lookup), `features/patients/patient.api.ts` (`searchBookingPatients`).

**Database / migrations:** `accounts.0024` adds the many-to-many table `users_extra_diary_branches`. No data migration: groups without the new row already read as `none`.
**API / data contract:** User payloads gain `extra_diary_branches`, `diary_branches`, `diary_other_branches_level` (read) and `extra_diary_branch_ids` (write, Owner only; 400 otherwise). New `GET /api/patients/booking-lookup/?branch=<id>[&search=<text>][&patient=<id>]`: requires the Diary write level for that branch (Owner: any); returns only `id`, names, patient number, date of birth and open cases; at most 50. Permission-group write endpoints now return 403 where they used to succeed.

**Business rules & decisions:**
- Level comes from the permission group row "Other Branches' Diary": None (default) = own branches only; View = open the picked branches' Diary read-only; Edit = also book, move, cancel and add blocks/notes there. The Owner always has full access.
- Which branches: chosen per Manager by the Owner in Staff Management. A granted branch is not a managed branch (no seats, schedules or manager-per-branch effects).
- Patient records, invoices and reports of a granted branch stay hidden; only the booking lookup reaches its patients. In a granted branch at View level, appointment details show a summary only, block details do not open, and the backend refuses writes.
- Permission groups: only the Owner, or a Manager whose group grants Permissions: Edit, may create, change, duplicate or delete; nobody except the Owner may change or delete the group they belong to; Managers never touch Owner groups.

**Tests executed** (from `backend/`, `virt` environment, throwaway test databases):
- `manage.py test apps.accounts` → 39 tests, OK (5 existing + 24 + 10 new). `apps.patients` → 141 OK. `apps.subscriptions` → 49 OK. `apps.common` → 16 OK. `apps.billing` → 6 OK. `apps.appointments` and `apps.clinics` have no tests (0 run).
- `apps.clinical_templates` → 7 tests, **1 error** (`test_print_note_displays_creator`). **Pre-existing** (see earlier entries).
- `manage.py check` → no issues. `makemigrations --check --dry-run` → No changes detected.
- Mutation checks (each reverted): editing the own group allowed again → 4 failures; read and write branch lists merged → 4 failures; view-only create guard removed → 1 failure.
- Frontend: `npx tsc -b --force` → clean. `npx eslint` on every changed existing file: same finding count as at `HEAD` (two files were +1/+2 at first and were fixed); new file `AppointmentReadOnlySummary.tsx` → clean.
- Manual (isolated scratch DB with `REDIS_URL=` empty, headless Chromium; scratch stack and DB removed afterwards): as a Manager at level None the granted branch's tab stays disabled; at View it is enabled with a "View only" badge, shows the appointment, opens the read-only summary, and a double-click on an empty slot opens nothing; at Edit the full appointment view and the create menu open, the booking lookup finds the Branch B patient, the open case is offered, and the booking was saved in Branch B (checked in the database). As Owner: the Permission Groups page shows the new row with its hint; the Manager's staff form shows the picker with the saved branch ticked, and a save from the UI stored Branch B and Branch C while leaving the Manager's own branch unchanged. This pass caught two bugs, both fixed: the page crashed when lookup results were shown (missing `full_name`), and the case list stayed empty when the patient was pre-selected (cases are now held in state).

**Known limitations / unresolved issues:**
- **Until `manage.py migrate` is run, the user endpoints on the development database error** (the running server already loads the new field). This affects login and `/auth/me`.
- Not fixed (recorded; owner chose to limit scope): F5 creating an appointment into a branch the user cannot view works by calling the API directly (the new guard only covers granted branches); F6 `PractitionerScheduleViewSet` and `AppointmentReminderViewSet` return every clinic's rows to any Owner; F7 Diary/Calendar/Appointments "View" is not read-only for users in their own branch, and no backend view enforces those feature levels; F8 a Manager's branch assignment is not checked against the actor's clinic group; F9 a Manager with no `UserBranchAccess` but a `clinic_branch` sees no patients while the Diary falls back to the branch.
- A user can still be assigned a different permission group by anyone who can edit users; that path was not reviewed.
- At View level the Calendar's resize handles still show but do nothing.
- Real-time calendar events (WebSocket) were not reviewed for branch scoping.
- Not tested in a browser: the Manager at View/Edit on the Calendar page (only the Diary).

**Regression risks:** Diary and Calendar branch scoping for Managers; permission-group management by Managers (anyone who edited groups without Permissions: Edit now gets 403); `AppointmentView` is now a thin wrapper around `AppointmentViewFull`; staff form payloads gain `extra_diary_branch_ids` for the Owner only.

---

## 2026-10-22 — Live demo and staff training offer (item 7 revised)

**Status:** Implemented and tested. Nothing deployed or committed; no migrations.
**Module / feature:** Landing site (FAQ, Contact); AI chat assistant. See FEATURES "Subscriptions & pricing".

**Original behavior:** The 2026-10-21 pricing revision removed every training claim and the FAQ, Contact page and AI assistant said "We do not offer live or on-site training".
**Problem / requirement:** Owner confirmed training is available: free live demo, staff training on request, on-site only within the Negros Island Region, scheduled in advance. Entry points: FAQ and Contact page only (hero stays at three buttons).
**Reason for the change:** The earlier text understated what the business offers. The old over-promises ("one-on-one training for Enterprise", "comprehensive training for all staff") are deliberately not restored.

**Files modified:**
- `frontend/src/features/landing/data/support.ts` — `ONSITE_TRAINING_AREA`, `TRAINING_SUMMARY`, `DEMO_REQUEST_MAILTO` (to `SUPPORT_EMAIL`, subject "Live Demo / Staff Training Request", body asks for clinic, location, request type, online/on-site, staff count and two preferred times).
- `frontend/src/features/landing/data/faqs.ts` — training FAQ rewritten; `FAQ` gets an optional `link`.
- `frontend/src/features/landing/components/FAQ.tsx` — renders the optional link; the "Contact our support team" link used the stale address `support@mespms.com` and now uses `SUPPORT_EMAIL`.
- `frontend/src/features/landing/components/footer-pages/Company/Contact.tsx` — training FAQ answer replaced; new "Live Demo & Training" card with a "Schedule a Live Demo" link.
- `backend/apps/common/services/gemini_service.py` — section 9: training removed from the "does NOT offer" line; the offer and its limits added (never promise on-site outside the region, a date, a price, or one-on-one training as a plan feature).
- `backend/apps/common/test_assistant_prompt.py` — support test updated; new `test_training_offer_is_stated_with_its_limits`.

**Database / migrations:** None. **API / data contract:** None.

**Business rules & decisions:**
- Free live demo (online or on-site). Staff training on request for every plan; the site quotes no price and says fees are confirmed when scheduling.
- On-site visits only within the Negros Island Region (Negros Occidental, Negros Oriental, Siquijor). Online sessions are not area-limited. The online option was an assumption in the approved plan; remove the word "online" from `support.ts` if sessions are in person only.
- Scheduling is by email request only; there is no booking system.
- Superseded (2026-10-22): the 2026-10-21 rule "No live or on-site training" (see CHANGELOG 2026-10-21 and FEATURES).

**Tests executed:**
- `manage.py test apps.common` (from `backend/`) → 16 tests, OK. Mutation check: the old "does NOT offer … live training or on-site training" line put back → 2 failures (`test_support_promises_are_limited_to_what_exists`, `test_training_offer_is_stated_with_its_limits`); restored → 16 OK.
- `manage.py check` → no issues. `npx tsc -b --force` → exit 0. `npx eslint` on the 4 changed frontend files → exit 0.
- Sweep for "do not offer live", "one-on-one", "live training" in `frontend/src` and `backend/apps` → only the prompt's own prohibition line and the test.
- Manual (headless Chromium against the running dev frontend, no API calls, desktop 1440 px and mobile 390 px): FAQ training answer shows the Negros limit and the schedule link; the decoded `mailto:` has the correct address, subject and seven body lines; the Contact card and FAQ match; no horizontal overflow; no console errors, exceptions or failed requests. A first pass showed the card link looking like plain text; restyled and re-checked.

**Known limitations / unresolved issues:**
- The Contact page form does not send anything (`handleSubmit` only logs to the console), so it cannot be used for scheduling. Pre-existing; not changed here.
- The Contact page still shows `info@malasakit.com`; everything else uses `support@malasakitpms.ph`. Another stale address, `support@mespms.com`, remains on `auth/RegisterSuccess.tsx` (outside this change).
- The Pricing page and the "Guided Onboarding & Support" feature card are not changed and do not mention the demo.

**Regression risks:** the AI assistant now answers training questions from the new prompt text; re-read a few answers after the next deploy.

---

## 2026-10-21 — Pricing, 12-month term and cancellation, compliance and support wording, hero CTAs

**Status:** Implemented and tested. **Not deployed:** migrations `subscriptions.0004` and `0005` are not applied to the development database (`showmigrations` at the end of this work), and `backfill_subscription_terms` has not been run on real data. No PayMongo checkout was run in test mode.
**Module / feature:** Subscriptions; landing and legal pages; in-app Subscription page; AI chat assistant. See FEATURES "Subscriptions & pricing" and ADR-002.

**Original behavior:** Prices and rules were copied into four places that disagreed (backend `plans.py`, landing `Plans.tsx`, footer `Pricing.tsx`, in-app text, plus the user manual). Branch add-on was 2,000/2,500/3,000 per month by tier. Annual price was not exactly 10% off. A clinician at 2 branches used 2 seats. Plans were shown with a monthly/annual toggle. The 12-month commitment was stored but not tracked (each payment reset `start_date`) and there was no cancellation feature. Public pages and the AI assistant claimed HIPAA compliance, SOC 2 / ISO 27001 / GDPR certification, free data migration, 24/7 and phone support, account managers, live/on-site training and "cancel anytime". The hero had two buttons and a small text link.
**Problem / requirement:** Owner brief of 2026-10-21, eight items: (1) flat ₱2,000 additional branch with a clinician limit shared across branches, (2) "HIPAA-aligned" and a Data Privacy Act security FAQ, (3) Starter / Growth / Enterprise with monthly and annual side by side at 10% off, (4) no data-migration claim unless real, (5) advertise only support that exists, (6) 12-month minimum with cancellation effective at term end, (7) no live or one-on-one training claims, (8) three consistent hero CTAs.
**Reason for the change:** Make the product, the price list, the Terms and the assistant say the same true thing, with the backend as the single source of truth for prices.

**Files modified (backend):**
- `apps/subscriptions/plans.py` — prices, shared branch constants, `ANNUAL_DISCOUNT_PERCENT`, display names (codes unchanged), summary exposes `annual_discount_percent`.
- `apps/subscriptions/models.py` — term and cancellation fields, `SubscriptionEvent`, `request_cancellation` / `withdraw_cancellation` / `apply_scheduled_cancellation`, `activate_plan` starts a term only when none is running.
- `apps/subscriptions/services.py` — one seat per clinician; usage summary adds term and cancellation fields.
- `apps/subscriptions/views.py`, `urls.py` — `SubscriptionCancelView`, `SubscriptionCancelWithdrawView`.
- `apps/subscriptions/management/commands/backfill_subscription_terms.py` (new) — dry run by default, `--apply` to write.
- `apps/common/services/gemini_service.py` — assistant prompt rebuilt; plan lines are generated from `PLAN_CATALOG` so they cannot drift.
- `apps/clinical_templates/models.py` — docstring wording only.
- Tests: `apps/subscriptions/tests.py` (updated), `test_term_cancellation.py` (new), `apps/common/test_assistant_prompt.py` (new, 5 tests).

**Files modified (frontend):**
- In-app: `Subscription.tsx`, `UpgradeSubscriptionModal.tsx`, `SubscriptionTermCard.tsx` (new), `subscription.utils.ts`, `subscription.api.ts`, `useSubscription.ts`.
- Public: `data/pricing.ts` and `data/support.ts` (new shared data), `Plans.tsx`, `footer-pages/Product/Pricing.tsx`, `public/pricing/PlanCard.tsx`, `public/pricing/PricingExplainer.tsx` (new), `Hero.tsx`, `data/faqs.ts`, `data/features.ts`, `Security.tsx`, `Legal/OWASPCompliance.tsx`, `Legal/PrivacyPolicy.tsx`, `Legal/TermsOfServices.tsx`, `Legal/CookiePolicy.tsx`, `Company/Contact.tsx`, `Company/Blog.tsx`, `Footer.tsx`, `auth/AdminRegister.tsx`, `user-manual/chapters/Chapter25.tsx`. **Deleted:** `public/pricing/BillingToggle.tsx`, `data/plans.ts` (legacy ₱199 plan; nothing imported either).

**Database / migrations:** `0004_plan_display_labels` (choices labels only, no schema change); `0005_subscription_term_and_cancellation` (six nullable columns on `Subscription`, new table `SubscriptionEvent`). Additive.
**API / data contract:** New `POST /api/subscription/cancel/` `{reason}` (ADMIN only, 403 otherwise; 400 for blank reason, trial, inactive, already pending) and `POST /api/subscription/cancel/withdraw/`; both return the usage summary. `GET /api/subscription/status/` adds `term_start`, `term_end`, `cancellation_pending`, `cancellation_requested_at`, `cancellation_effective_at`, `cancellation_reason`, `can_request_cancellation`. `GET /api/subscription/plans/` adds `annual_discount_percent`; plan `name` for code `PROFESSIONAL` is now "Enterprise" and for `ENTERPRISE` is "Custom".

**Business rules & decisions:**
- Prices: Starter ₱3,999/mo or ₱43,189.20/yr; Growth ₱6,999 or ₱75,589.20; Enterprise ₱9,999 or ₱107,989.20. Annual is monthly × 12 × 0.90 exactly. Additional branch ₱2,000/mo or ₱21,600/yr on every tier (Growth + 1 branch = ₱8,999/mo). Owner decisions of 2026-10-21.
- Clinician limit is shared across branches; a clinician counts once. Archived and inactive practitioners still count until permanently deleted (unchanged).
- 12-month minimum term, paid monthly or annually. A cancellation request always takes effect at `term_end`, never earlier; no refund for the remaining term. Owner only; reason required; can be withdrawn before the effective date. Every action is written to `SubscriptionEvent`.
- Enforcement is lazy (when the subscription is read), like the existing expiry. There is no scheduler.
- Support promised on public pages: email and in-app ticket, Monday to Friday 9:00 AM to 6:00 PM Philippine Time, reply within one business day. No phone, 24/7 or account managers. ~~Live or on-site training~~ — **Superseded (2026-10-22, see the CHANGELOG entry "Live demo and staff training offer")**: free live demos and staff training are offered, on-site within the Negros Island Region. Only self-service patient import (CSV/XLSX) is advertised as data migration.
- Customer-facing security wording: "HIPAA-aligned" practices and the Data Privacy Act; no certification claims; the "AES-256" claim removed (the code uses Fernet).
- Superseded (2026-10-21): "1 allocation per assigned branch" seat rule; the 2,000/2,500/3,000 branch add-on; the old annual prices; "cancel anytime".

**Tests executed** (from `backend/`, `virt` environment, throwaway test databases):
- `manage.py test apps.subscriptions` → 49 tests, OK. `apps.common` → 15 OK. `apps.patients` → 141 OK. `apps.billing` → 6 OK. `apps.accounts` → 5 OK.
- `apps.clinical_templates` → 7 tests, **1 error** (`test_print_note_displays_creator`). **Pre-existing**, reproduced on a clean `HEAD` earlier in this project.
- `manage.py check` → no issues. `makemigrations --check --dry-run` → No changes detected.
- Mutation checks (each reverted): seat rule changed back (2 failures); cancellation made immediate (4 failures); term reset on renewal (3 failures).
- Frontend: `npx tsc -b --force` → exit 0. `npx eslint` on the 25 changed files → 3 errors, all in `UpgradeSubscriptionModal.tsx` and identical at `HEAD` (two `any`, one unused `err`); no other findings.
- Claims sweep: `grep` for "HIPAA compliant", "24/7", "cancel anytime", "Professional Plan", "₱2,500", "₱3,000", "Watch Demo", "SOC 2", "ISO 27001", "free migration", "on-site training", "dedicated account manager" and the old phone number in `frontend/src` and `backend/apps` → the only hits are explicit "we do not offer" statements and code comments.
- Manual (isolated scratch DB, `REDIS_URL=` empty, headless Chromium, owner account): in-app Subscription page showed the term card with dates, the end-of-term wording, the new seat and branch notes, Starter / Growth / Enterprise / Custom names; the cancel dialog required a reason and stated the term end and no refund; the pending banner, persistence across reload and withdraw all worked; the checkout dialog opened on Enterprise Annual with ₱107,989.20 and a ₱21,600 branch added, total ₱129,589.20; no console errors or failed requests. Landing, `/pricing`, Contact, Security, Terms and the three hero buttons were checked the same way. The scratch stack and database were removed afterwards.

**Known limitations / unresolved issues:**
- The dev server loads the new model fields, so **until `manage.py migrate` is run, subscription endpoints on the dev database will error**.
- The backfill command is untested on real data; run it as a dry run first.
- PayMongo was not exercised (a test-mode Growth annual + 1 branch checkout should be ₱97,189.20). The webhook path through `activate_plan` is covered by unit tests only.
- A monthly payer who stops paying is still handled by the existing lapse rules; term-based cancellation does not change that.
- Not decided by the owner (built as recommended, please confirm): renewal after the first term (current build: no auto-renewal, each payment is a checkout); owner-only cancel; the 30-day post-cancellation data-access promise was dropped because the code has no such feature; existing annual customers pay the new annual price at renewal (Starter +₱189.20, Growth +₱589.20); support hours and the public address `support@malasakitpms.ph` (Contact previously used `info@malasakit.com`).
- User-manual screenshots in Chapter 25 still show the old subscription UI; the text was updated.
- The seat-count change attributed to a Gemini session was not in this repository, so it was implemented here.

**Regression risks:** anything reading `Subscription.start_date` as the term start (it still moves with each payment; use `term_start`); callers that compared plan display names (`PROFESSIONAL` now reads "Enterprise"); clinician-limit checks for users with several branch accesses (now counted once).

---

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

# Letter templates and generated letters

**Status (2026-10-24):** §1–§5 describe the behavior **before** the 2026-10-24 enhancement (recorded from the code). Findings F1, F2, F3, F8 and F9 were **resolved the same day** (see CHANGELOG "Letter templates: professional editor, real letterhead preview…" and the update box in §6); the others are still **Proposed**.
**Related:** [FEATURES.md → Letters & letter templates](../FEATURES.md#letters--letter-templates) · [CHANGELOG](../CHANGELOG.md) (entry "Letter templates: analysis")

## 1. What it is

Clinics write a **letter template** once (referral, report, certificate, general) and then generate a **letter** from it for a patient. The template is HTML with merge fields such as `{{patient.first_name}}`; generating a letter resolves the fields, adds the clinic letterhead, date and addressee, and saves a PDF to the patient's documents.

## 2. Screens and files

| Step | Screen | Files |
|------|--------|-------|
| List templates | Manage → Clinical → "Clinical Letter Templates" tab (table, search, discipline and location filters, 10 per page) | `frontend/src/features/manage/pages/clinical/ClinicalMenu2.tsx`, `components/LetterTemplateList.tsx`, `hooks/useLetterTemplates.ts` |
| Build a template | Full-screen editor | `components/editor/LetterTemplateEditor.tsx` (state and save), `LetterTemplateHeader.tsx` (title bar and settings bar), `EditorToolbar.tsx` (tools and merge-field menus), `LetterDocumentEditor.tsx` (A4 page), `LetterDocumentLayoutPanel.tsx` (right "Document Layout" panel), `MergeField.ts` / `MergeFieldComponent.tsx` (inline field chip) |
| Write a letter | Patient → Clinical Documentation → new letter | `frontend/src/features/clinical-documentation/components/ClinicalLetterEditor.tsx` (same TipTap editor and toolbar) |
| View / print | Letter viewer | `ViewClinicalLetterModal.tsx`, `DocumentPreviewModal.tsx`, `ClinicLetterhead.tsx` |
| API | `/api/letters/templates/` (CRUD, `active/`, `create_version/`, `merge_field_options/`), `/api/letters/` (`generate/`, `preview/`, `sign/`, `send_email/`, `replicate/`) | `backend/apps/letters/` (`models.py`, `serializers.py`, `views.py`, `services.py`) |

## 3. The template editor today

- **Settings bar:** "Enter Letter Title \*" (required; missing name shows a browser `alert`), "Select Discipline" (searchable list of the staff disciplines plus "Create …"; a created discipline lives only in the open editor and is saved as text), "Select Location" (a branch, or "All Locations" = no branch). The top bar has an "Active" checkbox, Cancel and Save Template.
- **Body:** one TipTap editor. Extensions: StarterKit, custom bullet / numbered lists with styles, indent, tables (resizable, custom header and cells), images (inline, base64 allowed), text align, colour, font size, underline, merge fields, a trailing empty paragraph, custom shortcuts.
- **Toolbar buttons:** undo, redo; bold, italic, underline, strikethrough; font size; align left / centre / right / justify; bullet and numbered lists (with list styles); decrease / increase indent; table tools; horizontal line; then the merge-field menus.
- **Merge-field menus:**
  - *Letter:* Addressee (automatic, company, title, first / last name, email, work, mobile, home), Sender (automatic, title, first / last name, discipline, signature).
  - *Client:* Profile (title, first name, middle initial, last name, sex, gender, date of birth, email, phone, address), Health → Doctor (automatic, company, title, first / last name).
  - *Case:* Case (title, status, date created, notes), Referral (doctor, date, reference), Payer (name, reference).
- **Not in the toolbar** (although the editor can store them or the backend can resolve them): heading styles, text colour (the colour palette exists only for table cell background and border colours), image / logo insert, page break, line spacing, and the clinic, today's date, appointment and practitioner fields.
- **Page:** a 794 px wide white page with grey bands every 1123 px (CSS only; content is not paginated). Above the body, dashed grey placeholders show: "CLINIC LETTER HEAD", today's date, and an addressee block ("[Patient Full Name]", "[Patient Address Line 1]", "[Patient Suburb, State, Postcode]"). Only the body (dashed box) is editable.
- **Document Layout panel:** four toggles stored on the template: **Letter Head**, **Remove Top Space**, **Date**, **Addressee**. They only decide whether those blocks are added when a letter is generated.
- **Save:** `POST` (new) or `PATCH` (edit) `/api/letters/templates/` with name, discipline, branch, the four flags, `is_active`, `content_html`; `header_html` and `footer_html` are always sent empty; description and category are kept from the existing template (new: empty / `GENERAL`). Editing changes the template in place (the `create_version` endpoint exists but the editor does not use it). Cancel asks to confirm only if the body or name changed.

## 4. Data model (`LetterTemplate`)

`clinic` (from the user), `created_by`, `name`, `description`, `category` (default `GENERAL`; choices Referral, Report, General, Medical Certificate, or any text), `discipline` (free text), `clinic_branch` (null = all locations), `layout_letter_head`, `layout_remove_top_space`, `layout_date`, `layout_addressee`, `content_html`, `header_html`, `footer_html`, `include_logo`, `include_signature`, `merge_fields`, `version`, `parent_template`, `is_active`, soft delete. Unique per clinic, name and version. The editor uses none of `include_logo`, `include_signature`, `merge_fields`, `parent_template`.

A generated `Letter` stores the resolved HTML, the four flags as chosen at generation time, the PDF, status (Draft / Final / Sent), signature data, and a copy is added to the patient's documents (`CaseDocument`, category `LETTER`).

## 5. How a letter is generated

1. The writer picks a template (all active templates of the clinic are listed; discipline and branch are **not** used to filter).
2. `POST /api/letters/preview/` resolves the body with `LetterGeneratorService.replace_variables` and returns it into an editable TipTap editor. The four flags are copied from the template and can be changed per letter.
3. `POST /api/letters/generate/` builds the letterhead (logo, clinic name, address, phone and email from `get_clinic_profile`: print-settings logo first, then clinic logo, then the parent clinic's), the date (today), and the addressee (the **patient**: name, address, city / province / postal code), prepends them to the resolved body inside a wrapper with 0 or 40 px top padding, converts to PDF with `xhtml2pdf`, and saves the `Letter` and the document.
4. Unknown `{{fields}}` are removed. A known field that fails to resolve becomes blank.

## 6. Findings

**Update 2026-10-24 (Implemented):** F1 (one layout source: shared React blocks for screen and print, `build_layout_html` for the PDF), F2 (confirmed by rendering a real PDF: flex ignored and a padded wrapper div inflated all spacing; fixed with tables and a spacer), F3 (the editor shows the real letterhead and a sample patient), F8 (header, unsaved tracking, inline validation) and F9 (a saved discipline shows in the list). F4–F7 and F10–F12 are unchanged and Proposed.

| # | Finding | Where |
|---|---|---|
| F1 | The letterhead, date and addressee blocks are built four separate times: PDF in `generate`, again in `preview`, print HTML in `ViewClinicalLetterModal`, and on screen in `ClinicLetterhead` / the viewer. "Remove Top Space" is applied differently in each (the print view ignores it). | `views.py` (two copies), `ViewClinicalLetterModal.tsx`, `ClinicLetterhead.tsx` |
| F2 | The PDF letterhead used `display: flex`, which `xhtml2pdf` ignores, and the whole letter sat in a `padding-top` wrapper div that makes `xhtml2pdf` inflate the spacing of every paragraph. Confirmed by rendering the PDF. **Resolved 2026-10-24.** | `views.py` |
| F3 | The editor cannot show what the generated letter will look like: grey dashed boxes with no real logo, clinic name, or sample data. | `LetterDocumentEditor.tsx` |
| F4 | The addressee is always the patient; there is no referrer / GP / other addressee, although the toolbar offers Addressee fields. The placeholder text is Australian ("Suburb, State, Postcode"); the data uses city / province / postal code. | editor, `views.py` |
| F5 | No sign-off or signature block and no footer in the editor, although the model has `include_signature`, `include_logo` and `footer_html`. A signature only appears through the `{{sender.signature}}` merge field. | model, editor |
| F6 | Merge-field gaps. `{{patient.phone}}` reads `phone_number`, which `Patient` does not have (the field is `phone`), so it resolves to blank. `{{patient.title}}`, `{{addressee.company}}`, `{{addressee.title}}`, `{{addressee.work}}`, `{{addressee.home}}`, `{{case.referral.date}}` and `{{case.payer.reference}}` always resolve to blank. The backend also supports clinic, today's date, appointment and practitioner fields that no toolbar menu offers. `merge_field_options` lists keys such as `{{today.date}}` that the service does not resolve, and the frontend does not call it. | `services.py`, `EditorToolbar.tsx`, `views.py` |
| F7 | The toolbar has no heading styles, text colour, image / logo insert, page break, or line spacing (the Color and Image extensions are loaded but not exposed). | `EditorToolbar.tsx` |
| F8 | The editor shell is basic: a plain "Active" checkbox, `alert()` for a missing name, no category or description, no preview, no indication of unsaved changes; leaving checks only the body and name, not the layout toggles, discipline, branch or active flag. | `LetterTemplateHeader.tsx`, `LetterTemplateEditor.tsx` |
| F9 | A created discipline is not remembered after the editor closes (only the text on the saved template). | `LetterTemplateHeader.tsx` |
| F10 | When writing a letter, templates are not filtered by the patient's / practitioner's discipline or the branch, even though both are stored. | `ClinicalLetterEditor.tsx` |
| F11 | The template list's Location column reads `clinic_branch_name`, which the serializer does not return, so it shows "Branch #id" instead of the name. | `LetterTemplateList.tsx`, `serializers.py` |
| F12 | The templates API only requires login: any user of the clinic can create or change templates (no role or permission-group check). | `views.py` |

## 7. Unverified or unclear

- A logo in the PDF letterhead (the scratch test clinic had none).
- Whether saving a template with a name that already exists returns a clean error (the unique constraint is clinic + name + version) was not tested.
- No automated tests exist for the letters app (`backend/apps/letters/tests.py` is empty).

## 8. Next step

Done 2026-10-24: editor shell, real letterhead / date / addressee preview, one shared layout (F1–F3, F8, F9). Still open, each needing an approved plan before any code is changed: addressee choice plus sign-off, signature and footer blocks (F4, F5); toolbar additions and a corrected merge-field list (F6, F7); template filtering when writing a letter (F10); list Location name and a permission check on templates (F11, F12).

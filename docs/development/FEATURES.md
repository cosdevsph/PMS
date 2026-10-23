# Features

Current behavior and business rules for each feature area. Fill in a section the first time a task touches that feature, after reading the code. If a workflow is complex, give it its own file under `docs/development/features/<name>.md` and link to it here.

When behavior changes, update the section in place and mark the replaced rule `Superseded (YYYY-MM-DD)` with a link to the CHANGELOG entry.

No patient data or secrets in examples.

## Section template

```markdown
## <Feature area>

**Code:** `frontend/src/features/<area>/`, `backend/apps/<app>/`
**Last verified:** YYYY-MM-DD
**Deep dive:** [features/<name>.md](features/<name>.md) (optional)

**What it does:** <short description>
**Business rules:**
- <rule> — <where it's enforced: frontend, backend, or both>
**Key endpoints:** <method + path>
**Known issues:** <...>
```

## Index

| Feature area | Frontend | Backend | Status |
|--------------|----------|---------|--------|
| Authentication & accounts | `auth`, `profile` | `accounts` | Partly documented: Owner/Manager roles and permission groups below (2026-10-22) |
| Appointments | `appointments` | `appointments` | Not yet documented |
| Billing & invoices | `billing` | `billing` | Not yet documented |
| Clinical cases (session limits retired) | `patients` (Cases page, `CaseModal`), `clinical-documentation` | `patients` (`PatientCase`) | Partly documented: limits retired 2026-10-20, see the Private Package Sessions spec §7 |
| Clinic setup & clinics | `clinic-setup`, `clinics`, `setup` | `clinics` | Not yet documented |
| Clinical documentation & templates | `clinical-documentation`, `clinical-template` | `clinical_templates` | Not yet documented |
| Patient records | `records` | `records` | Not yet documented |
| Patients | `patients` | `patients` | Not yet documented |
| Patient portal / Online Booking | `patient-portal` | `patients` (portal views and serializers) | Partly documented — public bookable-service rule below |
| Contacts | `contacts` | `contacts` | Not yet documented |
| Messaging | `clinic-messages` | `messages` | Not yet documented |
| Notifications | `notifications` | `notifications` | Not yet documented |
| SMS | — | `smsgateway` | Not yet documented |
| Letters | — | `letters` | Not yet documented |
| Inventory | — | `inventory` | Not yet documented |
| Reports & dashboard | `reports`, `dashboard` | `reports` | Not yet documented |
| Manage (admin / clinical setup) | `manage` | — | Not yet documented |
| Settings | `settings` | — | Not yet documented |
| Subscriptions & pricing | `setup` (Subscription page, upgrade modal), `landing` (pricing, FAQ) | `subscriptions` | Documented below (2026-10-21); **migrations 0004/0005 not yet applied to the dev database** |
| Integrations & gateway | — | `integrations`, `gateway` | Not yet documented |
| Support | `support` | `support` | Not yet documented |
| Landing page | `landing` | — | Not yet documented |
| Private Package Sessions | `patients` (sidebar page), `appointments` (assignment card), `billing` (invoice screen) | `patients` (`package_*`), `billing`, `appointments` | Implemented and tested; **migrations not yet applied to the dev database**; transfers not built — [spec](features/private-package-sessions.md) |

A "—" means no folder with a matching name was found. The feature may still exist under a different name; confirm when documenting it.

## Online Booking (patient portal)

**Code:** `backend/apps/patients/serializers.py` (`public_portal_services`, `PortalLinkPublicSerializer`, `PortalBookingCreateSerializer`, `PortalPractitionerSerializer`), `backend/apps/patients/views.py` (`PublicPortalView`, `PublicAvailableSlotsView`, `PublicPortalBookView`), `frontend/src/features/patient-portal/`
**Last verified:** 2026-10-20 (backend tests; see CHANGELOG "Chunk 1")

**Business rules:**
- A service is publicly bookable only if it belongs to the portal's main clinic and is active, `show_in_portal`, not deleted and not a legacy `is_package` service. The listing, the practitioner service list and the booking submit share the helper `public_portal_services`; the available-slots view (`PublicAvailableSlotsView`) applies the same filters inline rather than through the helper, so a future change to the rule must update both. Enforced in the backend; the frontend only shows what the API returns.
- A branch portal uses its main clinic's services.
- Packages are not offered or sold through Online Booking.

**Key endpoints:** `GET /api/public/portal/{token}/`, `GET .../slots`, `POST /api/public/portal/{token}/book/` (400 with a `service` error for a non-public service).
**Known issues:** Portal confirmation attaches the patient's latest open Case and consumes its session (planned to change in a later chunk).

## Subscriptions & pricing

**Code:** `backend/apps/subscriptions/` (`plans.py` is the price source of truth, `models.py`, `services.py`, `views.py`), `frontend/src/features/setup/pages/account/Subscription.tsx`, `setup/components/SubscriptionTermCard.tsx`, `setup/components/modals/UpgradeSubscriptionModal.tsx`, `frontend/src/features/landing/data/pricing.ts` and `support.ts`
**Last verified:** 2026-10-21 (backend tests and isolated browser check; see CHANGELOG "Pricing, 12-month term and cancellation")

**What it does:** Sells Starter, Growth and Enterprise plans (plus a contact-sales "Custom" tier) through PayMongo checkout, tracks entitlements, and lets the clinic owner schedule a cancellation.

**Business rules:**
- Internal plan codes are `STARTER`, `GROWTH`, `PROFESSIONAL` (shown as **Enterprise**) and `ENTERPRISE` (shown as **Custom**). Codes never change. — backend
- Monthly ₱3,999 / ₱6,999 / ₱9,999 for 4 / 8 / 12 clinicians. Annual is exactly monthly × 12 × 0.90 (₱43,189.20 / ₱75,589.20 / ₱107,989.20). — `plans.py`
- 1 branch included. Each additional branch is ₱2,000/month or ₱21,600/year on every tier. — `plans.py`
- The clinician limit is shared across all branches and a clinician counts once, however many branches they work at. Archived and inactive practitioners still count until permanently deleted. The Owner, Branch Managers and staff without the practitioner role are unlimited. — `services.get_clinician_allocations_for_clinic` The limit checks when creating or editing staff or assigning a clinic count the same way (1 seat only when a user newly becomes a practitioner; adding, changing or removing clinics costs none). Superseded (2026-10-23): those checks counted one seat per clinic and refused clinic changes at the limit; see the CHANGELOG entry "Practitioners working at several clinics". — `accounts/views.py`
- Every paid plan has a 12-month minimum term (`term_start` to `term_end`), paid monthly or annually. A payment inside a running term does not move the term. — `Subscription.activate_plan`
- Cancellation: the Owner requests it with a reason; it takes effect at `term_end`, never earlier, with no refund; access continues until then; it can be withdrawn before that date; every action is logged in `SubscriptionEvent`. Trials cannot be cancelled. Enforced lazily when the subscription is read (`apply_scheduled_cancellation`). — backend
- The frontend price list (`landing/data/pricing.ts`) is a hand-kept mirror of `plans.py` because the plans endpoint needs a login. Change both together. The AI assistant's prices are generated from `PLAN_CATALOG`.
- What the public site may promise: email and in-app support on business hours, self-service patient import, guided setup, video guides, written manual, a free live demo and staff training on request (online, or on-site within the Negros Island Region only; scheduled in advance by emailing `support@malasakitpms.ph` via `DEMO_REQUEST_MAILTO`, no booking system). Not: phone, 24/7, account managers, free migration, certifications, on-site training outside the region, or a quoted training price. Superseded (2026-10-22): "no live or on-site training", see the CHANGELOG entry "Live demo and staff training offer". The offer text lives in `landing/data/support.ts` and the AI prompt; change both together.

**Key endpoints:** `GET /api/subscription/status/`, `GET /api/subscription/plans/`, `POST /api/subscription/cancel/`, `POST /api/subscription/cancel/withdraw/`. Management command: `backfill_subscription_terms [--apply]` (dry run by default).
**Known issues:** No renewal automation (each payment is a one-off checkout). Expiry and cancellation are enforced when read, not by a scheduler. Chapter 25 screenshots in the user manual are outdated. The Contact page form does not send anything. Superseded (2026-10-21): the "1 seat per assigned branch" rule and the 2,000/2,500/3,000 add-on, see the CHANGELOG entry.

## Roles & permissions (Owner / Branch Manager)

**Code:** `backend/apps/accounts/` (`models.py` feature keys and defaults, `utils/rbac.py`, `views.py` `PermissionGroupViewSet`, `serializers.py`), `backend/apps/appointments/views.py` (`DiaryBranchScopeMixin`), `frontend/src/features/setup/pages/users/Permissions.tsx`, `features/appointments/Diary.tsx`
**Last verified:** 2026-10-23 (backend tests and isolated browser check; see CHANGELOG "Client feedback on access and branch assignment"). Only the Owner, Branch Manager and the Practitioner clinics rule were reviewed; other roles are not documented here.

**Naming (2026-10-22):** the clinic owner is the **Owner** (code `OWNER`) and the branch-level role is the **Branch Manager** (code `BRANCH_MANAGER`). Never "Admin", "Administrator", "Admin Assistant" or "Manager" for these roles, in the UI, messages, emails, the manual or the AI assistant. Code helpers: `User.is_owner`, `User.is_branch_manager`; role constants and legacy aliases live in `backend/apps/accounts/roles.py` and `frontend/src/lib/roles.ts`. Superseded (2026-10-22): the codes `ADMIN` and `ADMIN_ASSISTANT` and the permission-group templates `MANAGER` and `ADMIN_ASSISTANT` (merged into `BRANCH_MANAGER`); see the CHANGELOG entry "Rename roles". The old codes are still accepted as input during a transition period, are converted on read (a row not migrated yet still behaves as Owner / Branch Manager) and are never returned. Deliberately kept: the owner-registration API paths (`register-admin`, `send-admin-otp`, `verify-admin-otp`), the plans API field `unlimited_admins` and the "System Admin" label on support tickets.

**What it does:** Each user has roles and a permission group (none / view / edit per feature key). Branch Managers work in their assigned branches; the Owner can let a Branch Manager open other branches' Diary.

**Business rules:**
- The Owner (role code `OWNER`) has full access to everything and every branch. — backend (`has_feature_permission`, `get_allowed_branches` return all)
- **Branch Manager clinics (2026-10-22):** a Branch Manager manages the clinics whose `UserBranchAccess` row has `is_managed=True`; practitioner / staff assignment rows are not management. A Branch Manager can manage **any number** of clinics (e.g. Branch Manager 1 → Clinic 1 + 2, Branch Manager 2 → Clinic 3). **No clinic may have two Branch Managers**: enforced by the database constraint `one_branch_manager_per_clinic` and by one shared check (`validate_branches_free_for_manager`) on every path that assigns managers (user create/update, `PUT /users/{id}/roles/`), which names the current manager. Removing the role or archiving the user frees their clinics; a deactivated user keeps them. Only the Owner changes who manages which clinic. Superseded (2026-10-22): "A Branch Manager's branches are all their `UserBranchAccess` rows, one manager per branch checked only on user save". — backend
- **Staff (Rule 2):** a Branch Manager always has Edit on Staff Management and Setup – Users, whatever their permission group says (the Owner configures everything else). They create staff in **any clinic they manage** (default: their primary clinic), can move staff between their own clinics, and never place or move staff into a clinic they do not manage. They cannot create or assign Owner / Branch Manager roles, cannot edit another Branch Manager, cannot change which clinics anyone manages (themselves included), and cannot give anyone (or themselves) the Owner group or change their own group. — backend (`has_feature_permission`, `UserSerializer`, `UserViewSet`), frontend (`usePermissions`, staff form)
- **Permission Groups screen (2026-10-23):** left list of groups, right pane with the selected group's summary and a card per feature area. Each row reads "<audience> can: [level]" (e.g. "Your branch managers can: Edit"), where the level pill is a dropdown (No Access / View / Edit); a card with unsaved changes shows its own Save changes / Discard strip, so each card is saved separately (search and "Changed" markers included; there is no "Set all" shortcut, each feature is set with its own dropdown). Superseded (2026-10-23): the single "Edit permissions" button and group-wide Save bar. For Branch Manager groups the Owner also sees **Branch access** inside Diary & Calendar: per Branch Manager, the clinics they manage and the other clinics they can open in the Diary (level from "Other Branches' Diary"), each with "+ Add more branch"; clinics held by another Branch Manager are unavailable. Patient access for those other clinics is the booking lookup only. — frontend (`Permissions.tsx`, `permissions/`); creating a group needs no `clinic` from the client.
- **The Owner has no permission settings:** the Owner always has full access. The Owner group is not shown on the Permissions page, cannot be changed, duplicated, deleted or assigned, a new Owner-template group cannot be created, and an Owner cannot be put in a group. The seeded Owner group stays in the database, protected. — backend (`PermissionGroupViewSet`), frontend
- (Seat counts, schedules and practitioner assignments keep using the plain branch-assignment rows; the Diary "Other Branches" setting below uses its own list.)
- **Practitioner clinics (2026-10-23):** a Practitioner works at the clinics that have an **active** assignment row (days and hours per clinic, built from the `branch_id` on each block of their combined `duty_schedule`). At each such clinic they are bookable on those hours and see that clinic's Diary, patients, cases and packages; a deactivated row grants nothing, and a Branch Manager's managed clinics never depend on `is_active`. They are **one clinician** on the plan however many clinics they have. The Owner can give any clinic of the group; a Branch Manager can add, change or remove hours only at the clinics they manage and must leave other clinics' hours as they are (a Practitioner shared with another manager stays editable by both, each for their own clinics). Hours at two clinics may not overlap on the same day. Set from **Permissions → Practitioner group → Diary & Calendar → "Clinics for Practitioners"** (add, change hours, remove; never the last clinic) or the Staff form's schedule; both save through `PATCH /api/users/{id}/` with `duty_schedule`. Only Practitioners for now. — backend (`accounts/utils/schedule.py`, `UserSerializer._validate_duty_schedule`, `rbac.get_assigned_branch_ids`, `UserViewSet.assign_branch`), frontend (`permissions/PractitionerBranchPanel.tsx`, `CreateStaffAccountModal.tsx`)
- **"Other Branches' Diary"** (feature key `diary_other_branches`, default None): None = own branches only; View = may open the branches the Owner picked for that Branch Manager (Staff Management → Branch Manager's form) read-only; Edit = also book, move, cancel and add blocks/notes there. The branch list is `User.extra_diary_branches`; only the Owner can set it, only Branch Managers keep one. — backend (`rbac.get_diary_branch_ids`, `DiaryBranchScopeMixin`) and frontend
- Reads in the Diary use the read list; unsafe methods (update, delete, actions) use the write list; creating or updating into a granted branch at View level is refused. — backend
- Booking in a granted branch (Edit only): `GET /api/patients/booking-lookup/` returns that branch's patients' names, patient number, date of birth and open cases. Patient records, invoices and reports of the granted branch stay hidden. — backend
- **Permission groups (rule of 2026-10-23, revised the same day):** the Owner manages every group. A Branch Manager **always** (no "Permissions: Edit" switch needed; Superseded (2026-10-23): that switch) may manage **only the Frontdesk, Practitioner and Finance groups**, with three limits: never **above their own level** of any feature (a raised row is refused; rows already above may stay or be lowered; a duplicate is lowered to their level), only groups whose **members all work at clinics they manage** (groups are shared by the whole clinic group; otherwise the group is read-only with the reason and they Duplicate it), and `assign-user` only for their own staff. They can: change, create (those templates only), duplicate (the copy keeps the template), delete, and hand them to staff. The Branch Manager group, Read-Only and Custom groups, and the Owner group (which nobody can change) are **Owner-only**: they are not listed or opened for a Branch Manager at all (list shows only Frontdesk, Practitioner and Finance; opening another returns 404) and changing one returns 403. Nobody except the Owner may change the group they belong to; a Branch Manager cannot change another Branch Manager's group. Superseded (2026-10-23): "a Branch Manager with Permissions: Edit can edit any non-Owner group". — backend (`PermissionGroupViewSet._assert_can_manage`, `assign_user`, `UserSerializer.validate_permission_group`, constant `BRANCH_MANAGER_MANAGEABLE_TEMPLATES`), frontend (`Permissions.tsx`)
- Superseded (2026-10-22): "a Branch Manager can never open another branch's Diary" (now possible through the setting above).

- **Frontdesk / Finance at several clinics (2026-10-23):** set with `work_branch_ids` (Staff form "Also works at", or Permissions → group → "Clinics for staff"). A clinic widens where they work, never what they may do (their group is unchanged; Diary, patients and packages follow their active clinics) and uses no clinician seat. The first clinic is their home clinic; at least one; the Owner may use any clinic, a Branch Manager adds or removes only clinics they manage and must leave other managers' clinics as they are. Not for Practitioners (clinics come from their working hours) or Branch Managers (the Owner sets what they manage). — backend (`UserSerializer._validate_work_branches`, `_sync_work_branches`), frontend (`StaffBranchPanel.tsx`, `CreateStaffAccountModal.tsx`)
- **Who may grant access (client feedback, 2026-10-23):** only the Owner and Branch Managers create staff, change clinics or assign groups; role changes are Owner only; clinicians and staff never. A Branch Manager grants access only to the clinics they manage and never above their own level. Clinician availability per clinic and day is set by the Owner or a Branch Manager (no self-service).

**Key endpoints:** `/api/permission-groups/` (+ `duplicate/`), `GET /api/patients/booking-lookup/`, `PATCH /api/users/<id>/` with `extra_diary_branch_ids` (Owner only) or `work_branch_ids` (Frontdesk / Finance).
**Known issues:** see CHANGELOG findings F5–F9 and the limitations of "Branch Manager clinics": booking into a branch the user cannot view works via the API for non-Branch Manager paths; Diary/Calendar/Appointments "View" is not enforced as read-only in a user's own branch (frontend or backend); two appointment viewsets return all clinics' rows to any Owner; manager branch assignment is not checked against the clinic group; a Branch Manager with only `clinic_branch` sees no patients.


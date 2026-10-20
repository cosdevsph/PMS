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
| Authentication & accounts | `auth`, `profile` | `accounts` | Not yet documented |
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
| Subscriptions | — | `subscriptions` | Not yet documented |
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

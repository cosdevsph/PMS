# Landing page content revision

**Status (2026-11-01):** Implemented and verified in a browser (see the CHANGELOG entry "Landing page content revision"). The open points in §6 are still the owner's to decide.
**Related:** [FEATURES.md → Landing page](../FEATURES.md#landing-page) · [CHANGELOG](../CHANGELOG.md)

The owner's text below is copied exactly, including spelling and punctuation. Where the code or an earlier decision disagrees with it, that is listed under "Open points" and the text is **not** edited.

## Summary

| Section | Code today (before this revision) | Revision | Files |
|---------|-----------------------------------|----------|-------|
| Hero | Rotating words Care, Clinics, Workflows, Health; no subtext | New word list and a subtext line | `landing/components/Hero.tsx` |
| About | "Built for Healthcare Professionals"; 3 cards; 2-paragraph story with a "10,000 practitioners" claim | New headline, 3 cards, 3-paragraph story | `landing/components/About.tsx` |
| Features | "Powerful Features for Your Practice"; 6 cards | New heading; 10 cards | `landing/components/Features.tsx`, `landing/data/features.ts` |
| Why Clinics Choose Malasakit | Does not exist | New accordion section with 11 items | `landing/components/WhyChoose.tsx`, `landing/data/whyChoose.ts`, `landing/LandingPage.tsx` |
| AI assistant | Own feature list, written for the old page | Feature list updated to match | `backend/apps/common/services/gemini_service.py` |

## 1. Hero

**Rotating words** (after the fixed word "Smarter"), in the order given:

1. Health
2. Care
3. Clinics
4. Workflow

**Subtext, directly underneath:** "Clinic management software built for Philippine healthcare practices."

Before: Care, Clinics, Workflows, Health. The hidden (screen-reader) heading is updated to match.

## 2. About

**Headline:** "Built for Healthcare Professionals" becomes "Built by Healthcare Professionals".

**Cards**

| Before | After | Text |
|--------|-------|------|
| Mission-Driven | Practical Solutions | Focused on solving real-world clinic management challenges through technology that simplifies daily operations. |
| Quality First | Security & Compliance First | Built with security, privacy, and healthcare compliance at the core of everything we do, including support for Philippine Data Privacy Act requirements and HIPAA-aligned security safeguards. |
| Customer-Centric | Long-Term Partnership | Supporting clinics through onboarding, training, implementation, and continuous platform improvement. |

**Story (replaces both current paragraphs):**

> Founded by healthcare professionals and technologists, Malasakit Systems was born from firsthand experience with outdated clinic workflows, paper-based processes, and the growing cost of healthcare software.
>
> Drawing inspiration from modern healthcare technologies used around the world, Malasakit Systems was founded on the belief that Philippine healthcare practices should have access to the same efficiencies without the complexity or cost often associated with many international and local clinic management platforms.
>
> By simplifying scheduling, documentation, billing, and clinic operations, Malasakit Systems helps healthcare teams spend less time on administration and more time delivering exceptional patient care.

The second paragraph of the old story ("Today, we serve over 10,000 practitioners across multiple specialties …") is removed.

## 3. Features

**Heading:** "Powerful Features for Your Practice" becomes "Powerful Features for Your Clinic".

**Cards (10)**

| # | Title | Text | Replaces (before) |
|---|-------|------|-------------------|
| 1 | Online Booking & Patient Engagement | Allow patients to book appointments online via QR code, select their preferred branch, service, and provider, and receive automated confirmations, reminders, cancellation notifications, and rebooking links. | New |
| 2 | Smart Scheduling | Streamline clinic operations with drag-and-drop rescheduling, recurring schedules, automated appointment reminders, and real-time calendar management. | Smart Scheduling (revised) |
| 3 | Patient Management | Centralize patient demographics, clinical history, referrals, treatment notes, supporting documents, and communication records in one secure and accessible location. | Patient Management (revised) |
| 4 | Clinical Documentation & Templates | Create unlimited customizable SOAP notes, consent forms, assessments, and documentation templates that automatically integrate into patient records and streamline clinical workflows. | Digital Records (revised) |
| 5 | Document Automation & Communication | Generate invoices, medical certificates, referral letters, and customizable document templates with auto-populated patient information, then securely send them directly from the platform. | New |
| 6 | Business Analytics & Insights | Make informed business decisions with real-time insights into revenue, practitioner utilization, practitioner performance, branch performance, occupancy rates, outstanding balances, and operational trends across custom reporting periods. | Analytics & Reports (revised) |
| 7 | Inventory & Package Management | Track inventory levels, receive low-stock alerts, manage treatment packages, and monitor session utilization and remaining balances from one centralized platform. | New |
| 8 | Multi-Branch Management | Manage multiple clinic locations from one platform with centralized scheduling, patient records, reporting, and operational oversight. | New |
| 9 | Data Privacy & Security | Support patient confidentiality with Philippine Data Privacy Act requirements, HIPAA-aligned security safeguards, and encrypted clinical records. | Data Privacy & Security (revised) |
| 10 | Guided Onboarding & Support | Get started confidently with guided onboarding, video tutorials, user manuals, implementation support, and responsive assistance when you need it. | Guided Onboarding & Support (revised) |

## 4. Why Clinics Choose Malasakit (new section)

Heading: "Why Clinics Choose Malasakit". Each item is marked ▼ in the brief, so each one expands and collapses.

1. **No Hidden Feature Paywalls** — Unlike many clinic management platforms, Malasakit does not place essential functionality behind feature upgrades or additional subscriptions. Online booking, QR booking, reporting, document automation, onboarding resources, and core platform features are included as part of your subscription. Simply pay based on the number of clinicians using the platform.
2. **Unlimited Administrative & Support Staff** — Add receptionists, administrators, managers, accounts staff, and support personnel without additional user fees. Grow your team without worrying about increasing software costs for non-clinical staff.
3. **Unlimited Custom Templates** — Create unlimited SOAP notes, consent forms, assessments, medical certificates, referral letters, invoices, and clinical documentation templates tailored to your clinic's workflows. No template limits, no template creation fees, and no reliance on vendors for custom form creation.
4. **Unlimited SMS & Appointment Reminders** — Send appointment reminders, confirmations, cancellation notifications, and rebooking links through your clinic's own SMS gateway without platform-imposed reminder limits. As your clinic grows, communication costs remain under your control rather than being restricted by software-imposed quotas.
5. **Online Booking Included** — Allow patients to book appointments online by scanning a clinic-specific QR code, selecting their preferred branch, service, provider, and appointment time. Automated reminders, cancellation notifications, and rebooking links help reduce no-shows and administrative workload.
6. **Document Automation & Communication** — Generate invoices, medical certificates, referral letters, and clinic documents using customizable templates with automatically populated patient information. Send documents directly from the platform, reducing repetitive administrative work.
7. **Business Visibility & Performance Insights** — Make informed business decisions with real-time insights into revenue, practitioner utilization, practitioner performance, branch performance, occupancy rates, outstanding balances, inventory levels, package utilization, and operational trends across custom reporting periods.
8. **Scales With Your Growth** — Whether you're operating a single clinic today or expanding to multiple locations tomorrow, Malasakit provides centralized scheduling, patient records, reporting, and operational oversight from one platform.
9. **Built for Philippine Clinics** — Designed around the workflows, operational realities, support expectations, and compliance requirements of Philippine healthcare practices.
10. **Guided Onboarding & Support** — Video tutorials, written user manuals, implementation assistance, and ongoing support help your team transition confidently and maximize adoption across the organisation.
11. **Security & Compliance** — Built with support for Philippine Data Privacy Act requirements, HIPAA-aligned security safeguards, and encrypted clinical records to help protect sensitive patient information.

## 5. Claim check against the code (2026-11-01)

| Claim | Result | Evidence |
|-------|--------|----------|
| QR booking per branch; choose branch, service, provider, time | Backed | Clinic Link Portal and branch QR download (user manual, now chapters 24–25); `patient-portal/components/ServiceList.tsx`, `PortalAvailabilityCalendar.tsx` |
| Confirmations, reminders, cancellation and rebooking links | Backed | `backend/apps/appointments/sms_service.py` (confirm, cancel and rebook tokens), `reminder_service.py`, `email_service.py` |
| Drag-and-drop rescheduling; recurring schedules | Backed | `appointments/components/DraggableEventButton.tsx`, `AddRecurringAppointments.tsx` |
| Clinic's own SMS gateway; no platform reminder limits | Backed | `backend/apps/smsgateway/`; no SMS quota in `backend/apps/subscriptions/plans.py` |
| No feature paywalls; unlimited non-clinical staff; price by clinician count | Backed | `plans.py` docstring: every plan has full feature access and unlimited Owner, Branch Manager and staff accounts |
| Unlimited templates | Backed | No template limit anywhere in `backend/apps` |
| Send invoices and letters from the platform | Backed | `backend/apps/billing/views.py` (`send-email`), `backend/apps/letters/views.py` (`send_email`) |
| Revenue, utilization, practitioner, branch and occupancy performance, outstanding balances | Backed | Reports: Revenue, Occupancy, Business Performance, Clinician performance, Ageing Debts |
| Inventory levels and package/session tracking | Backed | `setup/pages/items/Inventory.tsx`; Private Package Sessions |
| **"receive low-stock alerts"** | **Partly** | Inventory shows a red "Low Stock" count card and a per-item low-stock flag. Nothing sends a notification or email. |
| **"responsive assistance when you need it"** | **Open** | See open point 2 |
| Data Privacy Act support, HIPAA-aligned safeguards, encrypted clinical records | Backed | Matches the 2026-10-21 rule ("HIPAA-aligned", never "compliant"); clinical note content is Fernet-encrypted |

## 6. Open points (owner decisions)

1. **Rotating word order.** Used exactly as listed (Health, Care, Clinics, Workflow). The brief also starts with "Smarter Care (animated)"; if Care should show first, move it to the front of the list in `Hero.tsx`.
2. **Support wording.** `landing/data/support.ts` says to advertise only email and in-app support on business hours (Monday to Friday, 9:00 AM to 6:00 PM Philippine Time, reply within one business day) and not 24/7 support. "Responsive assistance when you need it" (Features card 10) was kept as written because it is the owner's wording, but it can be read as always-available help. A safer line would be "responsive assistance during business hours".
3. **Low-stock alerts.** Kept as written. Today this is an on-screen indicator only. Either soften to "low-stock indicators", or build notifications as a separate feature.
4. **Footer About page.** `landing/components/footer-pages/Company/About.tsx` has its own founding story and was **not** changed.
5. **Navbar.** The new section has the id `why-malasakit`. The top menu was **not** given a link.
6. **Spelling.** "organisation" (item 10) is kept as written; the rest of the site uses American spelling.
7. **Text outside the brief, left unchanged.** The subtitles under the About and Features headings, the Features bottom line "Ready to transform your practice?", and the Hero capability chips (Patient Records & SOAP, Smart Scheduling, Billing & Invoicing). The Features bottom line still says "practice" although the heading now says "Clinic".

## 7. What was changed

- **Hero:** `Hero.tsx` word list and hidden heading; the subtext is a `<p>` under the `<h1>` (balanced wrap, soft shadow for contrast over the photo).
- **About:** `About.tsx` headline, cards (icons now `Lightbulb`, `ShieldCheck`, `Handshake`) and story.
- **Features:** `data/features.ts` (10 cards, new icons) and `Features.tsx` (heading; the tenth card is centred on the last row on large screens through `lg:col-start-2` whenever the card count leaves one card alone).
- **Why Clinics Choose Malasakit:** new `data/whyChoose.ts` and `components/WhyChoose.tsx`, an accordion built like the FAQ (one item open at a time, the first open on load, closed panels `inert`), placed between Features and Pricing in `LandingPage.tsx`, id `why-malasakit`.
- **AI assistant:** `gemini_service.py` feature list extended with only what the code backs (online booking by QR, drag-and-drop and recurring scheduling, unlimited templates, documents emailed from the platform, inventory with low-stock **warnings**, business reports, SMS through the clinic's own gateway). The assistant says "warnings", not "alerts", because it is told never to claim features that do not exist.

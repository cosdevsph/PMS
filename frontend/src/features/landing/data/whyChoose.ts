export interface WhyChooseItem {
  id: string;
  title: string;
  /** One entry per paragraph. */
  paragraphs: string[];
}

export const whyChooseItems: WhyChooseItem[] = [
  {
    id: 'no-paywalls',
    title: 'No Hidden Feature Paywalls',
    paragraphs: [
      'Unlike many clinic management platforms, Malasakit does not place essential functionality behind feature upgrades or additional subscriptions. Online booking, QR booking, reporting, document automation, onboarding resources, and core platform features are included as part of your subscription. Simply pay based on the number of clinicians using the platform.',
    ],
  },
  {
    id: 'unlimited-staff',
    title: 'Unlimited Administrative & Support Staff',
    paragraphs: [
      'Add receptionists, administrators, managers, accounts staff, and support personnel without additional user fees. Grow your team without worrying about increasing software costs for non-clinical staff.',
    ],
  },
  {
    id: 'unlimited-templates',
    title: 'Unlimited Custom Templates',
    paragraphs: [
      "Create unlimited SOAP notes, consent forms, assessments, medical certificates, referral letters, invoices, and clinical documentation templates tailored to your clinic's workflows. No template limits, no template creation fees, and no reliance on vendors for custom form creation.",
    ],
  },
  {
    id: 'unlimited-sms',
    title: 'Unlimited SMS & Appointment Reminders',
    paragraphs: [
      "Send appointment reminders, confirmations, cancellation notifications, and rebooking links through your clinic's own SMS gateway without platform-imposed reminder limits.",
      'As your clinic grows, communication costs remain under your control rather than being restricted by software-imposed quotas.',
    ],
  },
  {
    id: 'online-booking',
    title: 'Online Booking Included',
    paragraphs: [
      'Allow patients to book appointments online by scanning a clinic-specific QR code, selecting their preferred branch, service, provider, and appointment time. Automated reminders, cancellation notifications, and rebooking links help reduce no-shows and administrative workload.',
    ],
  },
  {
    id: 'document-automation',
    title: 'Document Automation & Communication',
    paragraphs: [
      'Generate invoices, medical certificates, referral letters, and clinic documents using customizable templates with automatically populated patient information. Send documents directly from the platform, reducing repetitive administrative work.',
    ],
  },
  {
    id: 'business-visibility',
    title: 'Business Visibility & Performance Insights',
    paragraphs: [
      'Make informed business decisions with real-time insights into revenue, practitioner utilization, practitioner performance, branch performance, occupancy rates, outstanding balances, inventory levels, package utilization, and operational trends across custom reporting periods.',
    ],
  },
  {
    id: 'scales',
    title: 'Scales With Your Growth',
    paragraphs: [
      "Whether you're operating a single clinic today or expanding to multiple locations tomorrow, Malasakit provides centralized scheduling, patient records, reporting, and operational oversight from one platform.",
    ],
  },
  {
    id: 'philippine-clinics',
    title: 'Built for Philippine Clinics',
    paragraphs: [
      'Designed around the workflows, operational realities, support expectations, and compliance requirements of Philippine healthcare practices.',
    ],
  },
  {
    id: 'onboarding-support',
    title: 'Guided Onboarding & Support',
    paragraphs: [
      'Video tutorials, written user manuals, implementation assistance, and ongoing support help your team transition confidently and maximize adoption across the organisation.',
    ],
  },
  {
    id: 'security-compliance',
    title: 'Security & Compliance',
    paragraphs: [
      'Built with support for Philippine Data Privacy Act requirements, HIPAA-aligned security safeguards, and encrypted clinical records to help protect sensitive patient information.',
    ],
  },
];

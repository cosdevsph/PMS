import { COMMITMENT_MONTHS, ANNUAL_DISCOUNT_PERCENT } from './pricing';
import { DEMO_REQUEST_MAILTO, SUPPORT_HOURS, SUPPORT_RESPONSE_TIME } from './support';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  link?: { label: string; href: string };
}

export const faqs: FAQ[] = [
  {
    id: 'trial',
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial with full system access included. Explore online booking, QR booking, unlimited custom templates, automated appointment reminders, reporting, and all core platform features. No credit card required to start.'
  },
  {
    id: 'migration',
    question: 'Can I import my existing patient data?',
    answer: 'You can import your existing patient list using our CSV or Excel template. Appointments, clinical notes, and documents are not currently imported automatically, so we recommend keeping your previous system available for reference. We do not currently offer a data migration service.'
  },
  {
    id: 'security',
    question: 'Is my data secure and compliant with the Philippine Data Privacy Act?',
    answer: 'Malasakit is built to help clinics meet their obligations under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). The platform supports patient data privacy consent, role-based access controls, audit history, version tracking, encrypted clinical records, and HIPAA-aligned security safeguards. While these tools support privacy and security requirements, clinics remain responsible for how they collect, use, and share patient information, and we do not claim any formal certification.'
  },
  {
    id: 'support',
    question: 'What kind of support do you provide?',
    answer: `We provide email support and in-app support tickets from ${SUPPORT_HOURS}, with a target response time of ${SUPPORT_RESPONSE_TIME}. We also provide onboarding resources, video guides, user manuals, and implementation support to help clinics get the most out of the platform. We do not currently offer phone support, 24/7 support, or dedicated account managers.`
  },
  {
    id: 'cancel',
    question: 'Can I cancel my subscription?',
    answer: `All plans have a ${COMMITMENT_MONTHS}-month minimum term. You can pay monthly, or pay annually and save ${ANNUAL_DISCOUNT_PERCENT}%. Paying monthly does not provide month-to-month cancellation. If you choose to cancel during your term, your cancellation will take effect at the end of your current ${COMMITMENT_MONTHS}-month commitment and you will retain full access until then. The free trial has no commitment.`
  },
  {
    id: 'training',
    question: 'Do you provide training for my staff?',
    answer: 'We offer free live demonstrations and staff training sessions, online or on-site within the Negros Island Region (Negros Occidental, Negros Oriental, and Siquijor). Sessions are scheduled in advance based on clinic availability. Clinics also have access to guided onboarding, video tutorials, the User Manual, and the AI Assistant to support ongoing staff training and implementation.',
    link: { label: 'Schedule a live demo or training', href: DEMO_REQUEST_MAILTO }
  },
  {
    id: 'multi-branch',
    question: 'Can I manage multiple branches?',
    answer: 'Yes. Malasakit supports multi-branch clinic management from a single platform. Owners can oversee multiple branches, while branch managers can be granted access to one or more branches depending on their assigned permissions. Clinicians can also work across multiple locations based on their schedules, allowing clinics to centralize scheduling, patient records, reporting, and operational oversight across their organisation.'
  },
  {
    id: 'affordability',
    question: 'Why is Malasakit more affordable even though it includes more features?',
    answer: 'Many clinic management systems increase costs through feature upgrades, additional user fees, template charges, online booking add-ons, and reminder limits. Malasakit takes a different approach by including online booking, QR booking, unlimited non-clinical staff profile accounts, unlimited custom templates, unlimited appointment reminders, and full system access in every plan. This allows clinics to access more functionality without paying for multiple add-ons or upgrades.'
  }
];

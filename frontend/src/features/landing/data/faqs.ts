import { COMMITMENT_MONTHS, ANNUAL_DISCOUNT_PERCENT } from './pricing';
import { DEMO_REQUEST_MAILTO, SUPPORT_HOURS, SUPPORT_RESPONSE_TIME, TRAINING_SUMMARY } from './support';

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
    answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.'
  },
  {
    id: 'migration',
    question: 'Can I import my existing patient data?',
    answer: 'You can import your existing patient list yourself using our CSV or Excel template (Clients, then Import Clients). Other records such as appointments, clinical notes and documents are not imported automatically, so keep your old system available for reference. We do not currently offer a data migration service.'
  },
  {
    id: 'security',
    question: 'Is my data secure and compliant with the Philippine Data Privacy Act?',
    answer: 'Malasakit is built to help clinics meet their obligations under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). It records patient data-privacy consent, restricts access by user role, keeps audit and version history on key records, and encrypts the content of clinical notes. Malasakit Systems also incorporates HIPAA-aligned security practices. These are tools to support your compliance: clinics remain responsible for how they collect, use and share patient information, and we do not claim any formal certification.'
  },
  {
    id: 'support',
    question: 'What kind of support do you provide?',
    answer: `We provide email support and in-app support tickets on ${SUPPORT_HOURS}. We aim to reply within ${SUPPORT_RESPONSE_TIME}. We do not currently offer phone support, 24/7 support or dedicated account managers.`
  },
  {
    id: 'cancel',
    question: 'Can I cancel my subscription?',
    answer: `All plans have a ${COMMITMENT_MONTHS}-month minimum term. You can pay monthly, or pay annually and save ${ANNUAL_DISCOUNT_PERCENT}%. Paying monthly does not mean you can cancel month to month. If you request a cancellation during your term, it takes effect at the end of your current ${COMMITMENT_MONTHS}-month term, and you keep full access until then. The free trial has no commitment.`
  },
  {
    id: 'training',
    question: 'Do you provide training for my staff?',
    answer: TRAINING_SUMMARY,
    link: { label: 'Schedule a live demo or training', href: DEMO_REQUEST_MAILTO }
  }
];

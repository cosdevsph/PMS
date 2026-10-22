/**
 * What Malasakit can consistently provide at launch. Only advertise what is listed here.
 * If support hours or channels change, update this file and the AI assistant prompt
 * (backend/apps/common/services/gemini_service.py) together.
 */
export const SUPPORT_EMAIL = 'support@malasakitpms.ph';
export const SUPPORT_HOURS = 'Monday to Friday, 9:00 AM to 6:00 PM (Philippine Time)';
export const SUPPORT_RESPONSE_TIME = 'one business day';

export const SUPPORT_SUMMARY = `Email and in-app support tickets, ${SUPPORT_HOURS}. We aim to reply within ${SUPPORT_RESPONSE_TIME}.`;

/** Live demos and staff training. On-site visits are limited to this area; online sessions are not. */
export const ONSITE_TRAINING_AREA = 'Negros Island Region (Negros Occidental, Negros Oriental and Siquijor)';

export const TRAINING_SUMMARY = `We offer a free live demo and staff training sessions, online or on-site at your clinic within the ${ONSITE_TRAINING_AREA}. Sessions are scheduled in advance: email us your clinic details and preferred dates, and we will confirm the schedule and any fees. You can also use the guided clinic setup, video guides, the User Manual and the AI assistant at any time.`;

const DEMO_REQUEST_SUBJECT = 'Live Demo / Staff Training Request';
const DEMO_REQUEST_BODY = [
  'Clinic name:',
  'City / province:',
  'Request (live demo or staff training):',
  'Format (online or on-site):',
  'Number of staff:',
  'Preferred date and time (option 1):',
  'Preferred date and time (option 2):',
].join('\n');

export const DEMO_REQUEST_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(DEMO_REQUEST_SUBJECT)}&body=${encodeURIComponent(DEMO_REQUEST_BODY)}`;

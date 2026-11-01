import {
  QrCode,
  CalendarClock,
  Users,
  ClipboardList,
  Send,
  BarChart3,
  Package,
  Building2,
  Shield,
  LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    id: 'online-booking',
    icon: QrCode,
    title: 'Online Booking & Patient Engagement',
    description: 'Allow patients to book appointments online via QR code, select their preferred branch, service, and provider, and receive automated confirmations, reminders, cancellation notifications, and rebooking links.'
  },
  {
    id: 'appointments',
    icon: CalendarClock,
    title: 'Smart Scheduling',
    description: 'Streamline clinic operations with drag-and-drop rescheduling, recurring schedules, automated appointment reminders, and real-time calendar management.'
  },
  {
    id: 'patients',
    icon: Users,
    title: 'Patient Management',
    description: 'Centralize patient demographics, clinical history, referrals, treatment notes, supporting documents, and communication records in one secure and accessible location.'
  },
  {
    id: 'records',
    icon: ClipboardList,
    title: 'Clinical Documentation & Templates',
    description: 'Create unlimited customizable SOAP notes, consent forms, assessments, and documentation templates that automatically integrate into patient records and streamline clinical workflows.'
  },
  {
    id: 'documents',
    icon: Send,
    title: 'Document Automation & Communication',
    description: 'Generate invoices, medical certificates, referral letters, and customizable document templates with auto-populated patient information, then securely send them directly from the platform.'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Business Analytics & Insights',
    description: 'Make informed business decisions with real-time insights into revenue, practitioner utilization, practitioner performance, branch performance, occupancy rates, outstanding balances, and operational trends across custom reporting periods.'
  },
  {
    id: 'inventory',
    icon: Package,
    title: 'Inventory & Package Management',
    description: 'Track inventory levels, receive low-stock alerts, manage treatment packages, and monitor session utilization and remaining balances from one centralized platform.'
  },
  {
    id: 'multi-branch',
    icon: Building2,
    title: 'Multi-Branch Management',
    description: 'Manage multiple clinic locations from one platform with centralized scheduling, patient records, reporting, and operational oversight.'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Data Privacy & Security',
    description: 'Support patient confidentiality with Philippine Data Privacy Act requirements, HIPAA-aligned security safeguards, and encrypted clinical records.'
  },
  {
    id: 'support',
    icon: LifeBuoy,
    title: 'Guided Onboarding & Support',
    description: 'Get started confidently with guided onboarding, video tutorials, user manuals, implementation support, and responsive assistance when you need it.'
  }
];

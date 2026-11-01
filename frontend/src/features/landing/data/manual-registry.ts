import { lazy } from 'react';

export interface ManualChapterConfig {
  /** Permanent URL hash. Existing chapters keep their original "chapter-N" id even when their number changes, so old links still work. */
  id: string;
  partTitle: string;
  chapterNumber: number;
  title: string;
  component: React.LazyExoticComponent<React.FC>;
  searchIndex: string;
}

export const manualRegistry: ManualChapterConfig[] = [
  {
    id: "chapter-1",
    partTitle: "PART I — Getting Started",
    chapterNumber: 1,
    title: "Welcome to Malasakit",
    component: lazy(() => import('../components/user-manual/chapters/Chapter1')),
    searchIndex: "Welcome to Malasakit System Overview Purpose User Roles Navigation Overview Supported Platforms",
  },
  {
    id: "chapter-2",
    partTitle: "PART I — Getting Started",
    chapterNumber: 2,
    title: "Creating Your Clinic",
    component: lazy(() => import('../components/user-manual/chapters/Chapter2')),
    searchIndex: "Creating Your Clinic Landing Page Sign Up OTP Verification Password Creation Clinic Setup Dashboard",
  },
  {
    id: "chapter-3",
    partTitle: "PART I — Getting Started",
    chapterNumber: 3,
    title: "Signing In",
    component: lazy(() => import('../components/user-manual/chapters/Chapter3')),
    searchIndex: "Signing In Sign In Forgot Password Session Management Logout",
  },
  {
    id: "chapter-4",
    partTitle: "PART II — Initial Clinic Setup",
    chapterNumber: 4,
    title: "Clinic Setup",
    component: lazy(() => import('../components/user-manual/chapters/Chapter4')),
    searchIndex: "Clinic Setup Clinic Information Logo Contact Details Preferences Saving Configuration",
  },
  {
    id: "chapter-5",
    partTitle: "PART II — Initial Clinic Setup",
    chapterNumber: 5,
    title: "Clinic Branch Management",
    component: lazy(() => import('../components/user-manual/chapters/Chapter5')),
    searchIndex: "Clinic Branch Management Create Branch Edit Branch Archive Branch Public Link QR Code Operating Hours",
  },
  {
    id: "services-pricing",
    partTitle: "PART II — Initial Clinic Setup",
    chapterNumber: 6,
    title: "Services & Pricing",
    component: lazy(() => import('../components/user-manual/chapters/Chapter6')),
    searchIndex: "Services Pricing Clinic Services Create Service Edit Service Price Duration Discipline Calendar Colour Active Portal Online Booking Delete Service",
  },
  {
    id: "sms-gateway",
    partTitle: "PART II — Initial Clinic Setup",
    chapterNumber: 7,
    title: "SMS Gateway Setup",
    component: lazy(() => import('../components/user-manual/chapters/Chapter7')),
    searchIndex: "SMS Gateway Setup Android App APK Pair Phone QR Code Pairing Code Connection Status Offline Battery SIM Troubleshooting Switch Device Disconnect",
  },
  {
    id: "chapter-6",
    partTitle: "PART II — Initial Clinic Setup",
    chapterNumber: 8,
    title: "Clinic Consent Forms",
    component: lazy(() => import('../components/user-manual/chapters/Chapter8')),
    searchIndex: "Clinic Consent Forms Create Consent Form Assign to Branch Edit Consent Form Activate / Deactivate",
  },
  {
    id: "chapter-7",
    partTitle: "PART III — User & Staff Management",
    chapterNumber: 9,
    title: "User Roles",
    component: lazy(() => import('../components/user-manual/chapters/Chapter9')),
    searchIndex: "User Roles Owner Branch Manager Practitioner Front Desk Finance Branch Scope",
  },
  {
    id: "chapter-8",
    partTitle: "PART III — User & Staff Management",
    chapterNumber: 10,
    title: "Creating Staff Accounts",
    component: lazy(() => import('../components/user-manual/chapters/Chapter10')),
    searchIndex: "Creating Staff Accounts Branch Managers Practitioners Front Desk Finance Branch Assignment",
  },
  {
    id: "chapter-9",
    partTitle: "PART III — User & Staff Management",
    chapterNumber: 11,
    title: "Permissions",
    component: lazy(() => import('../components/user-manual/chapters/Chapter11')),
    searchIndex: "Permissions Role Permissions Branch Restrictions Access Control Security",
  },
  {
    id: "chapter-10",
    partTitle: "PART IV — Practitioner Management",
    chapterNumber: 12,
    title: "Practitioner Profiles",
    component: lazy(() => import('../components/user-manual/chapters/Chapter12')),
    searchIndex: "Practitioner Profiles Create Practitioner Branch Assignment Profile Availability",
  },
  {
    id: "chapter-11",
    partTitle: "PART IV — Practitioner Management",
    chapterNumber: 13,
    title: "Duty Hours",
    component: lazy(() => import('../components/user-manual/chapters/Chapter13')),
    searchIndex: "Duty Hours Weekly Schedule Breaks Occupancy Calendar Integration",
  },
  {
    id: "chapter-12",
    partTitle: "PART V — Patient Management",
    chapterNumber: 14,
    title: "Patient Records",
    component: lazy(() => import('../components/user-manual/chapters/Chapter14')),
    searchIndex: "Patient Records Patient Profiles Branch Visibility Practitioner Relationships",
  },
  {
    id: "chapter-13",
    partTitle: "PART V — Patient Management",
    chapterNumber: 15,
    title: "Registering Patients",
    component: lazy(() => import('../components/user-manual/chapters/Chapter15')),
    searchIndex: "Registering Patients Manual Registration Online Registration Duplicate Detection",
  },
  {
    id: "chapter-14",
    partTitle: "PART V — Patient Management",
    chapterNumber: 16,
    title: "Patient Cases",
    component: lazy(() => import('../components/user-manual/chapters/Chapter16')),
    searchIndex: "Patient Cases Timeline History Clinical Notes Invoices",
  },
  {
    id: "prepaid-packages",
    partTitle: "PART V — Patient Management",
    chapterNumber: 17,
    title: "Prepaid Packages & Session Tracking",
    component: lazy(() => import('../components/user-manual/chapters/Chapter17')),
    searchIndex: "Prepaid Packages Private Package Sessions Session Tracking Sessions Used Remaining Add Package Appointment Package Invoice Edit History Patient Profile",
  },
  {
    id: "patient-documents",
    partTitle: "PART V — Patient Management",
    chapterNumber: 18,
    title: "Patient Documents & Attachments",
    component: lazy(() => import('../components/user-manual/chapters/Chapter18')),
    searchIndex: "Patient Documents Attachments Upload Document PDF DOC DOCX Preview Download Delete Unassigned Documents Case Documents Consent Form",
  },
  {
    id: "chapter-15",
    partTitle: "PART VI — Calendar & Appointments",
    chapterNumber: 19,
    title: "Calendar Overview",
    component: lazy(() => import('../components/user-manual/chapters/Chapter19')),
    searchIndex: "Calendar Overview Day View Week View Month View Diary Occupancy",
  },
  {
    id: "chapter-16",
    partTitle: "PART VI — Calendar & Appointments",
    chapterNumber: 20,
    title: "Creating Appointments",
    component: lazy(() => import('../components/user-manual/chapters/Chapter20')),
    searchIndex: "Creating Appointments Appointment Booking Availability Conflicts Practitioner Selection",
  },
  {
    id: "chapter-17",
    partTitle: "PART VI — Calendar & Appointments",
    chapterNumber: 21,
    title: "Recurring Appointments",
    component: lazy(() => import('../components/user-manual/chapters/Chapter21')),
    searchIndex: "Recurring Appointments Weekly Monthly Editing Series Cancelling Series",
  },
  {
    id: "chapter-18",
    partTitle: "PART VI — Calendar & Appointments",
    chapterNumber: 22,
    title: "Appointment Management",
    component: lazy(() => import('../components/user-manual/chapters/Chapter22')),
    searchIndex: "Appointment Management Status Reschedule Cancellation DNA",
  },
  {
    id: "automated-notifications",
    partTitle: "PART VI — Calendar & Appointments",
    chapterNumber: 23,
    title: "Automated SMS & Notifications",
    component: lazy(() => import('../components/user-manual/chapters/Chapter23')),
    searchIndex: "Automated SMS Notifications Appointment Reminders Booking Confirmation Cancellation Reschedule Missed Appointment DNA Follow-up Communication Settings Logs Communication History Email Patient Notification Settings",
  },
  {
    id: "chapter-19",
    partTitle: "PART VII — Online Booking",
    chapterNumber: 24,
    title: "Patient Portal",
    component: lazy(() => import('../components/user-manual/chapters/Chapter24')),
    searchIndex: "Patient Portal Public Links Branch Links Practitioner Selection QR Code Booking Link Share Website Social Media Print Marketing",
  },
  {
    id: "chapter-20",
    partTitle: "PART VII — Online Booking",
    chapterNumber: 25,
    title: "Online Booking",
    component: lazy(() => import('../components/user-manual/chapters/Chapter25')),
    searchIndex: "Online Booking Booking Flow Confirmation Rescheduling",
  },
  {
    id: "note-templates",
    partTitle: "PART VIII — Clinical Documentation",
    chapterNumber: 26,
    title: "Clinical Note Templates",
    component: lazy(() => import('../components/user-manual/chapters/Chapter26')),
    searchIndex: "Clinical Note Templates Note Templates Template Builder Form Builder Fields Scale Chart Body Chart Back Chart Marker Archive Discipline SOAP",
  },
  {
    id: "chapter-21",
    partTitle: "PART VIII — Clinical Documentation",
    chapterNumber: 27,
    title: "Clinical Notes",
    component: lazy(() => import('../components/user-manual/chapters/Chapter27')),
    searchIndex: "Clinical Notes Templates Session Linking Appointment Linking Editing",
  },
  {
    id: "chapter-22",
    partTitle: "PART VIII — Clinical Documentation",
    chapterNumber: 28,
    title: "Clinical Note Export",
    component: lazy(() => import('../components/user-manual/chapters/Chapter28')),
    searchIndex: "Clinical Note Export Print PDF Email Attachments",
  },
  {
    id: "chapter-23",
    partTitle: "PART IX — Billing & Finance",
    chapterNumber: 29,
    title: "Invoice and Payment",
    component: lazy(() => import('../components/user-manual/chapters/Chapter29')),
    searchIndex: "Invoices Payments Generating Invoices Recording Payments Receipts Outstanding Balances Billing",
  },
  {
    id: "inventory",
    partTitle: "PART IX — Billing & Finance",
    chapterNumber: 30,
    title: "Inventory Management",
    component: lazy(() => import('../components/user-manual/chapters/Chapter30')),
    searchIndex: "Inventory Management Products Supplies Stock Adjust Stock Low Stock Minimum Quantity SKU Archive Restore Stock Value",
  },
  {
    id: "chapter-24",
    partTitle: "PART X — Reports & Analytics",
    chapterNumber: 31,
    title: "Reports & Analytics",
    component: lazy(() => import('../components/user-manual/chapters/Chapter31')),
    searchIndex: "Dashboard KPIs Occupancy Reports Financial Reports Revenue Payments Patient Reports Retention Analytics",
  },
  {
    id: "multi-branch-reporting",
    partTitle: "PART X — Reports & Analytics",
    chapterNumber: 32,
    title: "Multi-Branch Reporting",
    component: lazy(() => import('../components/user-manual/chapters/Chapter32')),
    searchIndex: "Multi-Branch Reporting Branch Reports Occupancy All Branches Branch Filter Clinic Branch Dashboard Cancellations Combined Branches",
  },
  {
    id: "chapter-25",
    partTitle: "PART XI — Administration",
    chapterNumber: 33,
    title: "Subscription",
    component: lazy(() => import('../components/user-manual/chapters/Chapter33')),
    searchIndex: "Subscription Plans Limits Renewal Upgrades Billing Licensing",
  },
  {
    id: "audit-logs",
    partTitle: "PART XI — Administration",
    chapterNumber: 34,
    title: "Audit Logs & Change History",
    component: lazy(() => import('../components/user-manual/chapters/Chapter34')),
    searchIndex: "Audit Logs Clinical Audit Change History Version History Edit History Note Audit Who Changed Compliance Activity Log",
  },
  {
    id: "chapter-26",
    partTitle: "PART XII — Help & Support",
    chapterNumber: 35,
    title: "Contact Support",
    component: lazy(() => import('../components/user-manual/chapters/Chapter35')),
    searchIndex: "Contact Support Technical Support Bug Reports Feature Requests Support Channels Helpdesk",
  },
];

export const getChapterConfig = (id: string) => {
  return manualRegistry.find((ch) => ch.id === id);
};

export const getAdjacentChapters = (id: string) => {
  const currentIndex = manualRegistry.findIndex((ch) => ch.id === id);
  if (currentIndex === -1) return { prev: null, next: null };
  return {
    prev: currentIndex > 0 ? manualRegistry[currentIndex - 1] : null,
    next: currentIndex < manualRegistry.length - 1 ? manualRegistry[currentIndex + 1] : null,
  };
};

export const getSidebarStructure = () => {
  const grouped = manualRegistry.reduce((acc, chapter) => {
    if (!acc[chapter.partTitle]) {
      acc[chapter.partTitle] = [];
    }
    acc[chapter.partTitle].push({
      id: chapter.id,
      title: `Chapter ${chapter.chapterNumber}: ${chapter.title}`
    });
    return acc;
  }, {} as Record<string, { id: string; title: string }[]>);

  return Object.entries(grouped).map(([partTitle, chapters]) => ({
    partTitle,
    chapters,
  }));
};

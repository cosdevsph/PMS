import { Calendar, Users, FileText, BarChart3, Shield, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    id: 'appointments',
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Intelligent appointment management with automated reminders and real-time availability.'
  },
  {
    id: 'patients',
    icon: Users,
    title: 'Patient Management',
    description: 'Comprehensive patient records with secure data storage and instant access.'
  },
  {
    id: 'records',
    icon: FileText,
    title: 'Digital Records',
    description: 'Paperless documentation with intake forms, prescriptions, and treatment notes.'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Actionable insights with custom reports and practice performance metrics.'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Data Privacy & Security',
    description: 'Built to support Philippine Data Privacy Act compliance with consent records, role-based access and encrypted clinical notes.'
  },
  {
    id: 'support',
    icon: Clock,
    title: 'Guided Onboarding & Support',
    description: 'A guided setup, video guides and a written manual, plus email and in-app support during business hours.'
  }
];
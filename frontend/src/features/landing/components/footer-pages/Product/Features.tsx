import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CalendarDays, FileText, Receipt, Building2 } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';

export const Features: React.FC = () => {
  const features = [
    {
      category: 'Appointment Management',
      icon: CalendarDays,
      items: [
        'Easy online scheduling',
        'Automated reminders via email and SMS',
        'Calendar synchronization',
        'Cancellation and rescheduling'
      ]
    },
    {
      category: 'Patient Records',
      icon: FileText,
      items: [
        'Secure digital health records',
        'Patient history tracking',
        'Medical notes and documentation',
        'Prescription management'
      ]
    },
    {
      category: 'Billing & Invoicing',
      icon: Receipt,
      items: [
        'Automated invoice generation',
        'Payment tracking',
        'Insurance integration',
        'Financial reports'
      ]
    },
    {
      category: 'Clinic Management',
      icon: Building2,
      items: [
        'Multi-clinic support',
        'Staff management',
        'Department organization',
        'Workflow automation'
      ]
    }
  ];

  return (
    <PublicPageLayout title="Features">
      <PageHeader category="Product" title="Features" description="Comprehensive tools for modern healthcare management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <ul className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal as="li" key={index} delay={(index % 2) * 80} className="h-full">
                <div className="h-full rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-sm p-7 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="w-12 h-12 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                      <Icon className="w-6 h-6" />
                    </span>
                    <h2 className="text-xl sm:text-2xl tracking-tight text-gray-900 font-display">{feature.category}</h2>
                  </div>
                  <ul className="space-y-3.5">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-care-blue mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="text-gray-700 font-body">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* CTA Section */}
        <CtaBand
          className="mt-16 sm:mt-20"
          title="Ready to streamline your practice?"
          description="Experience the power of modern healthcare management"
        >
          <Link to="/pricing" className={ctaBandButtonClass}>
            View Pricing Plans
          </Link>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

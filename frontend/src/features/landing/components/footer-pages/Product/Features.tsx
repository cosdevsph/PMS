import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      category: 'Appointment Management',
      items: [
        'Easy online scheduling',
        'Automated reminders via email and SMS',
        'Calendar synchronization',
        'Cancellation and rescheduling'
      ]
    },
    {
      category: 'Patient Records',
      items: [
        'Secure digital health records',
        'Patient history tracking',
        'Medical notes and documentation',
        'Prescription management'
      ]
    },
    {
      category: 'Billing & Invoicing',
      items: [
        'Automated invoice generation',
        'Payment tracking',
        'Insurance integration',
        'Financial reports'
      ]
    },
    {
      category: 'Clinic Management',
      items: [
        'Multi-clinic support',
        'Staff management',
        'Department organization',
        'Workflow automation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Features</h1>
          <p className="text-xl text-white/70 mt-2">Comprehensive tools for modern healthcare management</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-colors">
              <h2 className="text-2xl font-bold text-healing-mint mb-6">{feature.category}</h2>
              <ul className="space-y-4">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-healing-mint mr-3 mt-1 flex-shrink-0" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your practice?</h2>
          <p className="text-xl text-white/70 mb-8">Experience the power of modern healthcare management</p>
          <Link
            to="/pricing"
            className="inline-block bg-healing-mint text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

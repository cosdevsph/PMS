import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

export const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: 'per month',
      description: 'Perfect for small clinics',
      features: [
        'Up to 500 patient records',
        'Basic appointment scheduling',
        'Email reminders',
        '5 staff members',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Ideal for growing practices',
      features: [
        'Unlimited patient records',
        'Advanced scheduling',
        'SMS + Email reminders',
        '25 staff members',
        'Priority support',
        'Billing integration',
        'Analytics dashboard'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large healthcare systems',
      features: [
        'Everything in Professional',
        'Multi-location support',
        'Custom integrations',
        'Unlimited staff members',
        '24/7 dedicated support',
        'Advanced security',
        'API access'
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
          <h1 className="text-4xl font-bold">Pricing Plans</h1>
          <p className="text-xl text-white/70 mt-2">Choose the perfect plan for your healthcare practice</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg p-8 border transition-all ${
                plan.popular
                  ? 'bg-healing-mint/10 border-healing-mint shadow-2xl scale-105'
                  : 'bg-gray-800/50 border-white/10 hover:border-healing-mint/50'
              }`}
            >
              {plan.popular && (
                <div className="bg-healing-mint text-gray-900 text-sm font-bold px-4 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-white/70 mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-white/70 ml-2">{plan.period}</span>
              </div>
              <button
                className={`w-full py-3 rounded-lg font-bold mb-8 transition-colors ${
                  plan.popular
                    ? 'bg-healing-mint text-gray-900 hover:bg-white'
                    : 'bg-gray-700 text-white hover:bg-healing-mint hover:text-gray-900'
                }`}
              >
                Get Started
              </button>
              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-healing-mint mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 bg-gray-800/50 rounded-lg p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-healing-mint mb-2">Can I change plans anytime?</h3>
              <p className="text-white/70">Yes, upgrade or downgrade your plan at any time with no penalties.</p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">Is there a free trial?</h3>
              <p className="text-white/70">Yes, enjoy 30 days free to explore all features risk-free.</p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">What about data security?</h3>
              <p className="text-white/70">All plans include enterprise-grade encryption and HIPAA compliance.</p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">Do you offer volume discounts?</h3>
              <p className="text-white/70">Yes, contact our sales team for custom pricing on larger deployments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

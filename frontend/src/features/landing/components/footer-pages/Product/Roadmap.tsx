import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';

export const Roadmap: React.FC = () => {
  const roadmapItems = [
    {
      phase: 'Q2 2026',
      status: 'In Progress',
      items: [
        'Advanced patient analytics dashboard',
        'Multi-language support',
        'Mobile app for iOS and Android',
        'Video consultation integration'
      ]
    },
    {
      phase: 'Q3 2026',
      status: 'Planned',
      items: [
        'AI-powered appointment optimization',
        'Advanced prescription management',
        'Insurance claims automation',
        'Staff performance analytics'
      ]
    },
    {
      phase: 'Q4 2026',
      status: 'Planned',
      items: [
        'Telemedicine platform',
        'Patient portal enhancements',
        'Advanced reporting tools',
        'Integration marketplace'
      ]
    },
    {
      phase: 'Q1 2027',
      status: 'Planned',
      items: [
        'Blockchain-based records',
        'Advanced interoperability',
        'Machine learning predictions',
        'Custom workflow builder'
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
          <h1 className="text-4xl font-bold">Product Roadmap</h1>
          <p className="text-xl text-white/70 mt-2">What's coming to Malasakit</p>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {roadmapItems.map((phase, index) => (
            <div key={index} className="relative">
              <div className="flex items-start">
                <div className="relative flex flex-col items-center mr-8">
                  {phase.status === 'In Progress' ? (
                    <CheckCircle className="w-8 h-8 text-healing-mint" />
                  ) : (
                    <Circle className="w-8 h-8 text-white/50" />
                  )}
                  {index < roadmapItems.length - 1 && (
                    <div className="w-1 h-24 bg-gradient-to-b from-healing-mint/50 to-transparent mt-2" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">{phase.phase}</h3>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          phase.status === 'In Progress'
                            ? 'bg-healing-mint/20 text-healing-mint'
                            : 'bg-gray-700 text-white/70'
                        }`}
                      >
                        {phase.status}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-white/80 flex items-start">
                          <span className="text-healing-mint mr-3">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-white/70 mb-8">Subscribe to our newsletter to get notified about new features</p>
          <form className="flex max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
            />
            <button
              type="submit"
              className="bg-healing-mint text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

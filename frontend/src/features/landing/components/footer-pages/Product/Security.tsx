import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';

export const Security: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All patient data is encrypted using industry-standard AES-256 encryption both in transit and at rest.'
    },
    {
      icon: Shield,
      title: 'HIPAA Compliance',
      description: 'Full compliance with HIPAA regulations to protect patient privacy and maintain data integrity.'
    },
    {
      icon: Eye,
      title: 'Access Control',
      description: 'Role-based access control ensures staff can only view data they are authorized to access.'
    }
  ];

  const certifications = ['HIPAA', 'SOC 2 Type II', 'ISO 27001', 'GDPR Compliant'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Security & Compliance</h1>
          <p className="text-xl text-white/70 mt-2">We take your data security seriously</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Security Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-all"
              >
                <Icon className="w-12 h-12 text-healing-mint mb-4" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Certifications */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Certifications & Compliance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-healing-mint/20 to-blue-600/20 rounded-lg p-6 text-center border border-healing-mint/30"
              >
                <p className="font-bold text-healing-mint">{cert}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-8">Our Security Practices</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-healing-mint text-lg mb-2">Regular Security Audits</h3>
              <p className="text-white/70">
                We conduct regular third-party security audits to identify and address vulnerabilities.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint text-lg mb-2">Secure Infrastructure</h3>
              <p className="text-white/70">
                Our infrastructure is hosted on AWS with multi-region redundancy and automatic backups.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint text-lg mb-2">Data Backup & Recovery</h3>
              <p className="text-white/70">
                Automatic daily backups with recovery point objectives (RPO) of less than 1 hour.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint text-lg mb-2">Incident Response</h3>
              <p className="text-white/70">
                24/7 security monitoring and incident response team for immediate threat mitigation.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint text-lg mb-2">Staff Training</h3>
              <p className="text-white/70">
                All team members undergo regular security training and background checks.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Security */}
        <div className="mt-16 bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Have Security Questions?</h2>
          <p className="text-xl text-white/70 mb-8">Our security team is ready to address your concerns</p>
          <a
            href="mailto:security@malasakit.com"
            className="inline-block bg-healing-mint text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors"
          >
            Contact Security Team
          </a>
        </div>
      </div>
    </div>
  );
};

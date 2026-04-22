import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';

export const OWASPCompliance: React.FC = () => {
  const standards = [
    {
      name: 'A01: Broken Access Control',
      status: 'Compliant',
      description: 'Role-based access control and proper authentication mechanisms implemented'
    },
    {
      name: 'A02: Cryptographic Failures',
      status: 'Compliant',
      description: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256)'
    },
    {
      name: 'A03: Injection',
      status: 'Compliant',
      description: 'Parameterized queries and input validation on all user inputs'
    },
    {
      name: 'A04: Insecure Design',
      status: 'Compliant',
      description: 'Security-by-design principles and threat modeling integrated'
    },
    {
      name: 'A05: Security Misconfiguration',
      status: 'Compliant',
      description: 'Regular security audits and configuration reviews'
    },
    {
      name: 'A06: Vulnerable Components',
      status: 'Compliant',
      description: 'Automatic dependency scanning and patching'
    },
    {
      name: 'A07: Authentication Failures',
      status: 'Compliant',
      description: 'Multi-factor authentication and secure password policies'
    },
    {
      name: 'A08: Software/Data Integrity Failures',
      status: 'Compliant',
      description: 'Signed dependencies and secure CI/CD pipeline'
    },
    {
      name: 'A09: Logging & Monitoring Failures',
      status: 'Compliant',
      description: '24/7 security monitoring and comprehensive audit logs'
    },
    {
      name: 'A10: SSRF',
      status: 'Compliant',
      description: 'Network segmentation and request validation'
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
          <h1 className="text-4xl font-bold">OWASP Compliance</h1>
          <p className="text-xl text-white/70 mt-2">Security Top 10 Compliance Overview</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Overview */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10 mb-16">
          <h2 className="text-3xl font-bold mb-6">About OWASP</h2>
          <p className="text-white/80 mb-6">
            The Open Worldwide Application Security Project (OWASP) is a nonprofit foundation that works to improve the 
            security of software. The OWASP Top 10 is a standard list of the most critical web application security risks.
          </p>
          <p className="text-white/80">
            Malasakit Solutions is fully compliant with OWASP Top 10 standards. Our development process includes 
            security reviews, code analysis, and penetration testing to ensure protection against these vulnerabilities.
          </p>
        </div>

        {/* Compliance Details */}
        <h2 className="text-3xl font-bold mb-8">Compliance Status</h2>
        <div className="grid grid-cols-1 gap-4 mb-16">
          {standards.map((standard, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-lg p-6 border border-white/10 hover:border-healing-mint/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-healing-mint" />
                    {standard.name}
                  </h3>
                  <p className="text-white/70">{standard.description}</p>
                </div>
                <span className="ml-4 px-4 py-2 bg-healing-mint/20 text-healing-mint rounded-full text-sm font-bold">
                  {standard.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Security Initiatives */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10 mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Security Initiatives</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-healing-mint flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Secure Development Lifecycle</h3>
                <p className="text-white/70">
                  Security is integrated into every stage of our development process, from design through deployment.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-healing-mint flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Regular Audits & Testing</h3>
                <p className="text-white/70">
                  We conduct quarterly security audits, annual penetration testing, and continuous vulnerability scanning.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-healing-mint flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Bug Bounty Program</h3>
                <p className="text-white/70">
                  We maintain an active bug bounty program to identify and remediate security issues quickly.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-healing-mint flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Incident Response Plan</h3>
                <p className="text-white/70">
                  We have a documented incident response plan with 24/7 monitoring and rapid response capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certification */}
        <div className="bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Additional Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {['SOC 2 Type II', 'ISO 27001', 'HIPAA', 'GDPR'].map((cert) => (
              <div key={cert} className="bg-gray-800/50 rounded-lg p-6 border border-healing-mint/30">
                <p className="font-bold text-healing-mint">{cert}</p>
                <p className="text-white/60 text-sm mt-2">Certified</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

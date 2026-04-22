import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Lightbulb } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">About Malasakit</h1>
          <p className="text-xl text-white/70 mt-2">Transforming healthcare practice management</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <div className="mb-16 bg-gray-800/50 rounded-lg p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl text-white/70 leading-relaxed">
            At Malasakit, we believe that healthcare professionals should spend their time caring for patients, not managing administrative tasks. 
            We're committed to creating innovative, user-friendly software that empowers clinics and practices to operate more efficiently, 
            reduce costs, and ultimately deliver better patient care.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-colors">
            <Users className="w-12 h-12 text-healing-mint mb-4" />
            <h3 className="text-xl font-bold mb-3">Patient-Centric</h3>
            <p className="text-white/70">
              Everything we build is designed with patients and healthcare providers in mind.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-colors">
            <Target className="w-12 h-12 text-healing-mint mb-4" />
            <h3 className="text-xl font-bold mb-3">Reliable & Secure</h3>
            <p className="text-white/70">
              We maintain the highest standards of security and reliability for sensitive healthcare data.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-8 border border-white/10 hover:border-healing-mint/50 transition-colors">
            <Lightbulb className="w-12 h-12 text-healing-mint mb-4" />
            <h3 className="text-xl font-bold mb-3">Innovative</h3>
            <p className="text-white/70">
              We continuously innovate to bring cutting-edge solutions to healthcare management.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10 mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              Malasakit was founded by a team of healthcare professionals and software engineers who recognized a critical gap in the market. 
              We saw firsthand how clinics were struggling with outdated, fragmented systems that wasted time and money.
            </p>
            <p>
              "Malasakit" means compassion in Filipino – it reflects our commitment to serving healthcare providers with genuine care and understanding. 
              We've built a platform that addresses real pain points faced by clinics every single day.
            </p>
            <p>
              Today, we're proud to serve hundreds of healthcare practitioners and clinics across the region, helping them provide better care to their patients.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="bg-gradient-to-br from-healing-mint/20 to-blue-600/20 rounded-lg p-8 text-center border border-healing-mint/30">
            <p className="text-4xl font-bold text-healing-mint mb-2">500+</p>
            <p className="text-white/70">Active Users</p>
          </div>
          <div className="bg-gradient-to-br from-healing-mint/20 to-blue-600/20 rounded-lg p-8 text-center border border-healing-mint/30">
            <p className="text-4xl font-bold text-healing-mint mb-2">150+</p>
            <p className="text-white/70">Healthcare Facilities</p>
          </div>
          <div className="bg-gradient-to-br from-healing-mint/20 to-blue-600/20 rounded-lg p-8 text-center border border-healing-mint/30">
            <p className="text-4xl font-bold text-healing-mint mb-2">1M+</p>
            <p className="text-white/70">Patient Records</p>
          </div>
          <div className="bg-gradient-to-br from-healing-mint/20 to-blue-600/20 rounded-lg p-8 text-center border border-healing-mint/30">
            <p className="text-4xl font-bold text-healing-mint mb-2">99.9%</p>
            <p className="text-white/70">Uptime</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Join Us on Our Mission</h2>
          <p className="text-xl text-white/70 mb-8">Transform your practice with Malasakit today</p>
          <Link
            to="/pricing"
            className="inline-block bg-healing-mint text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

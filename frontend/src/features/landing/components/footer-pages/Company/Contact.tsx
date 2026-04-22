import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-xl text-white/70 mt-2">We'd love to hear from you</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info */}
          <div className="md:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10">
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-healing-mint mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Email</h3>
                    <a
                      href="mailto:info@malasakit.com"
                      className="text-white/70 hover:text-healing-mint transition-colors"
                    >
                      info@malasakit.com
                    </a>
                    <p className="text-white/60 text-sm mt-1">We respond within 24 hours</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10">
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-healing-mint mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Phone</h3>
                    <a
                      href="tel:+639457123456"
                      className="text-white/70 hover:text-healing-mint transition-colors"
                    >
                      +63 9457 123 456
                    </a>
                    <p className="text-white/60 text-sm mt-1">Mon-Fri, 9AM-6PM PST</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-healing-mint mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Location</h3>
                    <p className="text-white/70">
                      Bacolod City<br />
                      Negros Occidental<br />
                      Philippines, 6100
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10">
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-healing-mint mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Business Hours</h3>
                    <p className="text-white/70 text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday - Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2 bg-gray-800/50 rounded-lg p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-healing-mint text-gray-900 py-3 rounded-lg font-bold hover:bg-white transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="bg-gray-800/50 rounded-lg p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-healing-mint mb-2">How long does implementation take?</h3>
              <p className="text-white/70">
                Typically 2-4 weeks depending on your clinic size and requirements.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">Do you offer training?</h3>
              <p className="text-white/70">
                Yes, we provide comprehensive onboarding and training for all staff members.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">What about data migration?</h3>
              <p className="text-white/70">
                We handle secure migration from your existing system at no additional cost.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-healing-mint mb-2">Do you provide 24/7 support?</h3>
              <p className="text-white/70">
                Premium plans include 24/7 support. Standard plans have business hours support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

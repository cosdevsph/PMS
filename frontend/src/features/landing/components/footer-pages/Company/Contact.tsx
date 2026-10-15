import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 font-body transition-colors focus:outline-none focus:border-care-blue focus:ring-2 focus:ring-care-blue/30';

const labelClass = 'block text-sm font-semibold text-gray-900 mb-2 font-body';

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

  const linkClass =
    'text-gray-700 hover:text-care-blue transition-colors break-all rounded font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue';

  return (
    <PublicPageLayout title="Contact">
      <PageHeader category="Company" title="Contact Us" description="We'd love to hear from you" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-16 sm:mb-20">
          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4 content-start">
            {/* Email */}
            <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                <Mail className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 font-heading">Email</h3>
                <a href="mailto:info@malasakit.com" className={linkClass}>
                  info@malasakit.com
                </a>
                <p className="text-steady-slate text-sm mt-1 font-body">We respond within 24 hours</p>
              </div>
            </div>

            {/* Phone */}
            <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                <Phone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 font-heading">Phone</h3>
                <a href="tel:+639457123456" className={linkClass}>
                  +63 9457 123 456
                </a>
                <p className="text-steady-slate text-sm mt-1 font-body">Mon-Fri, 9AM-6PM PST</p>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 font-heading">Location</h3>
                <p className="text-gray-700 font-body">
                  Bacolod City<br />
                  Negros Occidental<br />
                  Philippines, 6100
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 font-heading">Business Hours</h3>
                <p className="text-gray-700 text-sm leading-relaxed font-body">
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-sm p-6 sm:p-10">
            <h2 className="text-2xl sm:text-3xl tracking-tight text-gray-900 font-display mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClass}>Your Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className={labelClass}>Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-message" className={labelClass}>Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`${inputClass} resize-y`}
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-gradient text-white py-3.5 rounded-xl font-bold hover:opacity-95 active:opacity-90 transition-opacity shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Preview */}
        <section aria-labelledby="contact-faq-title" className="rounded-3xl bg-clinical-cloud ring-1 ring-gray-200/60 px-6 py-10 sm:px-12 sm:py-12">
          <h2 id="contact-faq-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8 text-center">Frequently Asked Questions</h2>
          <dl className="grid md:grid-cols-2 gap-x-10 gap-y-8 max-w-5xl mx-auto">
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">How long does implementation take?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                Typically 2-4 weeks depending on your clinic size and requirements.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">Do you offer training?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                Yes, we provide comprehensive onboarding and training for all staff members.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">What about data migration?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                We handle secure migration from your existing system at no additional cost.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">Do you provide 24/7 support?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                Premium plans include 24/7 support. Standard plans have business hours support.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </PublicPageLayout>
  );
};

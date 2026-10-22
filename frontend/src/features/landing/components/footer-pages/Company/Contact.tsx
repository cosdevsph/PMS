import React, { useState } from 'react';
import { Mail, MapPin, Clock, GraduationCap } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { DEMO_REQUEST_MAILTO, ONSITE_TRAINING_AREA, TRAINING_SUMMARY } from '../../../data/support';

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
                <p className="text-steady-slate text-sm mt-1 font-body">We reply within one business day</p>
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

            {/* Live demo & training */}
            <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 font-heading">Live Demo &amp; Training</h3>
                <p className="text-gray-700 text-sm leading-relaxed font-body">
                  Free live demo, online or on-site. Staff training on request, on-site within the {ONSITE_TRAINING_AREA}. By appointment.
                </p>
                <a href={DEMO_REQUEST_MAILTO} className="inline-block mt-2 text-sm font-semibold text-care-blue underline underline-offset-4 hover:text-trust-harbor transition-colors rounded font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue">
                  Schedule a Live Demo
                </a>
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
              <dt className="font-bold text-trust-harbor mb-2 font-heading">How do I get started?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                Start the 14-day free trial (no credit card required) and follow the guided clinic setup. Our video guides and User Manual walk you through each module.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">Do you offer training?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                {TRAINING_SUMMARY}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">What about data migration?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                You can import your existing patient list yourself from a CSV or Excel template. We do not currently offer a migration service, and other records are not imported automatically.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-trust-harbor mb-2 font-heading">What support do you provide?</dt>
              <dd className="text-steady-slate leading-relaxed font-body">
                Email and in-app support tickets, Monday to Friday, 9:00 AM to 6:00 PM (Philippine Time). We do not currently offer phone or 24/7 support.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </PublicPageLayout>
  );
};

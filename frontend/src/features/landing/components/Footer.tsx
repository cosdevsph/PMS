import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';
import MESLogo from '@/assets/malasakit/Primary Logo - White.svg';

const linkFocus = 'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-blue';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Security', href: '/security' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'User Manual', href: '/user-manual' }
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'OWASP Compliance', href: '/owasp-compliance' },
      { label: 'Cookie Policy', href: '/cookie-policy' }
    ]
  };

  const columns = [
    { title: 'Product', links: footerLinks.product },
    { title: 'Company', links: footerLinks.company },
    { title: 'Legal', links: footerLinks.legal },
  ];

  const socials = [
    { label: 'Facebook', icon: Facebook },
    { label: 'Twitter', icon: Twitter },
    { label: 'LinkedIn', icon: Linkedin },
  ];

  return (
    <footer className="relative bg-primary-gradient text-white overflow-hidden">
      {/* Brand pillar-arch motif (static) */}
      <div className="absolute right-0 bottom-0 hidden md:flex items-end gap-4 pr-10 pointer-events-none" aria-hidden="true">
        <div className="w-24 h-72 rounded-t-full bg-white/[0.04] border-t border-l border-white/[0.06]" />
        <div className="w-28 h-56 rounded-t-full bg-white/[0.03] border-t border-l border-white/[0.05]" />
        <div className="w-20 h-40 rounded-t-full bg-white/[0.02] border-t border-l border-white/[0.04]" />
      </div>

      <div className="relative z-10 max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className={`inline-flex items-center ${linkFocus}`}>
              <img
                src={MESLogo}
                alt="Malasakit Logo"
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-6 text-base text-white/85 max-w-sm leading-relaxed font-body">
              Modern practice management software designed for healthcare professionals
              who want to focus on patient care.
            </p>

            {/* Contact Info */}
            <address className="mt-8 space-y-4 not-italic">
              <a href="mailto:malasakitsolutions@gmail.com" className={`flex items-center w-fit text-base text-white/85 hover:text-white transition-colors font-body break-all ${linkFocus}`}>
                <Mail className="w-5 h-5 mr-3 text-healing-mint shrink-0" aria-hidden="true" />
                malasakitsolutions@gmail.com
              </a>
              <a href="tel:+639457123456" className={`flex items-center w-fit text-base text-white/85 hover:text-white transition-colors font-body ${linkFocus}`}>
                <Phone className="w-5 h-5 mr-3 text-healing-mint shrink-0" aria-hidden="true" />
                +63 9457 123 456
              </a>
              <div className="flex items-start text-base">
                <MapPin className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-healing-mint" aria-hidden="true" />
                <span className="text-white/85 font-body">Bacolod City, Negros Occidental, Philippines, 6100</span>
              </div>
            </address>

            {/* Social Links */}
            <div className="mt-8 flex items-center gap-3">
              {socials.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className={`w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white ${linkFocus} focus-visible:rounded-full`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <nav aria-label="Footer" className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white mb-5 font-heading">{column.title}</h3>
                <ul className="space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className={`text-base text-white/85 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors font-body ${linkFocus}`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/15">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <p className="text-sm sm:text-base text-white/80 font-body">
              © {currentYear} Malasakit. All rights reserved.
            </p>
            <div className="flex items-center gap-6 sm:gap-8">
              <a href="#" className={`text-sm sm:text-base text-white/80 hover:text-white transition-colors font-body ${linkFocus}`}>Twitter</a>
              <a href="#" className={`text-sm sm:text-base text-white/80 hover:text-white transition-colors font-body ${linkFocus}`}>LinkedIn</a>
              <a href="#" className={`text-sm sm:text-base text-white/80 hover:text-white transition-colors font-body ${linkFocus}`}>Facebook</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

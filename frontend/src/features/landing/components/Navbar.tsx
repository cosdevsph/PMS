import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import MESLogo from '@/assets/malasakit/PrimaryLogo-Colored.svg';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 20);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasMenuOpen = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Move focus into the drawer when it opens and back to the toggle when it closes
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeButtonRef.current?.focus();
    } else if (wasMenuOpen.current) {
      toggleButtonRef.current?.focus();
    }
    wasMenuOpen.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  // Keep Tab focus cycling inside the open drawer
  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'About', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'Pricing', id: 'plans' },
    { label: 'FAQ', id: 'faq' }
  ];

  const handleNavLinkClick = (link: { label: string; id?: string; path?: string }) => {
    setIsMobileMenuOpen(false);

    if (link.path) {
      navigate(link.path);
    } else if (link.id) {
      if (location.pathname !== '/') {
        navigate('/');
        // Small delay to ensure the DOM updates before scrolling
        setTimeout(() => {
          scrollToSection(link.id as string);
        }, 100);
      } else {
        scrollToSection(link.id);
      }
    }
  };

  return (
    <>
      <nav
        aria-label="Main"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 transition-[background-color,box-shadow] duration-300 rounded-2xl ring-1 ring-gray-900/5 ${
          isScrolled ? 'bg-white/85 backdrop-blur-md shadow-lg shadow-gray-900/5' : 'bg-white shadow-sm'
        }`}
        style={{ width: 'calc(100% - 48px)', maxWidth: '1600px' }}
      >
        <div className="max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className={`flex items-center space-x-3 z-50 rounded-lg ${focusRing}`}>
              <img
                src={MESLogo}
                alt="Malasakit Logo"
                className="h-8 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleNavLinkClick(link)}
                  className={`px-4 py-2 text-[15px] font-medium text-trust-harbor hover:text-care-blue hover:bg-clinical-cloud active:bg-care-blue/10 rounded-lg transition-colors flex items-center font-body ${focusRing}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/login"
                className={`px-5 py-2.5 text-[15px] font-medium text-trust-harbor hover:text-care-blue rounded-lg transition-colors font-body ${focusRing}`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`px-6 py-2.5 text-[15px] font-semibold text-white bg-trust-harbor rounded-xl hover:bg-trust-harbor/90 active:bg-trust-harbor transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none font-body ${focusRing}`}
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-3 -mr-3 rounded-lg text-trust-harbor hover:bg-gray-100 transition-colors z-50 relative ${focusRing}`}
              aria-label="Toggle Menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!isMobileMenuOpen}
        onKeyDown={handleDrawerKeyDown}
        className={`fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
          <span className="text-xl font-bold text-trust-harbor font-heading">Menu</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors ${focusRing}`}
            aria-label="Close Menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNavLinkClick(link)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-base font-medium text-trust-harbor hover:bg-clinical-cloud active:bg-care-blue/10 rounded-xl transition-colors font-body group ${focusRing}`}
            >
              {link.label}
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-care-blue transition-colors" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 bg-clinical-cloud/60 space-y-3">
          <Link
            to="/login"
            className={`flex items-center justify-center w-full px-4 py-3.5 text-base font-medium text-trust-harbor bg-white border border-gray-200 hover:bg-gray-50 hover:text-care-blue rounded-xl transition-colors font-body shadow-sm ${focusRing}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className={`flex items-center justify-center w-full px-4 py-3.5 text-base font-semibold text-white bg-trust-harbor hover:bg-trust-harbor/90 rounded-xl transition-all shadow-md hover:shadow-lg font-body ${focusRing}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
};

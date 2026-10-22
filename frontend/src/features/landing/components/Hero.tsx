import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Stethoscope, CalendarCheck, CreditCard } from 'lucide-react';
import { BlurText } from './motion/BlurText';
import { SpotlightCard } from './motion/SpotlightCard';
import { Reveal } from './motion/Reveal';
import RotatingText from './motion/RotatingText';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

const capabilities = [
  { icon: Stethoscope, label: 'Patient Records & SOAP' },
  { icon: CalendarCheck, label: 'Smart Scheduling' },
  { icon: CreditCard, label: 'Billing & Invoicing' },
];

/** Shared by all three hero buttons so they read as one group: identical height, padding, radius, type and icon size. */
const ctaBase =
  'group inline-flex h-12 sm:h-14 w-full items-center justify-center gap-2.5 px-4 rounded-xl text-sm sm:text-base font-bold font-heading whitespace-nowrap transition-all duration-200 motion-reduce:transform-none';

const ctaFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-blue';

export const Hero: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section className="relative min-h-screen bg-primary-gradient overflow-hidden flex flex-col justify-center">
      {/* Brand Identity Pillar Arches (Subtle background brand motif) */}
      <div className="absolute right-0 bottom-0 pointer-events-none overflow-hidden flex items-end gap-4 z-0 pr-8 lg:pr-16" aria-hidden="true">
        <div className="w-24 lg:w-32 h-80 lg:h-[28rem] rounded-t-full bg-white/[0.04] border-t border-l border-white/[0.06]" />
        <div className="w-28 lg:w-36 h-64 lg:h-80 rounded-t-full bg-white/[0.03] border-t border-l border-white/[0.05]" />
        <div className="w-20 lg:w-28 h-48 lg:h-60 rounded-t-full bg-white/[0.02] border-t border-l border-white/[0.04]" />
      </div>

      {/* Hero Background Image with Responsive Fit & Left-to-Right Gradient Fade */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <img
          src="/assets/hero-bg/hero-bg.png"
          alt=""
          className="w-full h-full object-cover object-left lg:object-[left_center]"
          style={{
            maskImage:
              'linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 25%, rgba(0, 0, 0, 0.3) 55%, rgba(0, 0, 0, 0) 85%)',
            WebkitMaskImage:
              'linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 25%, rgba(0, 0, 0, 0.3) 55%, rgba(0, 0, 0, 0) 85%)',
          }}
        />
        {/* Soft Care Blue contrast veil on the left to ensure maximum headline text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-care-blue/50 via-care-blue/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Static ambient lighting — Care Blue dominant with a soft Healing Mint accent */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-care-blue rounded-full opacity-35 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-12 right-12 w-64 h-64 lg:w-80 lg:h-80 bg-healing-mint rounded-full opacity-[0.12] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6 pt-36 sm:pt-40 lg:pt-32 pb-16 lg:pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[calc(50%-1.5rem)_minmax(0,1fr)] gap-12 lg:gap-6 items-center">

          {/* Left Column — Value messaging and primary actions */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <h1 className="text-[length:clamp(2.5rem,14vw,6rem)] sm:text-8xl md:text-[7rem] lg:text-7xl xl:text-8xl 2xl:text-[7rem] text-white leading-[1.08] tracking-tight font-display">
              {/* Stable heading text for screen readers and crawlers; the rotating visual is aria-hidden */}
              <span className="sr-only">Smarter care, clinics, workflows, and health</span>
              <span aria-hidden="true" className="block">
                <BlurText
                  text="Smarter"
                  delay={80}
                  direction="top"
                  className="block text-white font-heading font-extrabold tracking-tight"
                />
                {/* Own line, so width changes of the rotating word never reflow "Smarter" */}
                <span className="flex justify-center lg:justify-start mt-2 sm:mt-3 xl:mt-4">
                  <RotatingText
                    texts={['Care', 'Clinics', 'Workflows', 'Health']}
                    effect="slide"
                    direction="up"
                    highlight
                    highlightColor="#5CDB95"
                    staggerFrom="last"
                    staggerDuration={0.025}
                    rotationInterval={2500}
                    splitBy="characters"
                    blur={0}
                    auto={!prefersReducedMotion}
                    loop
                    pauseOnHover={false}
                    mainClassName="font-heading font-extrabold tracking-tight shadow-lg shadow-trust-harbor/20"
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    elementLevelClassName="font-heading font-extrabold text-trust-harbor"
                  />
                </span>
              </span>
            </h1>

            {/* Call-to-Actions: one group of three equal buttons (same size, shape, alignment and spacing) */}
            <div className="mt-8 sm:mt-10 w-full max-w-xl">
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  to="/register"
                  className={`${ctaBase} text-care-blue bg-white shadow-xl shadow-trust-harbor/20 hover:bg-clinical-cloud active:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0 ${ctaFocus}`}
                >
                  <span>Start Trial</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-care-blue group-hover:translate-x-1 motion-reduce:transform-none transition-transform duration-200" aria-hidden="true" />
                </Link>

                <Link
                  to="/demo"
                  className={`${ctaBase} text-white bg-transparent ring-1 ring-inset ring-white/50 hover:bg-white/10 hover:ring-white/70 active:bg-white/15 ${ctaFocus}`}
                >
                  <Play className="w-4 h-4 shrink-0 text-healing-mint fill-healing-mint/30" aria-hidden="true" />
                  <span>Video Guides</span>
                </Link>

                <Link
                  to="/user-manual"
                  className={`${ctaBase} text-white bg-transparent ring-1 ring-inset ring-white/50 hover:bg-white/10 hover:ring-white/70 active:bg-white/15 ${ctaFocus}`}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-healing-mint" aria-hidden="true" />
                  <span>User Manual</span>
                </Link>
              </div>
            </div>

            {/* Healthcare Capability Anchors */}
            <ul className="mt-10 pt-6 border-t border-white/15 w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {capabilities.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 ring-1 ring-inset ring-white/10 text-white"
                >
                  <Icon className="w-4 h-4 text-healing-mint shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-body leading-tight">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column — Marketing Video Showcase */}
          <Reveal className="relative w-full lg:-mr-4 flex justify-center">
            <div className="w-full max-w-2xl md:max-w-3xl xl:max-w-4xl relative">

              {/* Soft ambient radiance behind the video card */}
              <div
                className="absolute -inset-4 bg-gradient-to-r from-care-blue/40 via-care-blue/25 to-healing-mint/20 rounded-[3rem] blur-2xl opacity-60 pointer-events-none"
                aria-hidden="true"
              />

              {/* Spotlight Card Framing */}
              <SpotlightCard
                className="bg-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-4 lg:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/25 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
                spotlightColor="rgba(255, 255, 255, 0.18)"
                size={550}
              >
                {/* Media Container with 16:9 Aspect Ratio */}
                <div className="aspect-video bg-gray-950 rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl ring-1 ring-white/10">
                  <video
                    className="w-full h-full object-cover relative z-10"
                    controls
                    preload="metadata"
                    playsInline
                    aria-label="Malasakit Practice Management System Overview Video"
                  >
                    <source src="/videos/Malasakit%20-Landing.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </SpotlightCard>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
};

export default Hero;

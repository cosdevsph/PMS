import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Stethoscope, CalendarCheck, CreditCard } from 'lucide-react';
import { BlurText } from './motion/BlurText';
import { SpotlightCard } from './motion/SpotlightCard';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-primary-gradient overflow-hidden flex flex-col justify-center">
      {/* Brand Identity Pillar Arches (Subtle background brand motif) */}
      <div className="absolute right-0 bottom-0 pointer-events-none overflow-hidden flex items-end gap-4 z-0 pr-8 lg:pr-16" aria-hidden="true">
        <div className="w-24 lg:w-32 h-80 lg:h-[28rem] rounded-t-full bg-white/[0.04] border-t border-l border-white/[0.06]" />
        <div className="w-28 lg:w-36 h-64 lg:h-80 rounded-t-full bg-white/[0.03] border-t border-l border-white/[0.05]" />
        <div className="w-20 lg:w-28 h-48 lg:h-60 rounded-t-full bg-white/[0.02] border-t border-l border-white/[0.04]" />
      </div>

      {/* Ambient Lighting Orbs — Care Blue Dominant */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-care-blue rounded-full opacity-35 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 left-10 w-72 h-72 bg-care-blue rounded-full opacity-25 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-12 right-12 w-64 h-64 lg:w-80 lg:h-80 bg-healing-mint rounded-full opacity-12 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Ambient Depth Elements (Care Blue & White Focused) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="animate-float-slow absolute top-[15%] left-[8%] w-24 h-24 rounded-full bg-white/10 backdrop-blur-md" style={{ animationDelay: '0s' }} />
        <div className="animate-float-slow absolute top-[65%] left-[4%] w-32 h-32 rounded-full bg-white/10 backdrop-blur-md" style={{ animationDelay: '3s' }} />
        <div className="animate-float-medium absolute top-[12%] right-[28%] w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm" style={{ animationDelay: '2s' }} />
        <div className="animate-float-medium absolute bottom-[18%] left-[22%] w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm" style={{ animationDelay: '4.5s' }} />
        <div className="animate-float-fast absolute top-[28%] left-[42%] w-8 h-8 rounded-full bg-white/20" style={{ animationDelay: '1s' }} />
        <div className="animate-float-fast absolute bottom-[28%] right-[15%] w-10 h-10 rounded-full bg-healing-mint/15" style={{ animationDelay: '3.5s' }} />
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-0 pb-16 lg:pb-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Column — Healthcare SaaS Value Messaging */}
          <div className="text-center lg:text-left lg:col-span-6 xl:col-span-5 flex flex-col items-center lg:items-start">


            {/* Headline with React Bits BlurText — Inter Bold & Black */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold sm:font-black text-white leading-[1.08] font-display tracking-tight">
              <BlurText
                text="Empowering Filipino"
                delay={80}
                direction="top"
                className="block text-white font-black font-display tracking-tight"
              />
              <span className="block mt-1 sm:mt-2 text-white font-bold lg:font-extrabold font-display">
                <BlurText
                  text="Health Providers"
                  delay={90}
                  direction="top"
                  className="text-white font-bold lg:font-extrabold font-display drop-shadow-sm"
                />
              </span>
            </h1>

            {/* Supporting Subheading / Body — Plus Jakarta Sans Regular */}
            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-white/90 max-w-lg mx-auto lg:mx-0 leading-relaxed font-body font-normal transition-all duration-500">
              Streamline your clinic operations with our all-in-one platform. Manage appointments,
              patient records, and billing effortlessly.
            </p>

            {/* Healthcare Capability Anchors — Plus Jakarta Sans Regular */}
            <div className="mt-8 pt-6 border-t border-white/15 w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/95">
                <Stethoscope className="w-4 h-4 text-healing-mint shrink-0" />
                <span className="text-xs sm:text-sm font-normal font-body leading-tight">Patient Records & SOAP</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/95">
                <CalendarCheck className="w-4 h-4 text-healing-mint shrink-0" />
                <span className="text-xs sm:text-sm font-normal font-body leading-tight">Smart Scheduling</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/95">
                <CreditCard className="w-4 h-4 text-healing-mint shrink-0" />
                <span className="text-xs sm:text-sm font-normal font-body leading-tight">Billing & Invoicing</span>
              </div>
            </div>

          </div>

          {/* Right Column — Marketing Video Showcase & Call-to-Actions */}
          <div className="relative w-full lg:col-span-6 xl:col-span-7 mt-4 lg:mt-0 flex flex-col items-center justify-center">

            {/* Marketing Video Centerpiece wrapped in React Bits SpotlightCard */}
            <div className="w-full max-w-2xl xl:max-w-3xl relative">

              {/* Soft Ambient Radiance behind Video Card — Blue Dominant */}
              <div
                className="absolute -inset-4 bg-gradient-to-r from-care-blue/40 via-care-blue/25 to-healing-mint/20 rounded-[3rem] blur-2xl opacity-60 pointer-events-none transition-opacity duration-500"
                aria-hidden="true"
              />

              {/* Spotlight Card Framing */}
              <SpotlightCard
                className="bg-white/10 backdrop-blur-md rounded-[2.2rem] sm:rounded-[2.5rem] p-3.5 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-white/25 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)] hover:border-white/40"
                spotlightColor="rgba(5, 117, 230, 0.25)"
                size={550}
              >
                {/* Media Container with 16:9 Aspect Ratio */}
                <div className="aspect-video bg-gray-950 rounded-2xl sm:rounded-3xl overflow-hidden relative group shadow-2xl border border-white/10">
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

            {/* Relocated CTA Buttons Beneath Video with Refined Interactions */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center w-full gap-3.5 sm:gap-4 relative z-10">

              {/* Primary CTA — Start Trial (Inter Bold) */}
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 text-base font-bold text-care-blue bg-white rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 font-display flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-blue"
              >
                <span>Start Trial</span>
                <ArrowRight className="w-4 h-4 text-care-blue group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              {/* Secondary CTA — Watch Demo (Inter Semi-Bold) */}
              <Link
                to="/demo"
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 text-base font-semibold text-white bg-trust-harbor border-2 border-white/20 rounded-xl hover:bg-trust-harbor/90 hover:border-white/40 active:bg-trust-harbor/80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 font-heading flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-blue"
              >
                <Play className="w-4 h-4 text-healing-mint fill-healing-mint/30 group-hover:scale-110 transition-transform duration-200" />
                <span>Watch Demo</span>
              </Link>

              {/* Tertiary CTA — Learn How It Works (Inter Semi-Bold) */}
              <Link
                to="/user-manual"
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 text-base font-semibold text-white bg-trust-harbor border-2 border-white/20 rounded-xl hover:bg-trust-harbor/90 hover:border-white/40 active:bg-trust-harbor/80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 font-heading flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-blue"
              >
                <BookOpen className="w-4 h-4 text-white/80 group-hover:text-white transition-colors duration-200" />
                <span>Learn How It Works</span>
              </Link>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

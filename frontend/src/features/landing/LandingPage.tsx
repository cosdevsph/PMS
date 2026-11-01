import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Features } from './components/Features';
import { WhyChoose } from './components/WhyChoose';
import { Plans } from './components/Plans';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { MalasakitAIChat } from './components/MalasakitAIChat';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <WhyChoose />
      <Plans />
      <FAQ />
      <Footer />
      <MalasakitAIChat />
    </div>
  );
};
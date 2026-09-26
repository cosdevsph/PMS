import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-primary-gradient overflow-hidden flex flex-col justify-center">
      {/* Subtle Floating Lights */}
      <div className="absolute top-20 right-20 w-64 h-64 lg:w-80 lg:h-80 bg-healing-mint rounded-full opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-10 w-48 h-48 lg:w-64 lg:h-64 bg-white rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large slow particles */}
        <div className="animate-float-slow absolute top-[15%] left-[8%] w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm" style={{ animationDelay: '0s' }} />
        <div className="animate-float-slow absolute top-[60%] left-[3%] w-36 h-36 rounded-full bg-healing-mint/15 backdrop-blur-sm" style={{ animationDelay: '3s' }} />
        <div className="animate-float-slow absolute top-[25%] right-[38%] w-24 h-24 rounded-full bg-white/10" style={{ animationDelay: '6s' }} />
        <div className="animate-float-slow absolute bottom-[10%] left-[30%] w-32 h-32 rounded-full bg-healing-mint/10" style={{ animationDelay: '1.5s' }} />

        {/* Medium particles */}
        <div className="animate-float-medium absolute top-[40%] left-[18%] w-16 h-16 rounded-full bg-white/15" style={{ animationDelay: '1s' }} />
        <div className="animate-float-medium absolute top-[10%] left-[45%] w-20 h-20 rounded-full bg-healing-mint/20" style={{ animationDelay: '4s' }} />
        <div className="animate-float-medium absolute top-[70%] left-[50%] w-14 h-14 rounded-full bg-white/10" style={{ animationDelay: '2s' }} />
        <div className="animate-float-medium absolute bottom-[20%] left-[20%] w-20 h-20 rounded-full bg-healing-mint/15" style={{ animationDelay: '5s' }} />

        {/* Small fast particles */}
        <div className="animate-float-fast absolute top-[30%] left-[35%] w-8 h-8 rounded-full bg-white/20" style={{ animationDelay: '0.5s' }} />
        <div className="animate-float-fast absolute top-[55%] left-[12%] w-10 h-10 rounded-full bg-healing-mint/25" style={{ animationDelay: '2.5s' }} />
        <div className="animate-float-fast absolute top-[20%] left-[60%] w-8 h-8 rounded-full bg-white/15" style={{ animationDelay: '3.5s' }} />
        <div className="animate-float-fast absolute bottom-[30%] left-[42%] w-6 h-6 rounded-full bg-white/20" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 lg:pt-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left lg:col-span-6 xl:col-span-5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] font-display">
              Empowering Filipino{' '}
              <span className="block lg:inline text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] font-display">Health Providers</span>
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-white/80 max-w-md mx-auto lg:mx-0 leading-relaxed font-body">
              Streamline your clinic operations with our all-in-one platform. Manage appointments,
              patient records, and billing effortlessly.
            </p>
          </div>

          {/* Right Column - Video Presentation & Buttons */}
          <div className="relative w-full lg:col-span-6 xl:col-span-7 mt-8 lg:mt-0 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl xl:max-w-3xl relative">
              {/* Decorative background glow for video */}
              <div className="absolute -inset-4 bg-gradient-to-r from-healing-mint/30 to-care-blue/30 rounded-[3rem] blur-2xl opacity-50 animate-pulse pointer-events-none"></div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-white/20 relative z-10 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.25)] w-full">
                <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group shadow-inner">
                  {/* Placeholder for Video */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white flex-col z-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm cursor-pointer border border-white/10">
                      <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white translate-x-0.5" />
                    </div>
                    <p className="text-gray-300 font-medium text-sm sm:text-base tracking-wide">What is Malasakit?</p>
                  </div>
                  {/* The actual video tag */}
                  <video className="w-full h-full object-cover relative z-10 opacity-0" controls>
                    <source src="" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>

            {/* CTA Buttons relocated under the video */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center w-full gap-4 relative z-10">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-care-blue bg-white rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-body flex-1 sm:flex-none"
              >
                Start Trial
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-trust-harbor border-2 border-white/20 rounded-xl hover:bg-trust-harbor/90 active:bg-trust-harbor/80 transition-all shadow-lg hover:shadow-xl font-body flex-1 sm:flex-none"
              >
                Watch Demo
              </Link>
              <Link
                to="/user-manual"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-trust-harbor border-2 border-white/20 rounded-xl hover:bg-trust-harbor/90 active:bg-trust-harbor/80 transition-all shadow-lg hover:shadow-xl font-body flex-1 sm:flex-none"
              >
                Learn How It Works
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ChevronRight, Search, PlayCircle } from 'lucide-react';

interface VideoGuide {
  id: string;
  title: string;
  tag: string;
  description: string;
  steps?: { title: string; description: string }[];
}

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const videoGuides: VideoGuide[] = [
  {
    id: 'guide-1',
    tag: 'Video Guide #1',
    title: 'Getting Started: Sign Up to Clinic Setup',
    description: 'Learn how to register your account, set up administrative credentials, and configure your clinic details.',
    steps: [
      { title: 'Signing Up', description: 'Register your new account on the platform and verify your credentials.' },
      { title: 'Creating Owner/Admin Account', description: 'Set up your administrative roles, security settings, and access control.' },
      { title: 'Clinic Setup', description: 'Configure your clinic details, establish services, and operational standards.' }
    ]
  },
  {
    id: 'guide-2',
    tag: 'Video Guide #2',
    title: 'Creating Appointments',
    description: 'Learn how to effortlessly schedule, manage, and track patient appointments using our intuitive calendar system. This guide covers adding new patients, setting appointment types, and managing clinic schedules.'
  }
];

export const DemoPage: React.FC = () => {
  const [activeVideoId, setActiveVideoId] = useState<string>(videoGuides[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeVideoId]);

  const activeVideoIndex = videoGuides.findIndex(v => v.id === activeVideoId);
  const activeVideo = videoGuides[activeVideoIndex];
  
  const nextVideo = activeVideoIndex < videoGuides.length - 1 ? videoGuides[activeVideoIndex + 1] : null;

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return videoGuides;
    const lowerQuery = searchQuery.toLowerCase();
    return videoGuides.filter(guide => 
      guide.title.toLowerCase().includes(lowerQuery) || 
      guide.description.toLowerCase().includes(lowerQuery) ||
      guide.tag.toLowerCase().includes(lowerQuery) ||
      (guide.steps && guide.steps.some(step => step.title.toLowerCase().includes(lowerQuery) || step.description.toLowerCase().includes(lowerQuery)))
    );
  }, [searchQuery]);

  const renderSidebarContent = () => (
    <div className="w-full h-full flex flex-col lg:p-6 lg:pt-8">
      {/* Search Bar */}
      <div className="mb-6 px-6 lg:px-0 mt-6 lg:mt-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-care-blue focus:border-care-blue sm:text-sm font-body transition-all"
            placeholder="Search video guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <h3 className="hidden lg:block text-lg font-bold text-trust-harbor mb-6 font-heading tracking-wide uppercase text-sm border-b border-gray-100 pb-3">
        Video Guides
      </h3>

      <div className="overflow-y-auto flex-1 custom-scrollbar px-6 lg:px-0 pb-6 lg:pb-20">
        {filteredGuides.length === 0 ? (
          <p className="text-gray-500 text-sm font-body text-center py-8">No video guides found matching your search.</p>
        ) : (
          <ul className="space-y-2">
            {filteredGuides.map((guide) => {
              const isActive = guide.id === activeVideoId;
              return (
                <li key={guide.id}>
                  <button
                    onClick={() => {
                      setActiveVideoId(guide.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left flex items-start p-3 rounded-xl transition-all font-body ${
                      isActive 
                        ? 'bg-blue-50 text-care-blue ring-1 ring-blue-100' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-trust-harbor'
                    }`}
                  >
                    <PlayCircle className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${isActive ? 'text-care-blue' : 'text-gray-400'}`} />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                        <HighlightText text={guide.tag} highlight={searchQuery} />
                      </div>
                      <div className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                        <HighlightText text={guide.title} highlight={searchQuery} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Desktop Sidebar (Fixed Left) */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[20rem] xl:w-[22rem] pt-28 bg-gray-50/30 border-r border-gray-100 z-40 flex-col">
        {renderSidebarContent()}
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-20 w-full px-4 sm:px-6 lg:pl-[22rem] xl:pl-[26rem] lg:pr-12 xl:pr-24">
        <div className="w-full max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-gray-100 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-trust-harbor font-heading mb-4">Demo Guides</h1>
            <p className="text-lg text-gray-600 font-body max-w-3xl mx-auto lg:mx-0">
              Discover how easy it is to manage your clinic. Follow our step-by-step video guides to get started and master the platform.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Mobile Sidebar Toggle & Content */}
            <div className="block lg:hidden w-full">
               <button 
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-trust-harbor font-heading"
                >
                  <span className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-care-blue" />
                    Browse Video Guides
                  </span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isMobileSidebarOpen ? 'rotate-90' : ''}`} />
                </button>
                {isMobileSidebarOpen && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden max-h-[60vh] flex flex-col shadow-sm">
                    {renderSidebarContent()}
                  </div>
                )}
            </div>

            {/* Content Area */}
            {activeVideo && (
              <div className="w-full min-h-[500px] animate-fade-in" key={activeVideo.id}>
                <div className="mb-6">
                  <div className="inline-block px-4 py-1.5 bg-blue-50 text-care-blue font-semibold rounded-full text-sm mb-4 border border-blue-100">
                    {activeVideo.tag}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-trust-harbor font-heading tracking-tight">
                    {activeVideo.title}
                  </h2>
                </div>
                
                {/* Video Player wrapper */}
                <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
                  <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group">
                    {/* Placeholder for Video */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white flex-col z-0">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm cursor-pointer">
                        <PlayCircle className="w-10 h-10 text-white translate-x-0.5" />
                      </div>
                      <p className="text-gray-400 font-medium">Video Guide Upload Placeholder</p>
                    </div>
                    <video className="w-full h-full object-cover relative z-10 opacity-0" controls>
                      <source src="" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  {/* Video Description & Steps */}
                  <div className="mt-8 px-2 sm:px-8 pb-4">
                    <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-8">
                      {activeVideo.description}
                    </p>

                    {activeVideo.steps && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center md:text-left">Step-by-Step Process</h3>
                        <div className="relative">
                          {/* Connecting Line (Desktop) */}
                          <div className="hidden md:block absolute top-[28px] left-[50px] right-[50px] h-1 bg-gray-100 z-0 rounded-full">
                            <div className="h-full bg-care-blue/20 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          
                          {/* Connecting Line (Mobile) */}
                          <div className="md:hidden absolute top-[50px] bottom-[50px] left-[28px] w-1 bg-gray-100 z-0 rounded-full">
                            <div className="w-full bg-care-blue/20 rounded-full" style={{ height: '100%' }}></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10">
                            {activeVideo.steps.map((step, idx) => (
                              <div key={idx} className="flex flex-row md:flex-col items-start md:items-center text-left md:text-center relative">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-0 md:mb-5 shadow-md shrink-0 mr-5 md:mr-0 z-10 ${
                                  idx === 0 ? 'bg-care-blue text-white border-4 border-white' : 'bg-white text-care-blue border-4 border-gray-200'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h4>
                                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Video Button */}
                {nextVideo && (
                  <div className="mt-12 flex justify-end">
                    <button
                      onClick={() => setActiveVideoId(nextVideo.id)}
                      className="group flex items-center gap-4 px-6 py-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-2xl transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Up Next</div>
                        <div className="text-sm font-semibold text-trust-harbor group-hover:text-care-blue">{nextVideo.title}</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-care-blue group-hover:border-care-blue group-hover:text-white transition-all">
                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
};

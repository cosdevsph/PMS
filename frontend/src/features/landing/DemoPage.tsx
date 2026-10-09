import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ChevronRight, Search, PlayCircle } from 'lucide-react';

interface VideoGuide {
  id: string;
  title: string;
  tag: string;
  description: string;
  videoUrl?: string;
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
    title: 'Setting Up Your Clinic',
    videoUrl: '/videos/guide-1-setup.mp4',
    description: 'Topics: Clinic Information, Upload clinic logo, Clinic name, Clinic address, Clinic phone number, Clinic email address, Website URL, Facebook page URL, Branch Setup, Creating branches, Branch name, Branch address, Branch phone number, Branch email address, Staff Setup, Creating staff accounts, Staff names, Staff email addresses, Mobile numbers, Branch assignment, Schedule Setup, Practitioner recurring availability, Break schedules.',
  },
  {
    id: 'guide-2',
    tag: 'Video Guide #2',
    title: 'Services, Pricing & Online Booking Setup',
    videoUrl: '/videos/guide-2-setup.mp4',
    description: 'Topics: Creating services, Service pricing, Appointment duration, Online booking settings, Online booking links, Booking QR codes, Website integration, Sharing booking links, Branch selection, Service selection.',
  },
  {
    id: 'guide-3',
    tag: 'Video Guide #3',
    title: 'SMS Gateway Setup',
    videoUrl: '/videos/guide-3-setup.mp4',
    description: 'Topics: Installing SMS Gateway App, Pairing mobile device, Testing SMS reminders, Troubleshooting connection issues.',
  },
  {
    id: 'guide-4',
    tag: 'Video Guide #4',
    title: 'Patient Management',
    videoUrl: '/videos/guide-4-setup.mp4',
    description: 'Topics: Patient registration, Patient profiles, Patient search, Edit patient details, Visit history, Managing patient records.',
  },
  {
    id: 'guide-5',
    tag: 'Video Guide #5',
    title: 'Appointment Scheduling & Calendar Management',
    videoUrl: '/videos/guide-5-setup.mp4',
    description: 'Topics: Creating appointments, Calendar navigation, Drag-and-drop calendar management, Rescheduling appointments, Cancelling appointments, Managing practitioner schedules.',
  },
  {
    id: 'guide-6',
    tag: 'Video Guide #6',
    title: 'Clinical Documentation & Templates',
    videoUrl: '/videos/guide-6-setup.mp4',
    description: 'Topics: Assessment notes, Progress notes, Treatment notes, Creating templates, Editing templates, Clinic-specific documentation workflows.',
  },
  {
    id: 'guide-7',
    tag: 'Video Guide #7',
    title: 'Patient Forms & Consent Forms',
    videoUrl: '/videos/guide-7-setup.mp4',
    description: 'Topics: Registration forms, Intake forms, Consent forms, Form customization, Form management.',
  },
  {
    id: 'guide-8',
    tag: 'Video Guide #8',
    title: 'Billing, Payments & Invoicing',
    videoUrl: '/videos/guide-8-setup.mp4',
    description: 'Topics: Creating invoices, Recording payments, Payment tracking, Outstanding balances, Invoice management.',
  },
  {
    id: 'guide-9',
    tag: 'Video Guide #9',
    title: 'Reports & Analytics',
    videoUrl: '/videos/guide-9-setup.mp4',
    description: 'Topics: Revenue reports, Occupancy reports, Business performance metrics, Clinic insights.',
  },
  {
    id: 'guide-10',
    tag: 'Help Article #10',
    title: 'Inventory Management',
    description: 'Topics: Inventory tracking, Stock management, Low stock alerts, Inventory reminders.',
  },
  {
    id: 'guide-11',
    tag: 'Help Article #11',
    title: 'User Management & Permissions',
    description: 'Topics: Staff accounts, User permissions, Access controls, Administrator accounts.',
  },
  {
    id: 'guide-12',
    tag: 'Help Article #12',
    title: 'Managing Documents & Attachments',
    description: 'Topics: Uploading files, Managing patient documents, Secure document storage.',
  },
  {
    id: 'guide-13',
    tag: 'Help Article #13',
    title: 'Multi-Branch Management & Reporting',
    description: 'Topics: Branch administration, Branch access, Clinician allocation, Branch-specific reports, Consolidated reporting, Business insights.',
  },
  {
    id: 'guide-14',
    tag: 'Help Article #14',
    title: 'Audit Logs',
    description: 'Topics: User activity tracking, Audit history, Accountability, Reviewing system activity.',
  },
  {
    id: 'guide-15',
    tag: 'Help Article #15',
    title: 'Security & Data Protection',
    description: 'Topics: HIPAA-aligned security practices, Role-based access controls, Data protection, Privacy features, Data backups, Security best practices.',
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
                  <h2 className="text-3xl md:text-4xl font-bold text-trust-harbor font-heading tracking-tight">
                    {activeVideo.title}
                  </h2>
                </div>
                
                {/* Video Player wrapper */}
                <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
                  <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group shadow-inner">
                    {activeVideo.videoUrl ? (
                      <video
                        key={activeVideo.videoUrl}
                        className="w-full h-full object-contain bg-black rounded-2xl relative z-10"
                        controls
                        playsInline
                        preload="metadata"
                      >
                        <source src={activeVideo.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      /* Placeholder when video is not yet uploaded */
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white flex-col z-0">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm cursor-pointer">
                          <PlayCircle className="w-10 h-10 text-white translate-x-0.5" />
                        </div>
                        <p className="text-gray-400 font-medium">
                          {activeVideo.tag.includes('Help Article') ? 'Written Article Coming Soon' : 'Video Guide Coming Soon'}
                        </p>
                        <span className="text-xs text-gray-500 mt-1">
                          {activeVideo.tag.includes('Help Article') ? 'Currently being drafted' : 'Recording in progress'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Description & Topics */}
                  <div className="mt-8 px-2 sm:px-8 pb-4">
                    {activeVideo.description.startsWith('Topics:') ? (
                      <div>
                        <h3 className="text-lg font-bold text-trust-harbor mb-4 font-heading">Topics Covered:</h3>
                        <div className="flex flex-wrap gap-2.5">
                          {activeVideo.description
                            .replace('Topics:', '')
                            .replace(/\.$/, '') // remove trailing dot if present
                            .split(',')
                            .map((topic, idx) => {
                              const t = topic.trim();
                              if (!t) return null;
                              
                              const topicColors = [
                                'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                                'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                                'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                                'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                                'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
                                'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
                                'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
                                'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100'
                              ];
                              const colorClass = topicColors[idx % topicColors.length];
                              
                              return (
                                <span key={idx} className={`px-3.5 py-2 rounded-md text-sm font-medium border shadow-sm transition-colors ${colorClass}`}>
                                  {t}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-8">
                        {activeVideo.description}
                      </p>
                    )}

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

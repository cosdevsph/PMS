import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ChevronRight, ChevronDown, Search, PlayCircle } from 'lucide-react';

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
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
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
  }
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-1';

// Brand-only tints for the topic chips (rotated across the list)
const topicColors = [
  'bg-care-blue/10 text-care-blue border-care-blue/20',
  'bg-trust-harbor/10 text-trust-harbor border-trust-harbor/20',
  'bg-gentle-renewal/40 text-trust-harbor border-gentle-renewal',
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

  const searchField = (idSuffix: string) => (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
      <input
        id={`demo-search-${idSuffix}`}
        type="search"
        aria-label="Search video guides"
        className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-clinical-cloud/60 text-sm font-body text-gray-900 placeholder-gray-500 transition-colors hover:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-care-blue/30 focus:border-care-blue"
        placeholder="Search video guides..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );

  const guideList = (scrollClasses: string) => (
    <nav aria-label="Video guides" className={`overflow-y-auto overscroll-contain ${scrollClasses}`}>
      {filteredGuides.length === 0 ? (
        <p role="status" className="text-gray-500 text-sm font-body text-center py-8">No video guides found matching your search.</p>
      ) : (
        <ul className="space-y-0.5">
          {filteredGuides.map((guide) => {
            const isActive = guide.id === activeVideoId;
            const number = videoGuides.findIndex(v => v.id === guide.id) + 1;
            return (
              <li key={guide.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveVideoId(guide.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group relative w-full text-left flex items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-sm font-body transition-colors ${focusRing} ${
                    isActive
                      ? 'bg-care-blue/10 text-trust-harbor font-semibold'
                      : 'text-gray-600 hover:bg-clinical-cloud hover:text-trust-harbor'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-care-blue" aria-hidden="true" />
                  )}
                  <span
                    className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-care-blue text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-trust-harbor'
                    }`}
                    aria-hidden="true"
                  >
                    {number}
                  </span>
                  <span className="leading-snug">
                    <HighlightText text={guide.title} highlight={searchQuery} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );

  const total = videoGuides.length;
  const progress = Math.round(((activeVideoIndex + 1) / total) * 100);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* pt-32 clears the fixed Navbar (24px offset + 80px bar) */}
      <main className="flex-1 pt-32 pb-20 w-full">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6">

          <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)] lg:gap-10 xl:gap-14 items-start">
            {/* Desktop sidebar column. The column only reserves the width; the sidebar itself is fixed below the
                Navbar (top-28 = 24px offset + 80px bar + 8px gap) and scrolls on its own, independent of the page.
                Left is left unset on purpose, so it stays aligned with this column at any screen width. */}
            <aside className="hidden lg:block" aria-label="Video guide navigation">
              <div className="fixed top-28 bottom-4 w-[18rem] xl:w-[20rem] flex flex-col">
              <div className="flex min-h-0 max-h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="px-6 pb-4 pt-5 border-b border-gray-100">
                  <p className="flex items-center gap-2 text-sm font-bold text-trust-harbor font-heading">
                    <PlayCircle className="h-4 w-4 text-care-blue" aria-hidden="true" />
                    Demo Guides
                  </p>
                  <h3 className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 font-body">
                    Video Guides
                  </h3>
                </div>
                <div className="px-4 pt-4">{searchField('desktop')}</div>
                {guideList('min-h-0 flex-1 px-3 pb-4 pt-3 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]')}
              </div>
              </div>
            </aside>

            <div className="min-w-0">
              {/* Header */}
              <div className="mb-10 pb-8 border-b border-gray-100 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-trust-harbor font-heading mb-4">Demo Guides</h1>
                <p className="text-lg md:text-xl text-gray-600 font-body max-w-3xl mx-auto lg:mx-0">
                  Discover how easy it is to manage your clinic. Follow our step-by-step video guides to get started and master the platform.
                </p>
              </div>

              <div className="max-w-5xl">
                {/* Mobile guide browser */}
                <div className="block lg:hidden w-full mb-10">
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                      aria-expanded={isMobileSidebarOpen}
                      aria-controls="demo-guides-mobile"
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left text-base font-semibold text-trust-harbor font-heading ${focusRing}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <PlayCircle className="h-5 w-5 text-care-blue" aria-hidden="true" />
                        Browse Video Guides
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 motion-reduce:transition-none ${isMobileSidebarOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div id="demo-guides-mobile" hidden={!isMobileSidebarOpen} className="border-t border-gray-100 pt-3">
                      <div className="px-4 pb-1">{searchField('mobile')}</div>
                      {guideList('max-h-[60vh] px-4 pb-5 pt-3')}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                {activeVideo && (
                  <div className="w-full min-h-[500px] animate-fade-in" key={activeVideo.id}>
                    <header className="mb-8">
                      <nav aria-label="Breadcrumb">
                        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 font-body">
                          <li>
                            <Link to="/" className={`rounded hover:text-care-blue ${focusRing}`}>Home</Link>
                          </li>
                          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></li>
                          <li>Demo Guides</li>
                          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></li>
                          <li aria-current="page" className="font-medium text-trust-harbor">Guide {activeVideoIndex + 1}</li>
                        </ol>
                      </nav>

                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-care-blue font-body">
                        {activeVideo.tag}
                      </p>
                      <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-trust-harbor font-heading tracking-tight leading-tight">
                        {activeVideo.title}
                      </h2>

                      <div className="mt-5 flex items-center gap-3 max-w-sm">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
                          role="progressbar"
                          aria-label="Position in the video guides"
                          aria-valuemin={1}
                          aria-valuemax={total}
                          aria-valuenow={activeVideoIndex + 1}
                        >
                          <div className="h-full rounded-full bg-primary-gradient" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="shrink-0 text-sm text-gray-500 font-body tabular-nums">
                          Video {activeVideoIndex + 1} of {total}
                        </span>
                      </div>
                    </header>

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
                            aria-label={activeVideo.title}
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

                                  const colorClass = topicColors[idx % topicColors.length];

                                  return (
                                    <span key={idx} className={`px-3.5 py-2 rounded-lg text-sm font-medium border font-body ${colorClass}`}>
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
                          type="button"
                          onClick={() => setActiveVideoId(nextVideo.id)}
                          className={`group flex items-center gap-4 px-6 py-4 bg-white hover:bg-care-blue/5 border border-gray-200 hover:border-care-blue rounded-2xl transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2`}
                        >
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Up Next</div>
                            <div className="text-sm font-semibold text-trust-harbor group-hover:text-care-blue">{nextVideo.title}</div>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-care-blue group-hover:border-care-blue group-hover:text-white transition-all">
                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white" aria-hidden="true" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

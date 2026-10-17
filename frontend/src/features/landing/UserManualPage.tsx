import React, { useEffect, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ManualSidebar } from './components/user-manual/ManualSidebar';
import { ManualSearch } from './components/user-manual/ManualSearch';
import { DocChapter } from './components/user-manual/DocChapter';
import { getChapterConfig } from './data/manual-registry';

export const UserManualPage: React.FC = () => {
  const location = useLocation();

  // The URL hash selects the chapter; default to chapter-1 when it is missing or unknown
  const hash = location.hash.replace('#', '');
  const activeChapterId = hash && getChapterConfig(hash) ? hash : 'chapter-1';

  useEffect(() => {
    if (!location.hash) {
      window.history.replaceState(null, '', '#chapter-1');
    }
  }, [location.hash]);

  // Ensure the page starts at the top when navigating between chapters
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeChapterId]);

  const activeConfig = getChapterConfig(activeChapterId);
  const ActiveComponent = activeConfig?.component;

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
            <aside className="hidden lg:block" aria-label="Chapter navigation">
              <div className="fixed top-28 bottom-4 w-[18rem] xl:w-[20rem]">
                <ManualSidebar activeChapterId={activeChapterId} variant="desktop" />
              </div>
            </aside>

            <div className="min-w-0">
              {/* Header */}
              <div className="mb-10 pb-8 border-b border-gray-100 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-trust-harbor font-heading mb-4">Documentation</h1>
                <p className="text-lg md:text-xl text-gray-600 font-body max-w-3xl mx-auto lg:mx-0">
                  Welcome to the official documentation for the Malasakit System. Here you will find step-by-step guides on how to use and navigate the platform.
                </p>
              </div>

              <div className="max-w-5xl">
                {/* Search */}
                <ManualSearch />

                {/* Mobile table of contents */}
                <div className="block lg:hidden w-full mb-10">
                  <ManualSidebar activeChapterId={activeChapterId} variant="mobile" />
                </div>

                {/* Content Area */}
                <div className="w-full min-h-[500px]">
                  <Suspense fallback={
                    <div className="animate-pulse space-y-8">
                      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="space-y-4 mt-8">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      </div>
                    </div>
                  }>
                    {ActiveComponent && (
                      <DocChapter id={activeChapterId}>
                        <ActiveComponent />
                      </DocChapter>
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

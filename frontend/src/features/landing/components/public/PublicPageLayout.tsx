import React, { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export interface PublicPageLayoutProps {
  /** Page name used for the browser tab title ("{title} · Malasakit"). */
  title: string;
  children: React.ReactNode;
}

/** Shared shell for the public footer pages: Navbar, main landmark, Footer. */
export const PublicPageLayout: React.FC<PublicPageLayoutProps> = ({ title, children }) => {
  const { hash } = useLocation();

  // Start each page at the top (footer links are clicked from the bottom of the previous page)
  useLayoutEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · Malasakit`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-trust-harbor focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-care-blue"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicPageLayout;

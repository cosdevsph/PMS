import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { getAdjacentChapters, getChapterConfig, manualRegistry } from '../../data/manual-registry';

interface DocChapterProps {
  id: string;
  children: React.ReactNode;
}

export const DocChapter: React.FC<DocChapterProps> = ({ id, children }) => {
  const config = getChapterConfig(id);
  const { prev, next } = getAdjacentChapters(id);

  if (!config) return null;

  const total = manualRegistry.length;
  const progress = Math.round((config.chapterNumber / total) * 100);

  return (
    <div className="w-full">
      {/* Chapter Header */}
      <header className="mb-10 pb-8 border-b border-gray-100">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 font-body">
            <li>
              <Link to="/" className="rounded hover:text-care-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue">
                Home
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></li>
            <li>User Manual</li>
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></li>
            <li aria-current="page" className="font-medium text-trust-harbor">Chapter {config.chapterNumber}</li>
          </ol>
        </nav>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-care-blue font-body">
          {config.partTitle}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-trust-harbor font-heading leading-tight">
          Chapter {config.chapterNumber}: {config.title}
        </h2>

        <div className="mt-5 flex items-center gap-3 max-w-sm">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label="Position in the manual"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={config.chapterNumber}
          >
            <div className="h-full rounded-full bg-primary-gradient" style={{ width: `${progress}%` }} />
          </div>
          <span className="shrink-0 text-sm text-gray-500 font-body tabular-nums">
            Chapter {config.chapterNumber} of {total}
          </span>
        </div>
      </header>

      {/* Chapter Content */}
      <div className="space-y-8">
        {children}
      </div>

      {/* Chapter Navigation */}
      <nav aria-label="Chapter navigation" className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
        {prev ? (
          <a
            href={`#${prev.id}`}
            className="flex-1 flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-white hover:border-care-blue hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
          >
            <span className="text-sm text-gray-500 font-body mb-1 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 motion-reduce:transform-none transition-transform" aria-hidden="true" />
              Previous Chapter
            </span>
            <span className="font-semibold text-trust-harbor group-hover:text-care-blue font-display">
              {prev.title}
            </span>
          </a>
        ) : <div className="flex-1" />}

        {next ? (
          <a
            href={`#${next.id}`}
            className="flex-1 flex flex-col items-end p-4 rounded-xl border border-gray-200 bg-white hover:border-care-blue hover:shadow-md transition-all group text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
          >
            <span className="text-sm text-gray-500 font-body mb-1 flex items-center justify-end w-full">
              Next Chapter
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 motion-reduce:transform-none transition-transform" aria-hidden="true" />
            </span>
            <span className="font-semibold text-trust-harbor group-hover:text-care-blue font-display">
              {next.title}
            </span>
          </a>
        ) : <div className="flex-1" />}
      </nav>
    </div>
  );
};

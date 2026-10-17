import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { manualRegistry } from '../../data/manual-registry';

export const ManualSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const results = useMemo(() => {
    if (!trimmed) return [];
    const lowerQuery = query.toLowerCase();
    return manualRegistry.filter((ch) =>
      ch.title.toLowerCase().includes(lowerQuery) ||
      ch.searchIndex.toLowerCase().includes(lowerQuery)
    );
  }, [query, trimmed]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showResults = isOpen && trimmed.length > 0;

  return (
    <div className="relative w-full mb-8" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          aria-label="Search the User Manual"
          placeholder="Search the User Manual..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-clinical-cloud/60 text-base font-body text-gray-900 placeholder-gray-500 transition-colors hover:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-care-blue/30 focus:border-care-blue"
        />
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 max-h-96 overflow-y-auto">
          {results.map((ch) => (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="flex items-center justify-between p-4 hover:bg-clinical-cloud focus-visible:bg-clinical-cloud focus-visible:outline-none border-b border-gray-50 last:border-0 transition-colors group"
            >
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-body mb-1 block">
                  {ch.partTitle}
                </span>
                <span className="text-sm font-semibold text-trust-harbor font-display group-hover:text-care-blue transition-colors">
                  Chapter {ch.chapterNumber}: {ch.title}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-care-blue transition-colors" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-8 text-center z-30" role="status">
          <p className="text-gray-500 font-body">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

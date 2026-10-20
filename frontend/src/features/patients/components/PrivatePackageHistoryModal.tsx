import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, History } from 'lucide-react';
import { format } from 'date-fns';
import { getPrivatePackageHistory, privatePackageErrorMessage } from '../privatePackages.api';
import type { PrivatePackage } from '../privatePackages.api';
import { describeHistoryEntry } from '../privatePackageHistory';

interface PrivatePackageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PrivatePackage | null;
}

export const PrivatePackageHistoryModal: React.FC<PrivatePackageHistoryModalProps> = ({ isOpen, onClose, pkg }) => {
  const { data: entries = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['private-package-history', pkg?.id, pkg?.updated_at],
    queryFn: () => getPrivatePackageHistory(pkg!.id),
    enabled: isOpen && !!pkg,
  });
  const error = queryError ? privatePackageErrorMessage(queryError, 'Failed to load the edit history.') : null;

  if (!isOpen || !pkg) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-sky-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">Edit History</h3>
                <p className="text-xs text-gray-500 truncate">{pkg.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 px-6 py-3 border-b border-gray-100 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Created by</div>
              <div className="font-medium text-gray-900">{pkg.created_by_name || '—'}</div>
              <div className="text-xs text-gray-500">{format(new Date(pkg.created_at), 'MMM d, yyyy h:mm a')}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Modified by</div>
              <div className="font-medium text-gray-900">{pkg.modified_by_name || '—'}</div>
              <div className="text-xs text-gray-500">{format(new Date(pkg.updated_at), 'MMM d, yyyy h:mm a')}</div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            {loading && <p className="text-sm text-gray-500">Loading history…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && entries.length === 0 && <p className="text-sm text-gray-500">No history recorded.</p>}

            <ol className="space-y-4">
              {entries.map((entry) => {
                const lines = describeHistoryEntry(entry);
                return (
                  <li key={entry.id} className="border-l-2 border-sky-200 pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{entry.action_display}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')} · {entry.user_name || 'Unknown user'}
                      </span>
                    </div>
                    {lines.map((line, i) => (
                      <p key={i} className="text-sm text-gray-600 mt-0.5">
                        {line}
                      </p>
                    ))}
                    {entry.reason && <p className="text-xs text-gray-500 mt-1 italic">Reason: {entry.reason}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

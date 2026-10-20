import React, { useMemo, useState } from 'react';
import { Package, Plus, Search, Pencil, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';
import { usePatientProfileContext } from '../context/PatientProfileContext';
import { PrivatePackageModal } from '../components/PrivatePackageModal';
import { PrivatePackageHistoryModal } from '../components/PrivatePackageHistoryModal';
import { canManagePrivatePackages, getPrivatePackages } from '../privatePackages.api';
import type { PrivatePackage, PrivatePackageStatus } from '../privatePackages.api';

const STATUS_LABEL: Record<PrivatePackageStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<PrivatePackageStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const peso = (value: string | number | null | undefined) =>
  `₱${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentLabel = (pkg: PrivatePackage): { text: string; style: string } => {
  if (!pkg.invoice) return { text: 'No invoice', style: 'text-gray-500' };
  const balance = Number(pkg.invoice_balance_due ?? 0);
  const paid = Number(pkg.invoice_amount_paid ?? 0);
  if (balance <= 0 && Number(pkg.invoice_total ?? 0) > 0) return { text: 'Paid', style: 'text-emerald-700' };
  if (paid > 0) return { text: `Partial · ${peso(balance)} due`, style: 'text-amber-700' };
  return { text: `Unpaid · ${peso(balance)} due`, style: 'text-red-700' };
};

export const PatientPrivatePackagesPage: React.FC = () => {
  const { patientId, patient, cases, refreshCases } = usePatientProfileContext();
  const { user } = useAuthStore();
  const canManage = canManagePrivatePackages(user);

  const [filter, setFilter] = useState<'ALL' | PrivatePackageStatus>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [toEdit, setToEdit] = useState<PrivatePackage | null>(null);
  const [historyFor, setHistoryFor] = useState<PrivatePackage | null>(null);

  const { data: packages = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['private-packages', patientId],
    queryFn: () => getPrivatePackages(patientId),
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((p) => {
      if (filter !== 'ALL' && p.status !== filter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.items.some((i) => i.service_name.toLowerCase().includes(q));
    });
  }, [packages, filter, search]);

  const handleSaved = () => {
    refetch();
    refreshCases(); // the modal may have created a Case
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-heading text-gray-900">Private Package Sessions</h1>
              <p className="text-sm text-gray-500 mt-1">
                {patient?.full_name || 'Patient'} • {packages.length} package{packages.length === 1 ? '' : 's'}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Private Package Session
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
              {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filter === s ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search packages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">Loading packages…</div>
        ) : isError ? (
          <div className="bg-white border border-red-200 rounded-2xl p-12 text-center text-sm text-red-600">
            Failed to load the packages.{' '}
            <button onClick={() => refetch()} className="underline">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Private Package Sessions found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {search || filter !== 'ALL'
                ? 'Try adjusting your filters or search.'
                : 'Packages agreed with this patient onsite will appear here.'}
            </p>
            {canManage && !search && filter === 'ALL' && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 text-sm font-medium rounded-xl hover:bg-sky-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add the first package
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Package</th>
                  <th className="text-left font-semibold px-4 py-3">Services</th>
                  <th className="text-left font-semibold px-4 py-3">Sessions</th>
                  <th className="text-left font-semibold px-4 py-3">Price / Payment</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Created / Modified by</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((pkg) => {
                  const pay = paymentLabel(pkg);
                  const pct = pkg.total_sessions ? Math.min(100, (pkg.used_sessions / pkg.total_sessions) * 100) : 0;
                  return (
                    <tr key={pkg.id} className="align-top hover:bg-gray-50/60">
                      <td className="px-4 py-3 max-w-[14rem]">
                        <div className="font-semibold text-gray-900">{pkg.title}</div>
                        {pkg.notes && <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{pkg.notes}</div>}
                        <div className="text-xs text-gray-400 mt-0.5">{format(new Date(pkg.created_at), 'MMM d, yyyy')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {pkg.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 text-gray-700">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.service_color || '#0D9488' }} />
                              <span>{item.service_name}</span>
                              <span className="text-xs text-gray-500">
                                {item.used}/{item.quantity} used
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 w-40">
                        <div className="font-semibold text-gray-900">{pkg.remaining_sessions} remaining</div>
                        <div className="text-xs text-gray-500">
                          {pkg.used_sessions} of {pkg.total_sessions} used
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${pkg.remaining_sessions <= 0 ? 'bg-red-500' : pkg.remaining_sessions <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{peso(pkg.price)}</div>
                        <div className={`text-xs font-medium ${pay.style}`}>{pay.text}</div>
                        {pkg.invoice_number && <div className="text-xs text-gray-400">{pkg.invoice_number}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[pkg.status]}`}>
                          {STATUS_LABEL[pkg.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div>Created: {pkg.created_by_name || '—'}</div>
                        <div>Modified: {pkg.modified_by_name || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {canManage && (
                            <button
                              onClick={() => setToEdit(pkg)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => setHistoryFor(pkg)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 font-medium rounded-lg hover:bg-sky-100 transition-colors border border-sky-200"
                          >
                            <History className="w-3.5 h-3.5" />
                            Edit History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PrivatePackageModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        mode="create"
        patientId={patientId}
        cases={cases}
        onSaved={handleSaved}
      />
      <PrivatePackageModal
        isOpen={!!toEdit}
        onClose={() => setToEdit(null)}
        mode="edit"
        patientId={patientId}
        cases={cases}
        pkg={toEdit}
        onSaved={handleSaved}
      />
      <PrivatePackageHistoryModal isOpen={!!historyFor} onClose={() => setHistoryFor(null)} pkg={historyFor} />
    </>
  );
};

export default PatientPrivatePackagesPage;

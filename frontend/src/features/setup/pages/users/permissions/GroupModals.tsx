import React, { useState } from 'react';
import { AlertTriangle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import type { PermissionGroup, RoleTemplate } from '../../../services/PermissionGroupService';
import { TEMPLATE_OPTIONS } from './meta';

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    {children}
  </div>
);

export const CreateGroupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, template: RoleTemplate, description: string) => Promise<void>;
  /** Templates the viewer may start from (a Branch Manager: Frontdesk, Practitioner, Finance). Default: all. */
  allowedTemplates?: RoleTemplate[];
}> = ({ isOpen, onClose, onCreate, allowedTemplates }) => {
  const options = allowedTemplates ? TEMPLATE_OPTIONS.filter((o) => allowedTemplates.includes(o.value)) : TEMPLATE_OPTIONS;
  const defaultTemplate: RoleTemplate = options.find((o) => o.value === 'CUSTOM')?.value ?? options[0]?.value ?? 'CUSTOM';
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<RoleTemplate>(defaultTemplate);
  const [description, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      await onCreate(name.trim(), template, description.trim());
      setName(''); setTemplate(defaultTemplate); setDesc('');
      onClose();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { detail?: string; name?: string[]; clinic?: string[] } } };
      setError(ex?.response?.data?.detail || ex?.response?.data?.name?.[0] || ex?.response?.data?.clinic?.[0] || 'Failed to create group.');
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <Backdrop onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="new-group-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 id="new-group-title" className="text-base font-bold text-gray-900">New permission group</h2>
            <p className="text-xs text-gray-400">Start from a template, then fine-tune every feature.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="pg-name" className="block text-xs font-semibold text-gray-600 mb-1.5">Group name <span className="text-rose-500">*</span></label>
            <input id="pg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Receptionist" autoFocus
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="pg-template" className="block text-xs font-semibold text-gray-600 mb-1.5">Starting template</label>
            <select id="pg-template" value={template} onChange={(e) => setTemplate(e.target.value as RoleTemplate)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent">
              {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">Sets the initial access levels. You can change them after creating the group.</p>
          </div>
          <div>
            <label htmlFor="pg-desc" className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea id="pg-desc" value={description} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Optional"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none" />
          </div>
          {error && (
            <div role="alert" className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
};

export const DeleteConfirmModal: React.FC<{
  group: PermissionGroup | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}> = ({ group, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => { setDeleting(true); try { await onConfirm(); } finally { setDeleting(false); } };

  if (!group) return null;
  return (
    <Backdrop onClose={onClose}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="del-group-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 id="del-group-title" className="text-base font-bold text-gray-900">Delete permission group?</h3>
          <p className="text-sm text-gray-500">
            <strong className="text-gray-800">{group.name}</strong> has <strong>{group.member_count}</strong> member{group.member_count !== 1 ? 's' : ''}.
            They will be left without a group.
          </p>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

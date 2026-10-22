import React from 'react';
import { Lock, Plus, Users } from 'lucide-react';
import type { PermissionGroup } from '../../../services/PermissionGroupService';
import { TEMPLATE_LABELS, TEMPLATE_STYLES, summarize } from './meta';

interface Props {
  groups: PermissionGroup[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  canCreate: boolean;
  onCreate: () => void;
  /** Groups the viewer can look at but not change (shown with a lock). */
  isLocked?: (group: PermissionGroup) => boolean;
}

/** Stacked bar of how much access a group has: edit / view / none. */
const AccessBar: React.FC<{ group: PermissionGroup }> = ({ group }) => {
  const c = summarize(group.permissions_map ?? {});
  const total = Math.max(c.edit + c.view + c.none, 1);
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100" aria-hidden="true">
      <div className="bg-emerald-500" style={{ width: `${(c.edit / total) * 100}%` }} />
      <div className="bg-sky-400" style={{ width: `${(c.view / total) * 100}%` }} />
    </div>
  );
};

export const GroupSidebar: React.FC<Props> = ({ groups, selectedId, onSelect, canCreate, onCreate, isLocked }) => (
  <nav aria-label="Permission groups" className="lg:sticky lg:top-4 space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Groups ({groups.length})</h2>
      {canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> New group
        </button>
      )}
    </div>

    <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
      {groups.map((group) => {
        const style = TEMPLATE_STYLES[group.role_template] ?? TEMPLATE_STYLES.CUSTOM;
        const Icon = style.icon;
        const selected = group.id === selectedId;
        return (
          <li key={group.id} className="shrink-0 w-64 lg:w-auto">
            <button
              type="button"
              onClick={() => onSelect(group.id)}
              aria-current={selected ? 'true' : undefined}
              className={`w-full text-left rounded-2xl border p-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                selected
                  ? `bg-white border-transparent shadow-md ring-2 ${style.ring}`
                  : 'bg-white/70 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                  <Icon className={`w-4 h-4 ${style.iconColor}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    <span className="truncate">{group.name}</span>
                    {isLocked?.(group) && (
                      <Lock className="w-3 h-3 text-gray-400 shrink-0" aria-label="Only the Owner can change this group" />
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className={`px-1.5 py-px rounded-full border text-[10px] font-semibold ${style.badge}`}>
                      {TEMPLATE_LABELS[group.role_template] ?? group.role_template}
                    </span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" aria-hidden="true" />{group.member_count}</span>
                  </p>
                </div>
              </div>
              <div className="mt-3"><AccessBar group={group} /></div>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

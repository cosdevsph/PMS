import React, { useEffect, useMemo, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import { CustomTableHeader } from './CustomTableHeader';
import { CustomTableCell } from './CustomTableCell';
import { TrailingNode } from './TrailingNode';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { MergeField } from './MergeField';
import { CustomOrderedList } from './CustomOrderedList';
import { CustomBulletList } from './CustomBulletList';
import { Indent } from './Indent';
import { FontSize } from './FontSize';
import { CustomShortcuts } from './CustomShortcuts';
import type { LetterTemplate } from '@/features/clinical-documentation/api/letterTemplates.api';
import { getLetterhead } from '@/features/clinical-documentation/api/letterTemplates.api';
import type { ClinicProfile } from '@/features/clinical-documentation/api/letters.api';

import { LetterTemplateHeader } from './LetterTemplateHeader';
import { LetterDocumentEditor } from './LetterDocumentEditor';
import { LetterDocumentLayoutPanel } from './LetterDocumentLayoutPanel';

interface LetterTemplateEditorProps {
  template: LetterTemplate | null;
  onSave: (data: Partial<LetterTemplate>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export const LetterTemplateEditor: React.FC<LetterTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  saving,
}) => {
  const [name, setName] = useState(template?.name || '');
  const [discipline, setDiscipline] = useState(template?.discipline || '');
  const [clinicBranch, setClinicBranch] = useState<number | null>(template?.clinic_branch ?? null);
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [category, setCategory] = useState(template?.category || 'GENERAL');
  const [description, setDescription] = useState(template?.description || '');
  const [showNameError, setShowNameError] = useState(false);
  const [bodyHtml, setBodyHtml] = useState(template?.content_html || '');
  // The body as the editor first normalised it: the baseline for "unsaved changes".
  const [baselineBody, setBaselineBody] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClinicProfile | null>(null);

  // Layout Controls
  const [layoutLetterHead, setLayoutLetterHead] = useState(template?.layout_letter_head ?? true);
  const [layoutRemoveTopSpace, setLayoutRemoveTopSpace] = useState(template?.layout_remove_top_space ?? false);
  const [layoutDate, setLayoutDate] = useState(template?.layout_date ?? true);
  const [layoutAddressee, setLayoutAddressee] = useState(template?.layout_addressee ?? true);

  const editorConfig = {
    extensions: [
      StarterKit.configure({
        orderedList: false,
        bulletList: false,
      }),
      CustomOrderedList,
      CustomBulletList,
      Indent,
      Table.configure({ resizable: true }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      TrailingNode,
      Image.configure({ inline: true, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      FontSize,
      Underline,
      MergeField,
      CustomShortcuts,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px]',
      },
    },
  };

  const bodyEditor = useEditor({
    ...editorConfig,
    content: template?.content_html || '',
    extensions: [...editorConfig.extensions, Placeholder.configure({ placeholder: 'Write your letter body here...' })],
    onCreate: ({ editor }) => {
      setBaselineBody(editor.getHTML());
      setBodyHtml(editor.getHTML());
    },
    onUpdate: ({ editor }) => setBodyHtml(editor.getHTML()),
  });

  // The page shows the real letterhead of the chosen location (or your own clinic).
  useEffect(() => {
    let cancelled = false;
    getLetterhead(clinicBranch).then((p) => { if (!cancelled) setProfile(p); }).catch(() => { if (!cancelled) setProfile(null); });
    return () => { cancelled = true; };
  }, [clinicBranch]);

  const initial = useMemo(() => ({
    name: template?.name || '',
    category: template?.category || 'GENERAL',
    description: template?.description || '',
    discipline: template?.discipline || '',
    clinicBranch: template?.clinic_branch ?? null,
    isActive: template?.is_active ?? true,
    letterHead: template?.layout_letter_head ?? true,
    removeTopSpace: template?.layout_remove_top_space ?? false,
    date: template?.layout_date ?? true,
    addressee: template?.layout_addressee ?? true,
  }), [template]);

  // Anything that differs from what is saved (for a new template: from an empty one).
  const dirty =
    name !== initial.name || category !== initial.category || description !== initial.description ||
    discipline !== initial.discipline || clinicBranch !== initial.clinicBranch || isActive !== initial.isActive ||
    layoutLetterHead !== initial.letterHead || layoutRemoveTopSpace !== initial.removeTopSpace ||
    layoutDate !== initial.date || layoutAddressee !== initial.addressee ||
    (baselineBody !== null && bodyHtml !== baselineBody);

  // Closing the tab or reloading with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleSave = async () => {
    if (!name.trim()) {
      setShowNameError(true);
      return;
    }

    await onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      discipline: discipline.trim(),
      clinic_branch: clinicBranch,
      layout_letter_head: layoutLetterHead,
      layout_remove_top_space: layoutRemoveTopSpace,
      layout_date: layoutDate,
      layout_addressee: layoutAddressee,
      is_active: isActive,
      header_html: '',
      content_html: bodyEditor?.getHTML() || '',
      footer_html: '',
    });
  };

  const handleCancel = () => {
    if (dirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-100 min-h-0 overflow-hidden">
      
      {/* STICKY HEADER & TOOLBAR TO PREVENT SCROLL OFF */}
      <div className="sticky top-0 z-30 flex flex-col shadow-sm">
        {/* 1. FIXED HEADER */}
        <LetterTemplateHeader
          template={template}
          name={name}
          setName={setName}
          discipline={discipline}
          setDiscipline={setDiscipline}
          clinicBranch={clinicBranch}
          setClinicBranch={setClinicBranch}
          isActive={isActive}
          setIsActive={setIsActive}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          dirty={dirty}
          showNameError={showNameError && !name.trim()}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* 2. FIXED TOOLBAR */}
        <div className="bg-white border-b border-gray-200">
          <EditorToolbar editor={bodyEditor} />
        </div>
      </div>

      {/* 3. WORKSPACE (Document & Panel) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ONLY THIS REGION SCROLLS */}
        <LetterDocumentEditor
          bodyEditor={bodyEditor}
          profile={profile}
          layoutLetterHead={layoutLetterHead}
          layoutRemoveTopSpace={layoutRemoveTopSpace}
          layoutDate={layoutDate}
          layoutAddressee={layoutAddressee}
        />

        {/* FIXED RIGHT PANEL */}
        <LetterDocumentLayoutPanel
          layoutLetterHead={layoutLetterHead}
          setLayoutLetterHead={setLayoutLetterHead}
          layoutRemoveTopSpace={layoutRemoveTopSpace}
          setLayoutRemoveTopSpace={setLayoutRemoveTopSpace}
          layoutDate={layoutDate}
          setLayoutDate={setLayoutDate}
          layoutAddressee={layoutAddressee}
          setLayoutAddressee={setLayoutAddressee}
        />
        
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

interface Props {
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onEnter: (password: string) => void;
}

/** Asks the person recording the result to confirm with their own password. */
export const PasswordConfirmDialog: React.FC<Props> = ({ busy, error, onBack, onEnter }) => {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onBack(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onBack]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <form
        onSubmit={(e) => { e.preventDefault(); if (password && !busy) onEnter(password); }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center"><Lock className="w-5 h-5" /></span>
          <h2 id="pw-title" className="text-lg font-bold text-slate-900">Enter your password</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Confirm it is you recording this result. It is saved to the patient's record once your password is accepted.</p>
        <input
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
          aria-invalid={!!error}
          disabled={busy}
          className={`w-full h-11 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${error ? 'border-rose-400' : 'border-slate-300'}`}
        />
        {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onBack} disabled={busy} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Back</button>
          <button type="submit" disabled={!password || busy} className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Enter
          </button>
        </div>
      </form>
    </div>
  );
};

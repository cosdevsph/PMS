import React from 'react';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  helpText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label, value, onChange, error, required, disabled, placeholder, rows = 4, helpText,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500 resize-y whitespace-pre-wrap ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}
    />
    {helpText && <p className="text-xs text-gray-400 mt-1 italic">{helpText}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);
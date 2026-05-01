import React from 'react';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label, value, onChange, error, required, disabled, placeholder, helpText,
}) => {
  const isMultiLine = typeof value === 'string' && value.includes('\n');
  const baseClass = `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500 ${
    error ? 'border-red-400' : 'border-gray-300'
  }`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {isMultiLine ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={Math.min(value.split('\n').length + 1, 8)}
          className={`${baseClass} resize-y whitespace-pre-wrap`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
      {helpText && <p className="text-xs text-gray-400 mt-1 italic">{helpText}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
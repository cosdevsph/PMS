import React from 'react';

interface CheckboxInputProps {
  label: string;
  value: boolean | string;
  onChange: (value: boolean) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  label, value, onChange, error, required, disabled, helpText,
}) => (
  <div>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
      />
      <span className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
    {helpText && <p className="text-xs text-gray-400 mt-1 ml-6 italic">{helpText}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);
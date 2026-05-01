import React from 'react';

interface NumberInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  helpText?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label, value, onChange, error, required, disabled, placeholder, min, max, helpText,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      max={max}
      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500 ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}
    />
    {helpText && <p className="text-xs text-gray-400 mt-1 italic">{helpText}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);
import React, { useRef, useEffect } from 'react';

// --- Eigene Feld-Komponenten für einheitliches Design ---

interface InputFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function InputField({ label, icon, id, value, onChange, type = "text", required, autoFocus }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 py-4 px-7 min-h-[48px] text-lg focus:outline-none focus:border-[#ff9900] focus:border-2 border-2"
      />
    </div>
  );
}

interface TextareaFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  id: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
}

export function TextareaField({ label, icon, id, value, onChange, maxLength, placeholder }: TextareaFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + 'px';
    }
  }, [value]);
  return (
    <div className="flex flex-col gap-1 w-full px-3 py-0 text-sm">
      <label htmlFor={id} className="block font-medium text-[#460b6c] text-lg flex items-center gap-2">
        {icon}
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={e => {
          if (e.target.value.length <= maxLength) onChange(e.target.value);
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 min-h-[48px] resize-none max-h-40 focus:outline-none focus:border-[#ff9900] focus:border-2 border-2 px-3 py-2 text-sm"
      />
      <div className="text-right text-xs text-gray-500">{value.length}/{maxLength} Zeichen</div>
    </div>
  );
}

interface CheckboxFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}

export function CheckboxField({ label, icon, checked, onChange, id }: CheckboxFieldProps) {
  return (
    <div className="flex flex-col w-full items-center gap-2">
      {/* Card-Style für Checkbox */}
      <div
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border transition-all cursor-pointer select-none
          ${checked ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
        style={{ minWidth: 120, maxWidth: 320 }}
        onClick={() => onChange(!checked)}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="accent-[#ff9900] w-5 h-5"
        />
        {icon && <span className="inline-block align-middle">{icon}</span>}
        <span className="text-lg font-medium">{label}</span>
      </div>
    </div>
  );
}

interface RadioGroupFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: string;
  options: { value: string; label: React.ReactNode; icon?: React.ReactNode; conditionalContent?: React.ReactNode }[];
  onChange: (v: string) => void;
  id: string;
}

export function RadioGroupField({ label, icon, value, options, onChange, id }: RadioGroupFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full items-center">
      <label className="block font-medium text-[#460b6c] text-lg w-full text-center flex items-center justify-center gap-2">
        {icon}
        {label}
      </label>
      <div className="w-full flex flex-col gap-2 justify-center pb-2">
        {options.map(opt => (
          <div key={opt.value} className="w-full">
            <label
              className={`flex flex-col items-center gap-1 cursor-pointer select-none text-base px-2 py-1.5 rounded-lg border transition-all
                ${value === opt.value ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="sr-only"
                />
                {opt.icon && <span className="text-[#ff9900]">{opt.icon}</span>}
                <span className="text-center break-words">{opt.label}</span>
              </div>
            </label>
            {opt.conditionalContent && value === opt.value && (
              <div className="mt-2">
                {opt.conditionalContent}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Wrapper für jeden Step
export function FormStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col justify-center gap-4 px-2">
      {children}
    </div>
  );
} 
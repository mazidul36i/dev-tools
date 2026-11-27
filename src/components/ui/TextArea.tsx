import { type TextareaHTMLAttributes } from 'react';

interface TextAreaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

export function TextAreaInput({ id, value, onChange, placeholder, className = '', ...props }: TextAreaInputProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 bg-surface-alt border border-border-strong rounded-md font-mono text-[13px] leading-relaxed text-text min-h-40 resize-y
        placeholder:text-text-muted
        focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
        transition-colors ${className}`}
      {...props}
    />
  );
}

interface TextAreaOutputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  className?: string;
}

export function TextAreaOutput({ value, className = '', ...props }: TextAreaOutputProps) {
  return (
    <textarea
      value={value}
      readOnly
      className={`w-full p-3 bg-surface-alt border border-border rounded-md font-mono text-[13px] leading-relaxed text-text min-h-35 resize-y cursor-text
        focus:outline-none focus:border-border-strong ${className}`}
      {...props}
    />
  );
}

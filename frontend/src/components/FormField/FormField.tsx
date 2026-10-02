import type { ReactNode } from 'react';

interface Props {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode; // the <input> or <select>
}

export default function FormField({ label, error, hint, children }: Props) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
    </label>
  );
}
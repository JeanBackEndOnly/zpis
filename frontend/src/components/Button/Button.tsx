import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
}

const variants = {
  primary: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/30',
  secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-300/50',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/30',
  success: 'bg-green-600 text-white shadow-sm hover:bg-green-700 focus-visible:ring-green-500/30',
};

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
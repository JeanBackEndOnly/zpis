import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: 'md' | 'lg';
  children: ReactNode;
}

const widths = { md: 'max-w-md', lg: 'max-w-2xl' };

export default function Modal({ open, title, onClose, size = 'md', children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${widths[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
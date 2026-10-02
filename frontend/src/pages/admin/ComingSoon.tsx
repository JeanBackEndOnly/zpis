import { Construction } from 'lucide-react';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Construction className="h-6 w-6" />
        </div>
        <p className="font-medium">Coming soon</p>
        <p className="mt-1 text-sm text-gray-500">This module has not been built yet.</p>
      </div>
    </div>
  );
}
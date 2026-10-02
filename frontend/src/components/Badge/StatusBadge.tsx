const colors: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 ring-green-600/20',
  Deactivated: 'bg-red-50 text-red-700 ring-red-600/20',
  Inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        colors[status] ?? colors.Inactive
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
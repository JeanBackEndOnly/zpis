import { Briefcase, Building2, Network, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { departmentService } from '../../services/admin/departmentService';
import { positionService } from '../../services/admin/positionService';
import { unitSectionService } from '../../services/admin/unitSectionService';

const cards: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Unit sections', to: '/admin/unit-sections', icon: Network },
  { label: 'Positions', to: '/admin/positions', icon: Briefcase },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<number[] | null>(null);

  useEffect(() => {
    Promise.all([
      departmentService.list({ per_page: 1 }),
      unitSectionService.list({ per_page: 1 }),
      positionService.list({ per_page: 1 }),
    ])
      .then((results) => setCounts(results.map((r) => r.data.total)))
      .catch(() => setCounts(null));
  }, []);

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-red-600 p-6 text-white">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-red-100">Welcome back, {user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-semibold">{counts?.[i] ?? '—'}</p>
            <p className="mt-1 text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
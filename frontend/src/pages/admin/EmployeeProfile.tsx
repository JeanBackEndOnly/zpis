import { ArrowLeft, Briefcase, CalendarDays, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmploymentTab from '../../components/admin/profile/EmploymentTab';
import LeaveTab from '../../components/admin/profile/LeaveTab';
import PersonalTab from '../../components/admin/profile/PersonalTab';
import ProfileCard from '../../components/admin/profile/ProfileCard';
import Tabs, { type TabItem } from '../../components/Tabs/Tabs';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { employeeProfileService } from '../../services/admin/employeeProfileService';
import type { EmployeeProfile as Profile } from '../../types/admin/employeeProfile';
import type { ApiResponse } from '../../types/api';

type TabId = 'personal' | 'employment' | 'leave';

const tabs: TabItem<TabId>[] = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'employment', label: 'Employment Details', icon: Briefcase },
  { id: 'leave', label: 'Leave Details', icon: CalendarDays },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const userId = Number(id);
  const toast = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>('personal');

  useEffect(() => {
    employeeProfileService
      .get(userId)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [userId]);

  // Every save returns the full profile, so the card and all tabs stay in sync
  function handleSaved(res: ApiResponse<Profile>) {
    setProfile(res.data);
    toast.success(res.message);
  }

  return (
    <div>
      <Link
        to="/admin/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to employees
      </Link>

      {loading ? (
        <p className="py-20 text-center text-gray-400">Loading...</p>
      ) : error || !profile ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Employee not found.'}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <ProfileCard profile={profile} />

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            {/* All tabs stay mounted so unsaved edits are kept when switching */}
            <div className="p-6">
              <div className={tab === 'personal' ? '' : 'hidden'}>
                <PersonalTab profile={profile} onSaved={handleSaved} />
              </div>
              <div className={tab === 'employment' ? '' : 'hidden'}>
                <EmploymentTab profile={profile} onSaved={handleSaved} />
              </div>
              <div className={tab === 'leave' ? '' : 'hidden'}>
                <LeaveTab profile={profile} onSaved={handleSaved} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
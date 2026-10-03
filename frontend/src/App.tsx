import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import { ToastProvider } from './components/Toast/ToastProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import RequireAuth from './features/auth/RequireAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import MyLeave from './pages/MyLeave';
import ComingSoon from './pages/admin/ComingSoon';
import Dashboard from './pages/admin/Dashboard';
import Departments from './pages/admin/Departments';
import EmployeeProfile from './pages/admin/EmployeeProfile';
import EmployeeSchedules from './pages/admin/EmployeeSchedules';
import Employees from './pages/admin/Employees';
import LeaveManagement from './pages/admin/LeaveManagement';
import Positions from './pages/admin/Positions';
import ScheduleTemplates from './pages/admin/ScheduleTemplates';
import UnitSections from './pages/admin/UnitSections';

// Modules that are in the menu but not built yet
const comingSoon = [
  { path: 'overtime', title: 'Overtime' },
  { path: 'payroll', title: 'Payroll' },
  { path: 'payslip', title: 'Payslip' },
  { path: 'announcements', title: 'Announcements' },
  { path: 'account-settings', title: 'Account Settings' },
];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<Home />} />
              <Route path="/leave" element={<MyLeave />} />
            </Route>

            <Route element={<RequireAuth adminOnly />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="employees" element={<Employees />} />
                <Route path="employees/:id" element={<EmployeeProfile />} />
                <Route path="departments" element={<Departments />} />
                <Route path="unit-sections" element={<UnitSections />} />
                <Route path="positions" element={<Positions />} />
                <Route path="schedule-templates" element={<ScheduleTemplates />} />
                <Route path="employee-schedules" element={<EmployeeSchedules />} />
                <Route path="leave-management" element={<LeaveManagement />} />
                {comingSoon.map((page) => (
                  <Route key={page.path} path={page.path} element={<ComingSoon title={page.title} />} />
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
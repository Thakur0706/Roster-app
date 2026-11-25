import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RosterPage from './pages/RosterPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import BrandsPage from './pages/BrandsPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import LeavesPage from './pages/LeavesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PodRosterPage from './pages/PodRosterPage.jsx';
import ProcessRosterPage from './pages/ProcessRosterPage.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="roster" element={<RosterPage />} />
        <Route path="roster/pod/:podId" element={<PodRosterPage />} />
        <Route path="roster/process/:processId" element={<ProcessRosterPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="leaves" element={<LeavesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/roster" replace />} />
    </Routes>
  );
}

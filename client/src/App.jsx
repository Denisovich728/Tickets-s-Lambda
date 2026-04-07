import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventEditor from './pages/EventEditor';
import TicketGenerator from './pages/TicketGenerator';
import Scanner from './pages/Scanner';
import Sidebar from './components/Sidebar';
import EventStaffPage from './pages/EventStaffPage';
import UserManagement from './pages/UserManagement';
import AdminDBViewer from './pages/AdminDBViewer';
import StaffProfiles from './pages/StaffProfiles';
import SeatMonitor from './pages/SeatMonitor';
import StaffClock from './pages/StaffClock';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

// Layout component that includes the Sidebar
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected/App Routes (With Sidebar) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly={true}><UserManagement /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><EventEditor /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><EventEditor /></ProtectedRoute>} />
            <Route path="/events/:id/tickets" element={<ProtectedRoute><TicketGenerator /></ProtectedRoute>} />
            <Route path="/events/:id/staff" element={<ProtectedRoute><EventStaffPage /></ProtectedRoute>} />
            <Route path="/events/:id/map" element={<ProtectedRoute><SeatMonitor /></ProtectedRoute>} />
            <Route path="/staff-profiles" element={<ProtectedRoute adminOnly={true}><StaffProfiles /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/clock-in" element={<ProtectedRoute><StaffClock /></ProtectedRoute>} />
            <Route path="/admin/db" element={<ProtectedRoute adminOnly={true}><AdminDBViewer /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import ProfileSetup from './pages/ProfileSetup';
import RolePicker from './pages/RolePicker';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const { user, sessionRole } = useAuth();

  // 1. Not logged in → show login/register
  if (!user) return <AuthPage />;

  // 2. Admin → admin dashboard
  if (user.userType === 'admin') return <AdminDashboard />;

  // 3. Student: profile not complete → setup first
  if (!user.profileComplete) return <ProfileSetup />;

  // 4. Student: no session role chosen yet → pick role
  if (!sessionRole) return <RolePicker />;

  // 5. All good → student dashboard
  return <StudentDashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

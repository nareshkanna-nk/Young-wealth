 import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Home } from './components/pages/Home';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminCourseManager } from './components/admin/AdminCourseManager';
import { SchoolDashboard } from './components/dashboard/SchoolDashboard';
import { CollegeDashboard } from './components/dashboard/CollegeDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { LearningSection } from './components/pages/LearningSection';
import { ExpenseTracker } from './components/pages/ExpenseTracker';
import { PaymentPage } from './components/pages/PaymentPage';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './utils/constants';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {!window.location.pathname.startsWith('/admin') && <Header />}
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.AUTH.LOGIN} element={<PublicRoute><Login /></PublicRoute>} />
            <Route path={ROUTES.AUTH.SIGNUP} element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path={ROUTES.ADMIN.LOGIN} element={<PublicRoute><AdminLogin /></PublicRoute>} />
            
            {/* Protected Dashboard Routes */}
            <Route path={ROUTES.DASHBOARD.SCHOOL} element={
              <ProtectedRoute requiredRole="school-student">
                <SchoolDashboard />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.DASHBOARD.COLLEGE} element={
              <ProtectedRoute requiredRole="college-student">
                <CollegeDashboard />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.DASHBOARD.EMPLOYEE} element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path={ROUTES.ADMIN.DASHBOARD} element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ADMIN.COURSE_MANAGER} element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseManager />
              </ProtectedRoute>
            } />

            {/* Feature Routes */}
            <Route path={ROUTES.LEARNING} element={
              <ProtectedRoute>
                <LearningSection />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.PAYMENT} element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.EXPENSE_TRACKER} element={
              <ProtectedRoute requiredRole="college-student">
                <ExpenseTracker />
              </ProtectedRoute>
            } /> 
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SurfSessionsPage from './pages/SurfSessionsPage';
import SurfSessionFormPage from './pages/SurfSessionFormPage';
import SurfSpotsPage from './pages/SurfSpotsPage';
import SurfboardsPage from './pages/SurfboardsPage';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading text="Loading..." />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sessions" element={<SurfSessionsPage />} />
            <Route path="sessions/new" element={<SurfSessionFormPage />} />
            <Route path="sessions/:id/edit" element={<SurfSessionFormPage />} />
            <Route path="spots" element={<SurfSpotsPage />} />
            <Route path="surfboards" element={<SurfboardsPage />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

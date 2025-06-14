import { Routes, Route } from 'react-router-dom';

// Layouts and Guards
import ProtectedLayout from '@/components/ProtectedLayout';
import AuthGuard from '@/components/AuthGuard';

// Page Components



import LandingPage from '@/components/LandingPage';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import OAuthCallback from '@/components/OAuthCallback';




// This component combines the guard and layout for cleaner routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <ProtectedLayout>
        {children}
      </ProtectedLayout>
    </AuthGuard>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />

      {/* This is the new callback route for the popup */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      {/* Add dynamic platform callback route for OAuth */}
      <Route path="/oauth/callback/:platform" element={<OAuthCallback />} />

      {/* Protected Routes - Unified Dashboard */}
      <Route
        path="/dashboard"
        element={<UnifiedDashboard />}
      />
      {/* Legacy routes redirect to unified dashboard */}
      <Route
        path="/create"
        element={<UnifiedDashboard />}
      />
      <Route
        path="/posts"
        element={<UnifiedDashboard />}
      />
      <Route
        path="/analytics"
        element={<UnifiedDashboard />}
      />
      <Route
        path="/settings"
        element={<UnifiedDashboard />}
      />
    </Routes>
  );
}

export default App;
import { Routes, Route } from 'react-router-dom';

// Layouts and Guards
import ProtectedLayout from '@/components/ProtectedLayout';
import AuthGuard from '@/components/AuthGuard';

// Page Components



import LandingPage from '@/components/LandingPage';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import OAuthCallback from '@/components/OAuthCallback';




// This component only uses AuthGuard without ProtectedLayout to avoid double sidebars
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      {children}
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
        element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        }
      />
      {/* Legacy routes redirect to unified dashboard */}
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts"
        element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
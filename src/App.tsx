import { Routes, Route } from 'react-router-dom';

// Layouts and Guards
import ProtectedLayout from '@/components/ProtectedLayout';
import AuthGuard from '@/components/AuthGuard';

// Page Components



import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import CreatePost from '@/components/CreatePost';
import MyPosts from '@/components/MyPosts';
import Analytics from '@/components/Analytics';
import Settings from '@/components/Settings';
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

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/create"
        element={<ProtectedRoute><CreatePost /></ProtectedRoute>}
      />
      <Route
        path="/posts"
        element={<ProtectedRoute><MyPosts /></ProtectedRoute>}
      />
      <Route
        path="/analytics"
        element={<ProtectedRoute><Analytics /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><Settings /></ProtectedRoute>}
      />
    </Routes>
  );
}

export default App;
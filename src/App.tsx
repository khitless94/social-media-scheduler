import { Routes, Route } from 'react-router-dom';

// Layouts and Guards
import ProtectedLayout from '@/components/ProtectedLayout';
import AuthGuard from '@/components/AuthGuard';

// Page Components



import LandingPage from '@/components/LandingPage';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import CreatePost from '@/components/CreatePost';
import CreatePostMinimal from '@/components/CreatePostMinimal';
import CreatePostTest from '@/components/CreatePostTest';
import TestCreatePost from '@/components/TestCreatePost';
import CreatePostSimple from '@/components/CreatePostSimple';
import OAuthCallback from '@/components/OAuthCallback';
import MyPostsPage from '@/components/pages/MyPostsPage';




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
      {/* Dedicated Create Page */}
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreatePostMinimal />
          </ProtectedRoute>
        }
      />
      {/* Original Create Page (for debugging) */}
      <Route
        path="/create-original"
        element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        }
      />
      {/* Debug Create Page */}
      <Route
        path="/create-debug"
        element={
          <ProtectedRoute>
            <CreatePostTest />
          </ProtectedRoute>
        }
      />
      {/* Test Create Page */}
      <Route
        path="/test-create"
        element={
          <ProtectedRoute>
            <TestCreatePost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts"
        element={
          <ProtectedRoute>
            <MyPostsPage />
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
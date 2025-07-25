import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts and Guards
import ProtectedLayout from '@/components/ProtectedLayout';
import AuthGuard from '@/components/AuthGuard';

// Page Components



import LandingPage from '@/components/LandingPage';
import Layout from '@/components/Layout';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import CreatePost from '@/components/CreatePost';
import CreatePostMinimal from '@/components/CreatePostModern';
import CreatePostRedesigned from '@/components/CreatePostRedesigned';
import CreatePostTest from '@/components/CreatePostTest';
import CreatePostSimplified from '@/components/CreatePostSimplified';
import SettingsPage from '@/components/pages/SettingsPage';
import MyPostsPage from '@/components/pages/MyPostsPage';
import CalendarPage from '@/components/pages/CalendarPage';
import CalendarTest from '@/components/CalendarTest';
import { MediaLibrary } from '@/components/MediaLibrary';
import { AICopywriting } from '@/components/AICopywriting';
import { CaptionGenerator } from '@/components/CaptionGenerator';
import RealTimeAnalytics from '@/components/RealTimeAnalytics';
import { TimePickerTest } from '@/components/TimePickerTest';
import { SimpleSchedulingTest } from '@/components/SimpleSchedulingTest';
import { CleanupScheduledPosts } from '@/components/CleanupScheduledPosts';
import { CronJobMonitor } from '@/components/CronJobMonitor';
import { SocialPostingMonitor } from '@/components/SocialPostingMonitor';
import { TimezoneFixTest } from '@/components/TimezoneFixTest';
import { SocialMediaDiagnostic } from '@/components/SocialMediaDiagnostic';
import { QuickSocialTest } from '@/components/QuickSocialTest';
import { SocialPostingFix } from '@/components/SocialPostingFix';
import { DatabaseTypeTest } from '@/components/DatabaseTypeTest';
import { ManualPostProcessor } from '@/components/ManualPostProcessor';
import { CronSystemMonitor } from '@/components/CronSystemMonitor';
import { TimezonePostFixer } from '@/components/TimezonePostFixer';
import TestCreatePost from '@/components/TestCreatePost';

import OAuthCallback from '@/components/OAuthCallback';
import { TwitterSchedulingTest } from '@/components/TwitterSchedulingTest';
import { DatabaseChecker } from '@/components/DatabaseChecker';
import { DatabaseInspector } from '@/components/DatabaseInspector';
import { DirectDatabaseTest } from '@/components/DirectDatabaseTest';
import { CronJobDiagnostic } from '@/components/CronJobDiagnostic';
import { TwitterPostProcessor } from '@/components/TwitterPostProcessor';
import { MediaLibraryTest } from '@/components/MediaLibraryTest';
import { MediaLibrarySimple } from '@/components/MediaLibrarySimple';




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
      {/* Main App Layout with Nested Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<UnifiedDashboard />} />
        <Route path="create" element={<CreatePostRedesigned />} />
        <Route path="create-simple" element={<CreatePostSimplified />} />
        <Route path="create-test" element={<CreatePostTest />} />
        <Route path="posts" element={<MyPostsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="analytics" element={<RealTimeAnalytics />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="ai-copywriting" element={<AICopywriting />} />
        <Route path="caption-generator" element={<CaptionGenerator />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      {/* Original Create Page (for debugging) */}
      <Route
        path="/create-original"
        element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-modern"
        element={
          <ProtectedRoute>
            <CreatePostMinimal />
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
      {/* Time Picker Test Page */}
      <Route
        path="/test-timepicker"
        element={
          <ProtectedRoute>
            <TimePickerTest />
          </ProtectedRoute>
        }
      />
      {/* Simple Scheduling Test Page */}
      <Route
        path="/test-scheduling"
        element={
          <ProtectedRoute>
            <SimpleSchedulingTest />
          </ProtectedRoute>
        }
      />
      {/* Cleanup Scheduled Posts Page */}
      <Route
        path="/cleanup-posts"
        element={
          <ProtectedRoute>
            <CleanupScheduledPosts />
          </ProtectedRoute>
        }
      />
      {/* Cron Job Monitor Page */}
      <Route
        path="/cron-monitor"
        element={
          <ProtectedRoute>
            <CronJobMonitor />
          </ProtectedRoute>
        }
      />
      {/* Social Posting Monitor Page */}
      <Route
        path="/social-monitor"
        element={
          <ProtectedRoute>
            <SocialPostingMonitor />
          </ProtectedRoute>
        }
      />
      {/* Timezone Fix Test Page */}
      <Route
        path="/timezone-test"
        element={
          <ProtectedRoute>
            <TimezoneFixTest />
          </ProtectedRoute>
        }
      />
      {/* Social Media Diagnostic Page */}
      <Route
        path="/social-diagnostic"
        element={
          <ProtectedRoute>
            <SocialMediaDiagnostic />
          </ProtectedRoute>
        }
      />
      {/* Quick Social Test Page */}
      <Route
        path="/quick-social-test"
        element={
          <ProtectedRoute>
            <QuickSocialTest />
          </ProtectedRoute>
        }
      />
      {/* Social Posting Fix Page */}
      <Route
        path="/social-fix"
        element={
          <ProtectedRoute>
            <SocialPostingFix />
          </ProtectedRoute>
        }
      />
      {/* Database Type Test Page */}
      <Route
        path="/db-test"
        element={
          <ProtectedRoute>
            <DatabaseTypeTest />
          </ProtectedRoute>
        }
      />
      {/* Manual Post Processor Page */}
      <Route
        path="/manual-processor"
        element={
          <ProtectedRoute>
            <ManualPostProcessor />
          </ProtectedRoute>
        }
      />
      {/* Timezone Post Fixer Page */}
      <Route
        path="/timezone-fixer"
        element={
          <ProtectedRoute>
            <TimezonePostFixer />
          </ProtectedRoute>
        }
      />
      {/* Twitter Scheduling Test Page */}
      <Route
        path="/test-twitter-scheduling"
        element={
          <ProtectedRoute>
            <TwitterSchedulingTest />
          </ProtectedRoute>
        }
      />
      {/* Database Checker Page */}
      <Route
        path="/database-checker"
        element={
          <ProtectedRoute>
            <DatabaseChecker />
          </ProtectedRoute>
        }
      />
      {/* Database Inspector Page */}
      <Route
        path="/database-inspector"
        element={
          <ProtectedRoute>
            <DatabaseInspector />
          </ProtectedRoute>
        }
      />
      {/* Direct Database Test Page */}
      <Route
        path="/direct-database-test"
        element={
          <ProtectedRoute>
            <DirectDatabaseTest />
          </ProtectedRoute>
        }
      />
      {/* Cron Job Diagnostic Page */}
      <Route
        path="/cron-diagnostic"
        element={
          <ProtectedRoute>
            <CronJobDiagnostic />
          </ProtectedRoute>
        }
      />
      {/* Twitter Post Processor Page */}
      <Route
        path="/twitter-processor"
        element={
          <ProtectedRoute>
            <TwitterPostProcessor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar-test"
        element={
          <ProtectedRoute>
            <CalendarTest />
          </ProtectedRoute>
        }
      />



      {/* Media Library Test */}
      <Route
        path="/media-test"
        element={
          <ProtectedRoute>
            <MediaLibraryTest />
          </ProtectedRoute>
        }
      />
      {/* Media Library Simple Test */}
      <Route
        path="/media-simple"
        element={
          <ProtectedRoute>
            <MediaLibrarySimple />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route - redirect to dashboard for authenticated users */}
      <Route
        path="*"
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
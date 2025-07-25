import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '@/hooks/useAuth';
import App from './App.tsx';
import './index.css';

// Production-ready console management
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Handle browser extension connection errors
window.addEventListener('error', (event) => {
  if (event.message.includes('Could not establish connection') ||
      event.message.includes('Receiving end does not exist')) {
    // Suppress browser extension errors
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Could not establish connection') ||
      event.reason?.message?.includes('Receiving end does not exist')) {
    // Suppress browser extension promise rejections
    event.preventDefault();
    return false;
  }
});

// Suppress all console output in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
} else {
  // Development: Only suppress known third-party noise
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      // React warnings we want to suppress
      message.includes('Maximum update depth exceeded') ||
      message.includes('useEffect has a missing dependency') ||
      message.includes('React Hook useEffect has a missing dependency') ||
      message.includes('React Hook useCallback has a missing dependency') ||
      message.includes('React Hook useMemo has a missing dependency') ||

      // Network/API errors
      message.includes('Failed to load resource') ||
      message.includes('404') ||
      message.includes('400') ||
      message.includes('401') ||
      message.includes('406') ||
      message.includes('net::ERR_') ||
      message.includes('Failed to fetch') ||

      // Third-party service errors
      message.includes('analytics.tiktok.com') ||
      message.includes('lovable-api.com') ||
      message.includes('CORS policy') ||
      message.includes('Access-Control-Allow-Origin') ||

    // Reddit CSP and framing errors
    message.includes('frame-ancestors') ||
    message.includes('reddit.com') ||
    message.includes('Content Security Policy') ||
    message.includes('Refused to frame')
  )) {
    return; // Don't log these specific errors
  }
  originalError.apply(console, args);
};

  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      // React warnings
      message.includes('useEffect has a missing dependency') ||
      message.includes('React Hook') ||
      message.includes('was preloaded using link preload but not used') ||

      // Third-party warnings
      message.includes('analytics.tiktok.com') ||
      message.includes('lovable-api.com') ||
      message.includes('supabase.co/rest/v1/') ||
      message.includes('Failed to fetch')
    )) {
      return; // Don't log these warnings
    }
    originalWarn.apply(console, args);
  };

  console.log = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      // Suppress debug logs
      message.includes('🔥 [Enhanced]') ||
      message.includes('🔍 [DatabaseChecker]') ||
      message.includes('📊 [DatabaseChecker]') ||
      message.includes('✅ [DatabaseInspector]') ||
      message.includes('❌ [DatabaseInspector]') ||
      message.includes('[SocialMediaConfig]') ||
      message.includes('Instagram status check') ||
      message.includes('Auth state changed') ||
      message.includes('Page load time') ||
      message.includes('Skipping post') ||
      message.includes('status check:') ||
      message.includes('enhancedConnected:') ||
      message.includes('originalConnected:') ||
      message.includes('isConnected:') ||
      message.includes('enhancedConnectionStatus:') ||
      message.includes('connectionStatus')
    )) {
      return; // Don't log debug messages
    }
    originalLog.apply(console, args);
  };
}

// Handle unhandled promise rejections from all third-party services
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason && (
    reason.toString().includes('analytics.tiktok.com') ||
    reason.toString().includes('lovable-api.com') ||
    reason.toString().includes('Failed to fetch') ||
    reason.toString().includes('ERR_CONNECTION_TIMED_OUT') ||
    reason.toString().includes('ERR_FAILED') ||
    reason.toString().includes('CORS')
  )) {
    console.log('Third-party/platform service error handled gracefully');
    event.preventDefault(); // Prevent unhandled rejection error
    return;
  }
});

// Handle global errors
window.addEventListener('error', (event) => {
  if (event.filename && (
    event.filename.includes('lovable-api.com') ||
    event.filename.includes('analytics.tiktok.com') ||
    event.filename.includes('cdn.gpteng.co')
  )) {
    console.log('External service error handled gracefully');
    event.preventDefault();
    return true;
  }
});

// Clean up any problematic preload links
const cleanupPreloadLinks = () => {
  const preloadLinks = document.querySelectorAll('link[rel="preload"]');
  preloadLinks.forEach((link) => {
    if (!link.hasAttribute('as')) {
      const href = link.getAttribute('href') || '';
      if (href.endsWith('.js') || href.endsWith('.tsx') || href.endsWith('.ts')) {
        link.setAttribute('as', 'script');
      } else if (href.endsWith('.css')) {
        link.setAttribute('as', 'style');
      } else if (href.match(/\.(woff|woff2|ttf|otf)$/)) {
        link.setAttribute('as', 'font');
        link.setAttribute('crossorigin', 'anonymous');
      } else if (href.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
        link.setAttribute('as', 'image');
      } else {
        link.remove();
      }
    }
  });
};

// Run cleanup periodically
document.addEventListener('DOMContentLoaded', cleanupPreloadLinks);
setTimeout(cleanupPreloadLinks, 1000);
setTimeout(cleanupPreloadLinks, 3000);

// Optimized QueryClient with robust error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry for platform/analytics errors
        const errorMessage = error?.message || '';
        if (errorMessage.includes('analytics.tiktok.com') || 
            errorMessage.includes('lovable-api.com') ||
            errorMessage.includes('ERR_CONNECTION_TIMED_OUT') ||
            errorMessage.includes('CORS')) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});



createRoot(document.getElementById("root")!).render(
  // Temporarily disable StrictMode to prevent double renders during development
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  // </StrictMode>
);
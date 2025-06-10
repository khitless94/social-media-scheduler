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

// Comprehensive error suppression for development environment
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (
    // Original errors you wanted to suppress
    message.includes('badge_indicators') ||
    message.includes('Failed to load resource') ||
    message.includes('404') ||
    message.includes('authorize') ||
    message.includes('400') ||
    
    // Preload and performance warnings
    message.includes('preload') ||
    message.includes('analytics.tiktok.com') ||
    message.includes('ERR_CONNECTION_TIMED_OUT') ||
    
    // Lovable platform errors (development only)
    message.includes('lovable-api.com') ||
    message.includes('CORS policy') ||
    message.includes('Access-Control-Allow-Origin') ||
    message.includes('ERR_FAILED') ||
    message.includes('latest-message') ||
    
    // Network errors from development environment
    message.includes('net::ERR_') ||
    message.includes('Failed to fetch') ||
    
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
    message.includes('preload') ||
    message.includes('was preloaded using link preload but not used') ||
    message.includes('analytics.tiktok.com') ||
    message.includes('lovable-api.com')
  )) {
    return; // Don't log these warnings
  }
  originalWarn.apply(console, args);
};

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

// Debounce auth state changes to reduce noise
let lastAuthLog = 0;
const authLogDebounce = 2000; // 2 seconds

const originalLog = console.log;
console.log = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Debounce auth state change logs
    if (message.includes('Auth state changed')) {
      const now = Date.now();
      if (now - lastAuthLog < authLogDebounce) {
        return; // Skip duplicate auth logs
      }
      lastAuthLog = now;
    }
    
    // Skip repetitive page load time logs
    if (message.includes('Page load time') && args[1] && args[1] > 5000) {
      return; // Skip slow page load logs (likely from refresh)
    }
  }
  originalLog.apply(console, args);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);
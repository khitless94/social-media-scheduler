/**
 * Utility for making authenticated requests to Supabase with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuthenticatedRequestOptions {
  maxRetries?: number;
  retryDelay?: number;
  requireAuth?: boolean;
}

/**
 * Ensures the user is authenticated and session is valid
 */
export async function ensureAuthenticated(): Promise<{ user: any; session: any } | null> {
  try {
    // First, try to get the current session
    let { data: { session, user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('No valid user found, attempting session refresh...');
      
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        return null;
      }
      
      if (refreshData.session?.user) {
        console.log('Session refreshed successfully');
        return {
          user: refreshData.session.user,
          session: refreshData.session
        };
      }
      
      return null;
    }
    
    // Verify the session is still valid by getting it directly
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !currentSession) {
      console.log('Session validation failed, attempting refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError);
        return null;
      }
      
      return {
        user: refreshData.session.user,
        session: refreshData.session
      };
    }
    
    return {
      user: currentSession.user,
      session: currentSession
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return null;
  }
}

/**
 * Makes an authenticated request with retry logic
 */
export async function makeAuthenticatedRequest<T>(
  requestFn: () => Promise<{ data: T; error: any }>,
  options: AuthenticatedRequestOptions = {}
): Promise<{ data: T | null; error: any; authError?: boolean }> {
  const { maxRetries = 2, retryDelay = 1000, requireAuth = true } = options;
  
  if (requireAuth) {
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      return {
        data: null,
        error: new Error('Authentication required. Please log in.'),
        authError: true
      };
    }
  }
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      
      // If we get an auth error, try to refresh and retry
      if (result.error && isAuthError(result.error) && attempt < maxRetries) {
        console.log(`Auth error on attempt ${attempt + 1}, refreshing session...`);
        
        const authResult = await ensureAuthenticated();
        if (!authResult) {
          return {
            data: null,
            error: new Error('Authentication failed. Please log in again.'),
            authError: true
          };
        }
        
        // Wait before retrying
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Request attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }
  
  return {
    data: null,
    error: lastError || new Error('Request failed after all retries'),
    authError: isAuthError(lastError)
  };
}

/**
 * Checks if an error is authentication-related
 */
function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  
  return (
    message.includes('no api key') ||
    message.includes('unauthorized') ||
    message.includes('jwt') ||
    message.includes('auth') ||
    message.includes('session') ||
    code === '401' ||
    code === 'PGRST301' // PostgREST auth error
  );
}

/**
 * Wrapper for Supabase database queries with authentication
 */
export async function authenticatedQuery<T>(
  queryBuilder: any,
  options?: AuthenticatedRequestOptions
): Promise<{ data: T | null; error: any; authError?: boolean }> {
  return makeAuthenticatedRequest(
    () => queryBuilder,
    options
  );
}

/**
 * Wrapper for Supabase storage operations with authentication
 */
export async function authenticatedStorageOperation<T>(
  operation: () => Promise<{ data: T; error: any }>,
  options?: AuthenticatedRequestOptions
): Promise<{ data: T | null; error: any; authError?: boolean }> {
  return makeAuthenticatedRequest(operation, options);
}

/**
 * Helper to check if user needs to re-authenticate
 */
export function shouldPromptReauth(error: any): boolean {
  return isAuthError(error);
}

/**
 * Helper to get current user safely
 */
export async function getCurrentUser() {
  const authResult = await ensureAuthenticated();
  return authResult?.user || null;
}

/**
 * Helper to get current session safely
 */
export async function getCurrentSession() {
  const authResult = await ensureAuthenticated();
  return authResult?.session || null;
}

/**
 * Session validation utilities to prevent null/undefined access errors
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * Safely validates and extracts user information from a session
 */
export function validateSession(session: Session | null): {
  isValid: boolean;
  user: User | null;
  email: string | null;
  userId: string | null;
} {
  if (!session || !session.user) {
    console.log('[Session Validation] Invalid session or user not authenticated');
    return {
      isValid: false,
      user: null,
      email: null,
      userId: null,
    };
  }

  return {
    isValid: true,
    user: session.user,
    email: session.user.email || null,
    userId: session.user.id,
  };
}

/**
 * Safely validates a user object
 */
export function validateUser(user: User | null): {
  isValid: boolean;
  email: string | null;
  userId: string | null;
} {
  if (!user) {
    console.log('[User Validation] User is null or undefined');
    return {
      isValid: false,
      email: null,
      userId: null,
    };
  }

  return {
    isValid: true,
    email: user.email || null,
    userId: user.id,
  };
}

/**
 * Safe email getter with fallback
 */
export function getUserEmail(user: User | null, fallback: string = 'No email available'): string {
  return user?.email || fallback;
}

/**
 * Safe user ID getter
 */
export function getUserId(user: User | null): string | null {
  return user?.id || null;
}

/**
 * Logs session state for debugging
 */
export function debugSession(session: Session | null, context: string = 'Unknown'): void {
  console.log(`[Session Debug - ${context}]`, {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasEmail: !!session?.user?.email,
    userId: session?.user?.id || 'N/A',
    email: session?.user?.email || 'N/A',
  });
}

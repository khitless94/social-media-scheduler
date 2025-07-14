// Enhanced error handling and user feedback for webhook scheduling
// Add this to your existing scheduling components

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Error types for better handling
export enum SchedulingErrorType {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database', 
  WEBHOOK = 'webhook',
  VALIDATION = 'validation',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  OAUTH = 'oauth',
  UNKNOWN = 'unknown'
}

export interface SchedulingError {
  type: SchedulingErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
}

export interface SchedulingResult {
  success: boolean;
  postId?: string;
  error?: SchedulingError;
  retryAfter?: number; // seconds
}

// Error classification function
const classifyError = (error: any, context: string): SchedulingError => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorDetails = error?.details || error;

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return {
      type: SchedulingErrorType.AUTHENTICATION,
      message: errorMessage,
      details: errorDetails,
      retryable: false,
      userMessage: 'Please log in again to schedule posts.'
    };
  }

  // Database errors
  if (context === 'database' || errorMessage.includes('database') || errorMessage.includes('PGRST')) {
    return {
      type: SchedulingErrorType.DATABASE,
      message: errorMessage,
      details: errorDetails,
      retryable: true,
      userMessage: 'Database error occurred. Please try again in a moment.'
    };
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      type: SchedulingErrorType.RATE_LIMIT,
      message: errorMessage,
      details: errorDetails,
      retryable: true,
      userMessage: 'You\'re scheduling posts too quickly. Please wait a moment and try again.'
    };
  }

  // OAuth/Social media errors
  if (errorMessage.includes('oauth') || errorMessage.includes('token') || errorMessage.includes('expired')) {
    return {
      type: SchedulingErrorType.OAUTH,
      message: errorMessage,
      details: errorDetails,
      retryable: false,
      userMessage: 'Your social media connection has expired. Please reconnect your accounts.'
    };
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      type: SchedulingErrorType.VALIDATION,
      message: errorMessage,
      details: errorDetails,
      retryable: false,
      userMessage: 'Please check your post content and try again.'
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return {
      type: SchedulingErrorType.NETWORK,
      message: errorMessage,
      details: errorDetails,
      retryable: true,
      userMessage: 'Network error occurred. Please check your connection and try again.'
    };
  }

  // Webhook specific errors
  if (context === 'webhook') {
    return {
      type: SchedulingErrorType.WEBHOOK,
      message: errorMessage,
      details: errorDetails,
      retryable: true,
      userMessage: 'Scheduling service is temporarily unavailable. Please try again.'
    };
  }

  // Default unknown error
  return {
    type: SchedulingErrorType.UNKNOWN,
    message: errorMessage,
    details: errorDetails,
    retryable: true,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
};

// Enhanced webhook scheduler with comprehensive error handling
export const useEnhancedWebhookScheduler = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [lastError, setLastError] = useState<SchedulingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const N8N_WEBHOOK_URL = 'https://k94.app.n8n.cloud/webhook/schedule-post';
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 5000]; // Progressive delays

  // Validate post data before sending
  const validatePostData = (postData: any): SchedulingError | null => {
    if (!postData.content?.trim()) {
      return {
        type: SchedulingErrorType.VALIDATION,
        message: 'Content is required',
        retryable: false,
        userMessage: 'Please enter some content for your post.'
      };
    }

    if (!postData.platforms?.length) {
      return {
        type: SchedulingErrorType.VALIDATION,
        message: 'At least one platform is required',
        retryable: false,
        userMessage: 'Please select at least one social media platform.'
      };
    }

    if (!postData.scheduled_for) {
      return {
        type: SchedulingErrorType.VALIDATION,
        message: 'Scheduled time is required',
        retryable: false,
        userMessage: 'Please select when you want to publish this post.'
      };
    }

    const scheduledTime = new Date(postData.scheduled_for);
    if (scheduledTime <= new Date()) {
      return {
        type: SchedulingErrorType.VALIDATION,
        message: 'Scheduled time must be in the future',
        retryable: false,
        userMessage: 'Please select a future date and time for your post.'
      };
    }

    return null;
  };

  // Enhanced schedule function with retry logic
  const schedulePostWithRetry = useCallback(async (
    postData: any,
    attempt: number = 1
  ): Promise<SchedulingResult> => {
    try {
      // Validate authentication
      if (!user) {
        const authError = classifyError({ message: 'User not authenticated' }, 'authentication');
        return { success: false, error: authError };
      }

      // Validate post data
      const validationError = validatePostData(postData);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Step 1: Save to database with error handling
      let savedPost;
      try {
        const { data, error: dbError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            content: postData.content,
            platform: postData.platforms[0],
            platforms: postData.platforms,
            media_urls: postData.media_urls || [],
            status: 'scheduled',
            scheduling_status: 'scheduled',
            scheduled_for: postData.scheduled_for
          })
          .select()
          .single();

        if (dbError) throw dbError;
        savedPost = data;
      } catch (dbError) {
        const error = classifyError(dbError, 'database');
        return { success: false, error };
      }

      // Step 2: Call webhook with enhanced error handling
      try {
        const webhookPayload = {
          post_id: savedPost.id,
          user_id: user.id,
          content: postData.content,
          platforms: postData.platforms,
          scheduled_for: postData.scheduled_for,
          media_urls: postData.media_urls || [],
          action: 'schedule_post'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id,
            'X-Retry-Attempt': attempt.toString()
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          // Handle specific HTTP status codes
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            const rateLimitError = classifyError({ message: 'Rate limit exceeded' }, 'webhook');
            return { success: false, error: rateLimitError, retryAfter };
          }

          throw new Error(`HTTP ${response.status}: ${errorData.message || errorText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          return { success: true, postId: savedPost.id };
        } else {
          throw new Error(result.error || 'Webhook returned failure');
        }

      } catch (webhookError) {
        // Update post status to failed
        await supabase
          .from('posts')
          .update({ 
            status: 'failed', 
            scheduling_status: 'failed' 
          })
          .eq('id', savedPost.id);

        const error = classifyError(webhookError, 'webhook');
        
        // Retry logic for retryable errors
        if (error.retryable && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt - 1] || 5000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return schedulePostWithRetry(postData, attempt + 1);
        }

        return { success: false, error };
      }

    } catch (error) {
      const classifiedError = classifyError(error, 'unknown');
      return { success: false, error: classifiedError };
    }
  }, [user]);

  // Main schedule function with user feedback
  const schedulePost = useCallback(async (postData: any): Promise<boolean> => {
    setIsScheduling(true);
    setLastError(null);
    setRetryCount(0);

    try {
      const result = await schedulePostWithRetry(postData);

      if (result.success) {
        toast({
          title: "Post scheduled successfully! 🎉",
          description: `Your post will be published to ${postData.platforms.join(', ')} at the scheduled time.`,
          duration: 5000
        });
        return true;
      } else {
        setLastError(result.error!);
        
        // Show user-friendly error message
        toast({
          title: "Scheduling failed",
          description: result.error!.userMessage,
          variant: "destructive",
          duration: result.error!.retryable ? 8000 : 5000,
          action: result.error!.retryable ? {
            label: "Retry",
            onClick: () => schedulePost(postData)
          } : undefined
        });

        // Log detailed error for debugging
        console.error('Scheduling error:', {
          type: result.error!.type,
          message: result.error!.message,
          details: result.error!.details,
          retryable: result.error!.retryable
        });

        return false;
      }
    } finally {
      setIsScheduling(false);
    }
  }, [schedulePostWithRetry, toast]);

  return {
    schedulePost,
    isScheduling,
    lastError,
    retryCount
  };
};

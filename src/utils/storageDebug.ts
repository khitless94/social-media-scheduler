/**
 * Storage and Authentication Debug Utilities
 * Use these functions to diagnose image upload issues
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureAuthenticated, authenticatedStorageOperation } from './authenticatedRequest';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Check if user is properly authenticated
 */
export async function checkAuthentication(): Promise<DiagnosticResult> {
  try {
    const authResult = await ensureAuthenticated();

    if (!authResult) {
      return {
        success: false,
        message: 'User not authenticated. Please log in.',
        details: null
      };
    }

    const { user, session } = authResult;

    return {
      success: true,
      message: `User authenticated successfully. ID: ${user.id}`,
      details: {
        userId: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        sessionValid: !!session,
        sessionExpiry: session?.expires_at
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Authentication check failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Check if the storage bucket exists and is accessible
 */
export async function checkStorageBucket(): Promise<DiagnosticResult> {
  try {
    // Use authenticated storage operation
    const result = await authenticatedStorageOperation(
      () => supabase.storage.from('user-images').list('', { limit: 1 }),
      { requireAuth: false } // Bucket listing might work without auth for public buckets
    );

    if (result.error) {
      if (result.error.message?.includes('Bucket not found')) {
        return {
          success: false,
          message: 'Storage bucket "user-images" not found. Please create it in your Supabase dashboard or run the setup-storage.sql script.',
          details: result.error
        };
      }

      if (result.authError) {
        return {
          success: false,
          message: 'Authentication required to access storage bucket. Please log in.',
          details: result.error
        };
      }

      return {
        success: false,
        message: `Storage bucket error: ${result.error.message}`,
        details: result.error
      };
    }

    return {
      success: true,
      message: 'Storage bucket "user-images" is accessible.',
      details: { fileCount: result.data?.length || 0 }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Storage bucket check failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Test image upload with a small test file
 */
export async function testImageUpload(): Promise<DiagnosticResult> {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    if (!authResult.success) {
      return authResult;
    }

    // Check bucket access
    const bucketResult = await checkStorageBucket();
    if (!bucketResult.success) {
      return bucketResult;
    }

    // Create a small test image (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();

    const authCheck = await ensureAuthenticated();
    if (!authCheck) {
      return {
        success: false,
        message: 'User not authenticated for upload test.',
        details: null
      };
    }

    const fileName = `${authCheck.user.id}/test-${Date.now()}.png`;

    // Try to upload the test image using authenticated operation
    const uploadResult = await authenticatedStorageOperation(
      () => supabase.storage
        .from('user-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        })
    );

    if (uploadResult.error) {
      return {
        success: false,
        message: `Upload test failed: ${uploadResult.error.message}`,
        details: uploadResult.error
      };
    }

    // Clean up the test file
    await authenticatedStorageOperation(
      () => supabase.storage
        .from('user-images')
        .remove([fileName])
    );

    return {
      success: true,
      message: 'Image upload test successful!',
      details: { testFileName: fileName }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Upload test failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Run all diagnostic checks
 */
export async function runFullDiagnostic(): Promise<{
  auth: DiagnosticResult;
  bucket: DiagnosticResult;
  upload: DiagnosticResult;
  overall: DiagnosticResult;
}> {
  console.log('🔍 Running storage diagnostic...');
  
  const auth = await checkAuthentication();
  console.log('Auth check:', auth);
  
  const bucket = await checkStorageBucket();
  console.log('Bucket check:', bucket);
  
  const upload = await testImageUpload();
  console.log('Upload test:', upload);
  
  const overall: DiagnosticResult = {
    success: auth.success && bucket.success && upload.success,
    message: auth.success && bucket.success && upload.success 
      ? 'All diagnostic checks passed! Image upload should work properly.'
      : 'Some diagnostic checks failed. Please address the issues above.',
    details: {
      authPassed: auth.success,
      bucketPassed: bucket.success,
      uploadPassed: upload.success
    }
  };
  
  console.log('Overall result:', overall);
  
  return { auth, bucket, upload, overall };
}

/**
 * Get setup instructions based on diagnostic results
 */
export function getSetupInstructions(diagnostic: Awaited<ReturnType<typeof runFullDiagnostic>>): string[] {
  const instructions: string[] = [];
  
  if (!diagnostic.auth.success) {
    instructions.push('1. Please log in to your account or refresh your session.');
  }
  
  if (!diagnostic.bucket.success) {
    instructions.push('2. Create the "user-images" storage bucket in your Supabase dashboard.');
    instructions.push('3. Run the setup-storage.sql script in your Supabase SQL Editor.');
  }
  
  if (!diagnostic.upload.success && diagnostic.auth.success && diagnostic.bucket.success) {
    instructions.push('4. Check your Row Level Security (RLS) policies for the storage.objects table.');
    instructions.push('5. Ensure your user has the necessary permissions to upload files.');
  }
  
  if (instructions.length === 0) {
    instructions.push('✅ Everything looks good! Image upload should work properly.');
  }
  
  return instructions;
}

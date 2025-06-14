import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const OAuthCallback = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    // Add some delay to ensure all URL params are loaded
    const timer = setTimeout(() => {
      handleCallback();
    }, 100);

    return () => clearTimeout(timer);
  }, [platform, navigate, toast, searchParams]);

  const handleCallback = async () => {
      try {
        // Get URL parameters
        const success = searchParams.get("success");
        const errorMessageFromEdge = searchParams.get("error");
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const oauthError = searchParams.get('oauth_error'); // Renamed to avoid conflict
        const platformFromParams = searchParams.get('platform');

        // Use platform from URL params or search params
        const activePlatform = platform || platformFromParams;

        console.log('OAuth callback received:', { 
          platform, 
          platformFromParams, 
          activePlatform,
          success, 
          errorMessageFromEdge, 
          code: code ? 'present' : 'missing',
          state: state ? 'present' : 'missing'
        });

        console.log('OAuth callback params:', { 
          success, 
          errorMessageFromEdge, 
          code: code ? 'present' : 'missing',
          state: state ? 'present' : 'missing',
          oauthError, 
          platform: activePlatform 
        });

        if (!activePlatform) {
          setStatus('error');
          setMessage('No platform specified');
          return;
        }

        // Handle explicit success from edge function
        if (success === 'true') {
          setStatus('success');
          setMessage(`Successfully connected your ${activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} account!`);

          toast({
            title: "Connected successfully!",
            description: `Your ${activePlatform} account has been connected.`,
          });

          // Refresh session to get updated user data
          await supabase.auth.getSession();

          // Handle popup vs regular window
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: "oauth_success",
                platform: activePlatform
              }, window.location.origin);
              setTimeout(() => {
                if (!window.closed) window.close();
              }, 1500);
            } catch (error) {
              console.error('Error posting message to opener:', error);
              // Fallback: just close the window
              setTimeout(() => {
                if (!window.closed) window.close();
              }, 1500);
            }
          } else {
            setTimeout(() => navigate("/settings"), 1500);
          }
          return;
        }

        // Handle explicit error from edge function
        if (errorMessageFromEdge) {
          const decodedError = decodeURIComponent(errorMessageFromEdge);
          setStatus('error');

          // Provide user-friendly error messages for common LinkedIn issues
          let userFriendlyMessage = decodedError;
          if (activePlatform === 'linkedin') {
            if (decodedError.includes('invalid_redirect_uri')) {
              userFriendlyMessage = "LinkedIn app configuration issue. The redirect URL needs to be updated in LinkedIn Developer Console.";
            } else if (decodedError.includes('invalid_client_id')) {
              userFriendlyMessage = "LinkedIn app not found. Please verify your LinkedIn app configuration.";
            } else if (decodedError.includes('Bummer, something went wrong')) {
              userFriendlyMessage = "LinkedIn is experiencing issues. This usually means:\n• Your LinkedIn app needs approval\n• App permissions need to be configured\n• LinkedIn servers are temporarily down\n\nPlease try again in a few minutes or check your LinkedIn app settings.";
            } else if (decodedError.includes('unauthorized_client')) {
              userFriendlyMessage = "LinkedIn app authorization failed. Please check your app's client secret and permissions.";
            } else if (decodedError.includes('access_denied')) {
              userFriendlyMessage = "LinkedIn access was denied. Please try connecting again and grant the required permissions.";
            }
          } else if (decodedError.includes('Bummer, something went wrong')) {
            userFriendlyMessage = `${activePlatform} OAuth configuration error. Please check your app settings.`;
          }

          setMessage(userFriendlyMessage);

          console.error("OAuth error from Edge Function:", errorMessageFromEdge);
          toast({
            title: "Connection failed",
            description: userFriendlyMessage,
            variant: "destructive",
          });

          if (window.opener) {
            window.opener.postMessage({ 
              type: "oauth_error", 
              platform: activePlatform, 
              error: decodeURIComponent(errorMessageFromEdge) 
            }, "*");
            setTimeout(() => window.close(), 3000);
          } else {
            setTimeout(() => navigate("/settings"), 3000);
          }
          return;
        }

        // Handle OAuth provider errors (user denied, etc.)
        if (oauthError) {
          setStatus('error');
          setMessage(`Authorization failed: ${decodeURIComponent(oauthError)}`);
          
          console.error("OAuth error from provider:", oauthError);
          toast({
            title: "Authorization Failed",
            description: "Authorization was denied or failed.",
            variant: "destructive",
          });

          if (window.opener) {
            window.opener.postMessage({ 
              type: "oauth_error", 
              platform: activePlatform, 
              error: "Authorization denied" 
            }, "*");
            setTimeout(() => window.close(), 3000);
          } else {
            setTimeout(() => navigate("/settings"), 3000);
          }
          return;
        }

        // Handle authorization code from OAuth provider
        if (code && state) {
          console.log("Received authorization code, processing with edge function");
          setMessage("Exchanging authorization code...");
          
          try {
            // Redirect to edge function for processing (original approach but with error handling)
            const edgeFunctionUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&platform=${encodeURIComponent(activePlatform)}`;
            
            // Set a timeout to prevent infinite waiting
            const timeoutId = setTimeout(() => {
              setStatus('error');
              setMessage('Connection timeout. Please try again.');
              toast({
                title: "Connection Timeout",
                description: "The connection process took too long. Please try again.",
                variant: "destructive",
              });
            }, 30000); // 30 second timeout
            
            window.location.href = edgeFunctionUrl;
            
            // Clear timeout if we get here (though we probably won't due to redirect)
            clearTimeout(timeoutId);
            return;
            
          } catch (error: any) {
            console.error('Error redirecting to edge function:', error);
            setStatus('error');
            setMessage('Failed to process authorization code.');
            
            toast({
              title: "Processing Error",
              description: "Failed to process authorization code.",
              variant: "destructive",
            });

            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({
                  type: "oauth_error",
                  platform: activePlatform,
                  error: "Processing failed"
                }, window.location.origin);
                setTimeout(() => {
                  if (!window.closed) window.close();
                }, 3000);
              } catch (error) {
                console.error('Error posting error message to opener:', error);
                setTimeout(() => {
                  if (!window.closed) window.close();
                }, 3000);
              }
            } else {
              setTimeout(() => navigate("/settings"), 3000);
            }
            return;
          }
        }

        // Handle Supabase Auth callback (if using Supabase OAuth)
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Supabase auth error:', error);
            setStatus('error');
            let errorMessage = 'Authentication failed. Please try again.';

            // Provide more specific error messages
            if (error.message.includes('invalid_grant')) {
              errorMessage = 'Authorization expired. Please try connecting again.';
            } else if (error.message.includes('access_denied')) {
              errorMessage = 'Access was denied. Please grant permissions and try again.';
            } else if (error.message.includes('invalid_client')) {
              errorMessage = 'App configuration error. Please contact support.';
            } else if (error.message.includes('Missing required parameters')) {
              errorMessage = 'Connection interrupted. Please try again.';
            }

            setMessage(errorMessage);

            toast({
              title: "Authentication Error",
              description: errorMessage,
              variant: "destructive",
            });

            if (window.opener) {
              window.opener.postMessage({ 
                type: "oauth_error", 
                platform: activePlatform, 
                error: error.message 
              }, "*");
              setTimeout(() => window.close(), 3000);
            } else {
              setTimeout(() => navigate("/settings"), 3000);
            }
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage(`Successfully authenticated with ${activePlatform}!`);
            
            toast({
              title: "Connected successfully!",
              description: `Your ${activePlatform} account has been connected.`,
            });

            if (window.opener) {
              window.opener.postMessage({ 
                type: "oauth_success", 
                platform: activePlatform 
              }, "*");
              setTimeout(() => window.close(), 1500);
            } else {
              setTimeout(() => navigate("/settings"), 1500);
            }
            return;
          }
        } catch (sessionError: any) {
          console.error('Error getting session:', sessionError);
          setStatus('error');
          setMessage('Failed to verify session. Please try again.');
          
          if (window.opener) {
            window.opener.postMessage({ 
              type: "oauth_error", 
              platform: activePlatform, 
              error: "Session verification failed" 
            }, "*");
            setTimeout(() => window.close(), 3000);
          } else {
            setTimeout(() => navigate("/settings"), 3000);
          }
          return;
        }

        // If we get here, something unexpected happened
        setStatus('error');
        setMessage('OAuth flow incomplete. Please try connecting again.');
        
        console.warn("OAuth flow completed but no clear success/error state");
        toast({
          title: "OAuth Flow Incomplete",
          description: "Please try connecting again.",
          variant: "destructive",
        });

        if (window.opener) {
          window.opener.postMessage({ 
            type: "oauth_error", 
            platform: activePlatform, 
            error: "OAuth flow incomplete" 
          }, "*");
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => navigate("/settings"), 3000);
        }

      } catch (error: any) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setMessage('Failed to process authentication callback.');
        
        toast({
          title: "Processing Error",
          description: error.message || "Failed to process authentication callback.",
          variant: "destructive",
        });

        if (window.opener) {
          window.opener.postMessage({ 
            type: "oauth_error", 
            platform: platform || 'unknown', 
            error: error.message || "Processing failed" 
          }, "*");
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => navigate("/settings"), 3000);
        }
      }
    };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Processing...</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Success!</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">
              {window.opener ? 'Closing window...' : 'Redirecting you back to settings...'}
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => window.opener ? window.close() : navigate("/settings")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              {window.opener ? 'Close Window' : 'Return to Settings'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
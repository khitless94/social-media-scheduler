import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ensureAuthenticated } from '@/utils/authenticatedRequest';

interface AuthStatus {
  isAuthenticated: boolean;
  sessionValid: boolean;
  userId?: string;
  email?: string;
  lastCheck: Date;
  error?: string;
}

export function AuthStatusIndicator() {
  const { user, session, loading } = useAuth();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const checkAuthStatus = async () => {
    setChecking(true);
    try {
      const authResult = await ensureAuthenticated();
      
      if (authResult) {
        setAuthStatus({
          isAuthenticated: true,
          sessionValid: true,
          userId: authResult.user.id,
          email: authResult.user.email,
          lastCheck: new Date()
        });
      } else {
        setAuthStatus({
          isAuthenticated: false,
          sessionValid: false,
          lastCheck: new Date(),
          error: 'Authentication failed'
        });
      }
    } catch (error: any) {
      setAuthStatus({
        isAuthenticated: false,
        sessionValid: false,
        lastCheck: new Date(),
        error: error.message
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      checkAuthStatus();
    }
  }, [user, session, loading]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!authStatus) {
    return null;
  }

  const getStatusIcon = () => {
    if (authStatus.isAuthenticated && authStatus.sessionValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (authStatus.isAuthenticated && authStatus.sessionValid) {
      return <Badge className="bg-green-100 text-green-700">Authenticated</Badge>;
    } else {
      return <Badge variant="destructive">Not Authenticated</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium text-sm">Authentication Status</span>
            </div>
            {getStatusBadge()}
          </div>
          
          {authStatus.isAuthenticated ? (
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">User ID:</span> {authStatus.userId?.slice(0, 8)}...
              </div>
              <div>
                <span className="font-medium">Email:</span> {authStatus.email}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {authStatus.error && (
                <div className="flex items-start space-x-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{authStatus.error}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">
              Last checked: {authStatus.lastCheck.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAuthStatus}
              disabled={checking}
              className="h-7 px-2 text-xs"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthStatusIndicator;

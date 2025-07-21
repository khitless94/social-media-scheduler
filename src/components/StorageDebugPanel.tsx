import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { runFullDiagnostic, getSetupInstructions, DiagnosticResult } from '@/utils/storageDebug';
import AuthStatusIndicator from '@/components/AuthStatusIndicator';

interface DiagnosticResults {
  auth: DiagnosticResult;
  bucket: DiagnosticResult;
  upload: DiagnosticResult;
  overall: DiagnosticResult;
}

export function StorageDebugPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await runFullDiagnostic();
      setResults(diagnosticResults);
    } catch (error) {
      // Diagnostic failed - handled silently
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="ml-2">
        {success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Storage & Authentication Diagnostic
        </CardTitle>
        <CardDescription>
          Use this tool to diagnose image upload issues and get setup instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Current Authentication Status</h4>
          <AuthStatusIndicator />
        </div>

        <Button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            'Run Diagnostic'
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert variant={results.overall.success ? "default" : "destructive"}>
              <AlertDescription className="flex items-center justify-between">
                <span>{results.overall.message}</span>
                {getStatusIcon(results.overall.success)}
              </AlertDescription>
            </Alert>

            {/* Individual Test Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Authentication Check</h4>
                  <p className="text-sm text-gray-600">{results.auth.message}</p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(results.auth.success)}
                  {getStatusBadge(results.auth.success)}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Storage Bucket Check</h4>
                  <p className="text-sm text-gray-600">{results.bucket.message}</p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(results.bucket.success)}
                  {getStatusBadge(results.bucket.success)}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Upload Test</h4>
                  <p className="text-sm text-gray-600">{results.upload.message}</p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(results.upload.success)}
                  {getStatusBadge(results.upload.success)}
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            {!results.overall.success && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Setup Instructions:</h4>
                <div className="space-y-2">
                  {getSetupInstructions(results).map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono text-gray-600">{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Quick Actions:</h4>
              <div className="space-y-2 text-sm">
                <p>• Copy and run the <code className="bg-white px-1 rounded">setup-storage.sql</code> script in your Supabase SQL Editor</p>
                <p>• Make sure you're logged in to the application</p>
                <p>• Check your Supabase project settings and storage configuration</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StorageDebugPanel;

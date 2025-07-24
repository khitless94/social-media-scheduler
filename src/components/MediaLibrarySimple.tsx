import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FolderPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function MediaLibrarySimple() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚀 Upload button clicked!');
    setShowUploadDialog(true);
    toast({
      title: "Upload dialog opened",
      description: "This is working correctly!",
    });
  };

  const handleFolderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🗂️ Folder button clicked!');
    setShowCreateFolder(true);
    toast({
      title: "Folder dialog opened",
      description: "This is working correctly!",
    });
  };

  const createFolder = () => {
    console.log('Creating folder:', newFolderName);
    toast({
      title: "Folder would be created",
      description: `Folder name: ${newFolderName}`,
    });
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Media Library - Simple Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Test Upload and Folder Buttons</h2>
                <p className="text-gray-600 mt-1">Click the buttons below to test functionality</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleFolderClick}
                  type="button"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
                
                <Button
                  onClick={handleUploadClick}
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Upload Dialog Open:</strong> {showUploadDialog ? 'Yes' : 'No'}</p>
              <p><strong>Create Folder Dialog Open:</strong> {showCreateFolder ? 'Yes' : 'No'}</p>
              <p><strong>Folder Name:</strong> {newFolderName || 'Empty'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Direct State Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Direct state change - upload');
                  setShowUploadDialog(true);
                }}
              >
                Direct Open Upload
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Direct state change - folder');
                  setShowCreateFolder(true);
                }}
              >
                Direct Open Folder
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Closing all dialogs');
                  setShowUploadDialog(false);
                  setShowCreateFolder(false);
                }}
              >
                Close All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createFolder();
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Test Dialog
              </h3>
              <p className="text-gray-600 mb-4">
                This dialog opened successfully!
              </p>
              <Button onClick={() => setShowUploadDialog(false)}>
                Close Dialog
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

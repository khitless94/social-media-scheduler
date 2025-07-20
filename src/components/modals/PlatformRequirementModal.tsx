import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Share2 } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa';

interface PlatformRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | null;
  onContinue: () => void;
}

const PlatformRequirementModal: React.FC<PlatformRequirementModalProps> = ({
  isOpen,
  onClose,
  platform,
  onContinue
}) => {
  const platformConfig = {
    instagram: {
      name: 'Instagram',
      icon: FaInstagram,
      color: 'bg-pink-600',
      requirements: [
        'Account must be a business account',
        'Account must be connected to a Facebook business page',
        'Account must have admin permissions',
        'Account must meet Instagram business requirements'
      ]
    },
    facebook: {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-blue-600',
      requirements: [
        'Account must be a business account',
        'Account must have a Facebook page associated',
        'Account must have admin permissions for the page',
        'Account must comply with Facebook\'s business policies'
      ]
    },
    linkedin: {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'bg-blue-700',
      requirements: [
        'Account must have permissions to manage company pages',
        'Account must have appropriate admin access',
        'Account must comply with LinkedIn\'s business policies'
      ]
    },
    twitter: {
      name: 'X (Twitter)',
      icon: FaTwitter,
      color: 'bg-slate-800',
      requirements: [
        'Account must have API access enabled',
        'Account must comply with X\'s developer policies',
        'Account must have appropriate permissions',
        'Account must be verified for business use'
      ]
    }
  };

  // Safety check for platform
  if (!platform || !platformConfig[platform]) {
    return null;
  }

  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shadow-lg`}>
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Connect {config.name}
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl ${config.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">
              Before connecting, please ensure your {config.name} account meets these requirements:
            </p>
          </div>

          <div className="space-y-3">
            {config.requirements.map((requirement, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {requirement}
                </p>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onContinue}
              className={`flex-1 text-white font-semibold ${config.color} hover:opacity-90 transition-opacity`}
            >
              Continue to Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformRequirementModal;

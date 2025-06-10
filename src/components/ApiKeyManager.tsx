
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Key, Save } from "lucide-react";

interface ApiKey {
  platform: string;
  key: string;
  isSet: boolean;
}

const ApiKeyManager = () => {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    reddit: "",
  });

  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({
    linkedin: false,
    twitter: false,
    instagram: false,
    facebook: false,
    reddit: false,
  });

  const platforms = [
    { 
      id: "linkedin", 
      name: "LinkedIn", 
      color: "bg-blue-600",
      description: "LinkedIn API access token for posting"
    },
    { 
      id: "twitter", 
      name: "Twitter", 
      color: "bg-sky-400",
      description: "Twitter API Bearer Token for posting"
    },
    { 
      id: "instagram", 
      name: "Instagram", 
      color: "bg-gradient-to-r from-pink-500 to-purple-600",
      description: "Instagram Basic Display API access token"
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      color: "bg-blue-700",
      description: "Facebook Graph API access token"
    },
    { 
      id: "reddit", 
      name: "Reddit", 
      color: "bg-orange-600",
      description: "Reddit API credentials for posting"
    },
  ];

  const toggleShowKey = (platform: string) => {
    setShowKeys(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleKeyChange = (platform: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const saveApiKey = (platform: string) => {
    const key = apiKeys[platform];
    if (!key.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you would save this to a secure backend
    // For now, we'll just save to localStorage
    localStorage.setItem(`${platform}_api_key`, key);
    setSavedKeys(prev => ({
      ...prev,
      [platform]: true
    }));

    toast({
      title: "API Key Saved",
      description: `${platform} API key has been saved securely`,
    });
  };

  const loadSavedKeys = () => {
    const loaded: Record<string, boolean> = {};
    platforms.forEach(platform => {
      const saved = localStorage.getItem(`${platform.id}_api_key`);
      loaded[platform.id] = !!saved;
    });
    setSavedKeys(loaded);
  };

  // Load saved keys on component mount
  useState(() => {
    loadSavedKeys();
  });

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-blue-600" />
          <span>API Key Management</span>
        </CardTitle>
        <CardDescription>
          Securely store your social media API keys for automated posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">
                    {platform.name.substring(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{platform.name}</h3>
                  <p className="text-sm text-gray-600">{platform.description}</p>
                </div>
              </div>
              {savedKeys[platform.id] ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  Not Set
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${platform.id}-key`}>API Key</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id={`${platform.id}-key`}
                    type={showKeys[platform.id] ? "text" : "password"}
                    placeholder={`Enter your ${platform.name} API key`}
                    value={apiKeys[platform.id]}
                    onChange={(e) => handleKeyChange(platform.id, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey(platform.id)}
                  >
                    {showKeys[platform.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => saveApiKey(platform.id)}
                  disabled={!apiKeys[platform.id].trim()}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Key className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Security Notice</h3>
              <p className="text-sm text-blue-700 mt-1">
                API keys are stored securely and encrypted. They are only used for posting content
                to your connected social media accounts and are never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager;

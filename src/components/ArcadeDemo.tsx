import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles, Wand2, Calendar, BarChart } from "lucide-react";

interface ArcadeDemoProps {
  demoId?: string;
  onFallbackClick?: () => void;
}

const ArcadeDemo: React.FC<ArcadeDemoProps> = ({ 
  demoId = "scribeschedule-demo", 
  onFallbackClick 
}) => {
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is where Arcade.software script will be integrated
    // For now, we'll just set up the container
    
    // Example of how Arcade integration might work:
    // if (window.Arcade && demoId) {
    //   window.Arcade.init({
    //     containerId: demoId,
    //     demoUrl: 'your-arcade-demo-url',
    //     options: {
    //       autoplay: false,
    //       showControls: true,
    //       responsive: true
    //     }
    //   });
    // }
  }, [demoId]);

  return (
    <div className="max-w-6xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">See ScribeSchedule in action</h3>
        <p className="text-lg text-gray-600">Experience our intuitive dashboard and powerful features</p>
      </div>
      
      <div className="relative">
        {/* Demo Container - Ready for Arcade.software integration */}
        <div 
          ref={demoRef}
          id={demoId}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-h-[600px] flex items-center justify-center"
          style={{ aspectRatio: '16/10' }}
        >
          {/* Placeholder content - will be replaced by Arcade demo */}
          <div className="text-center p-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Interactive Demo</h4>
              <p className="text-gray-600 mb-6">
                Click to explore ScribeSchedule's powerful features including AI content creation, 
                multi-platform scheduling, and analytics dashboard.
              </p>
              <Button 
                className="btn-primary" 
                onClick={onFallbackClick}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
        
        {/* Demo overlay with browser chrome */}
        <div className="absolute top-0 left-0 right-0 bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center space-x-3 rounded-t-2xl">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-500">app.scribeschedule.com</div>
          <div className="ml-auto">
            <Badge className="bg-green-100 text-green-700 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Live Demo
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Demo Features Highlight */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wand2 className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">AI Content Creation</h4>
          <p className="text-sm text-gray-600">Watch how AI generates engaging posts in seconds</p>
        </div>
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h4>
          <p className="text-sm text-gray-600">See optimal timing recommendations in action</p>
        </div>
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BarChart className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
          <p className="text-sm text-gray-600">Explore real-time performance insights</p>
        </div>
      </div>
    </div>
  );
};

export default ArcadeDemo;

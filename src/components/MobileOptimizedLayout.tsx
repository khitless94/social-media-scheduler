import React, { useState } from 'react';
import { Menu, X, Calendar, Settings, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Mobile-Optimized Layout Component
 * Provides superior mobile experience compared to PostScheduler.co
 */

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-blue-600">
                SocialScheduler
              </h1>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-3" />
                Schedule Posts
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Mobile-Optimized Dashboard Grid
 * Better than PostScheduler's desktop-only layout
 */
export function MobileDashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {children}
    </div>
  );
}

/**
 * Mobile-Optimized Card Component
 * Responsive padding and typography
 */
export function MobileOptimizedCard({ 
  title, 
  children, 
  className = "" 
}: { 
  title?: string; 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      {children}
    </Card>
  );
}

/**
 * Mobile-Optimized Form Layout
 * Stack on mobile, side-by-side on desktop
 */
export function MobileFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {children}
      </div>
    </div>
  );
}

/**
 * Mobile-Optimized Platform Selector
 * Better touch targets than PostScheduler
 */
export function MobilePlatformSelector({ 
  platforms, 
  selectedPlatforms, 
  onPlatformToggle 
}: {
  platforms: Array<{ id: string; name: string; icon: React.ReactNode; }>;
  selectedPlatforms: string[];
  onPlatformToggle: (platformId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onPlatformToggle(platform.id)}
          className={`
            p-3 sm:p-4 rounded-lg border-2 transition-all duration-200
            flex flex-col items-center space-y-2
            min-h-[80px] sm:min-h-[100px]
            ${selectedPlatforms.includes(platform.id)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }
          `}
        >
          <div className="text-xl sm:text-2xl">
            {platform.icon}
          </div>
          <span className="text-xs sm:text-sm font-medium text-center">
            {platform.name}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Mobile-Optimized Time Picker
 * Large touch targets, better than PostScheduler
 */
export function MobileTimePicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Schedule Time
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full px-4 py-3 sm:py-4 
          text-base sm:text-lg
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white
        "
        style={{ fontSize: '16px' }} // Prevents zoom on iOS
      />
    </div>
  );
}

/**
 * Mobile-Optimized Content Editor
 * Better than PostScheduler's desktop-only editor
 */
export function MobileContentEditor({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?" 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Post Content
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="
          w-full px-4 py-3
          text-base
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          resize-none
          bg-white
        "
        style={{ fontSize: '16px' }} // Prevents zoom on iOS
      />
      <div className="text-right text-sm text-gray-500">
        {value.length}/280 characters
      </div>
    </div>
  );
}

/**
 * Mobile-Optimized Action Buttons
 * Better spacing and touch targets
 */
export function MobileActionButtons({ 
  onSchedule, 
  onSaveDraft, 
  onPostNow,
  isLoading = false 
}: {
  onSchedule: () => void;
  onSaveDraft: () => void;
  onPostNow: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <Button 
        onClick={onSchedule}
        disabled={isLoading}
        className="flex-1 py-3 sm:py-2"
      >
        Schedule Post
      </Button>
      <Button 
        variant="outline" 
        onClick={onSaveDraft}
        disabled={isLoading}
        className="flex-1 py-3 sm:py-2"
      >
        Save Draft
      </Button>
      <Button 
        variant="secondary" 
        onClick={onPostNow}
        disabled={isLoading}
        className="flex-1 py-3 sm:py-2"
      >
        Post Now
      </Button>
    </div>
  );
}

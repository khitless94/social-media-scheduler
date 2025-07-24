import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'purple' | 'blue' | 'green' | 'orange';
  className?: string;
}

const gradientVariants = {
  default: 'from-slate-50 via-blue-50 to-indigo-100',
  purple: 'from-purple-50 via-pink-50 to-indigo-100',
  blue: 'from-blue-50 via-cyan-50 to-teal-100',
  green: 'from-green-50 via-emerald-50 to-teal-100',
  orange: 'from-orange-50 via-amber-50 to-yellow-100'
};

export function GradientBackground({ 
  children, 
  variant = 'default', 
  className = '' 
}: GradientBackgroundProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientVariants[variant]} ${className}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default GradientBackground;

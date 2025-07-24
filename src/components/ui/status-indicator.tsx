import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, X, AlertCircle, Loader2 } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    text: 'Connected'
  },
  disconnected: {
    icon: X,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    text: 'Disconnected'
  },
  error: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    text: 'Error'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    text: 'Loading'
  }
};

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    container: 'w-6 h-6',
    text: 'text-xs'
  },
  md: {
    icon: 'w-4 h-4',
    container: 'w-8 h-8',
    text: 'text-sm'
  },
  lg: {
    icon: 'w-5 h-5',
    container: 'w-10 h-10',
    text: 'text-base'
  }
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showText = false, 
  className = '' 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  if (showText) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className={cn(
          'rounded-full flex items-center justify-center',
          config.bgColor,
          sizes.container
        )}>
          <Icon className={cn(
            sizes.icon,
            config.color,
            status === 'loading' && 'animate-spin'
          )} />
        </div>
        <span className={cn(sizes.text, config.color, 'font-medium')}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center',
      config.bgColor,
      sizes.container,
      className
    )}>
      <Icon className={cn(
        sizes.icon,
        config.color,
        status === 'loading' && 'animate-spin'
      )} />
    </div>
  );
}

export default StatusIndicator;

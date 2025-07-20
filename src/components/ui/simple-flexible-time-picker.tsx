import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SimpleFlexibleTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  className?: string;
  placeholder?: string;
}

/**
 * Simple Flexible Time Picker - Reliable implementation
 * Allows users to select ANY specific time like PostScheduler.co
 */
export function SimpleFlexibleTimePicker({
  value,
  onChange,
  minDate = new Date(),
  className = "",
  placeholder = "Select date and time"
}: SimpleFlexibleTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize with current value or default
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) return value.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  });
  
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '12:00';
  });

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value.toISOString().split('T')[0]);
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [value]);

  // Update parent when date or time changes
  const updateDateTime = (newDate?: string, newTime?: string) => {
    const dateStr = newDate || selectedDate;
    const timeStr = newTime || selectedTime;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateTime = new Date(dateStr);
    dateTime.setHours(hours, minutes, 0, 0);
    
    console.log('🕐 SimpleFlexibleTimePicker updating:', {
      dateStr,
      timeStr,
      hours,
      minutes,
      resultDateTime: dateTime.toISOString(),
      resultLocal: dateTime.toLocaleString()
    });
    
    onChange(dateTime);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    updateDateTime(newDate, selectedTime);
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    updateDateTime(selectedDate, newTime);
  };

  // Quick time presets
  const quickTimes = [
    { label: 'Now', time: new Date() },
    { label: '9:00 AM', time: '09:00' },
    { label: '12:00 PM', time: '12:00' },
    { label: '3:00 PM', time: '15:00' },
    { label: '6:00 PM', time: '18:00' },
    { label: '9:00 PM', time: '21:00' }
  ];

  const setQuickTime = (quickTime: any) => {
    if (quickTime.time instanceof Date) {
      // "Now" option
      const now = quickTime.time;
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
      updateDateTime(dateStr, timeStr);
    } else {
      // Preset times
      setSelectedTime(quickTime.time);
      updateDateTime(selectedDate, quickTime.time);
    }
  };

  const formatDisplayDateTime = () => {
    if (!value) return placeholder;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return value.toLocaleDateString('en-US', options);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDisplayDateTime()}
        <ChevronDown className="ml-auto h-4 w-4" />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 p-4 shadow-lg border">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Select Date & Time</h3>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={minDate.toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Time Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            {/* Quick Time Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Quick Times</label>
              <div className="grid grid-cols-3 gap-2">
                {quickTimes.map((quickTime, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickTime(quickTime)}
                    className="text-xs h-8"
                  >
                    {quickTime.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {value && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Will post at:</div>
                <div className="text-sm font-semibold text-green-800">
                  {formatDisplayDateTime()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Confirm
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Alternative native datetime-local input (most reliable)
 */
export function NativeFlexibleTimePicker({
  value,
  onChange,
  minDate = new Date(),
  className = "",
  placeholder = "Select date and time"
}: SimpleFlexibleTimePickerProps) {
  // Format date for datetime-local input
  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatMinDate = (date: Date) => {
    return formatForInput(date);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    console.log('🕐 NativeFlexibleTimePicker updating:', {
      inputValue: e.target.value,
      resultDateTime: newDate.toISOString(),
      resultLocal: newDate.toLocaleString()
    });
    onChange(newDate);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">
        Schedule Date & Time
      </label>
      <input
        type="datetime-local"
        value={value ? formatForInput(value) : ''}
        onChange={handleChange}
        min={formatMinDate(minDate)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ fontSize: '16px' }} // Prevents zoom on iOS
      />
      <div className="text-xs text-gray-500">
        🎯 Select ANY specific time with flexible scheduling
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PostSchedulerDateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  className?: string;
  placeholder?: string;
}

/**
 * PostScheduler-style DateTime Picker
 * Allows precise time selection like PostScheduler.co
 */
export function PostSchedulerDateTimePicker({
  value,
  onChange,
  minDate = new Date(),
  className = "",
  placeholder = "Select date and time"
}: PostSchedulerDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [hours, setHours] = useState(value ? value.getHours() : new Date().getHours());
  const [minutes, setMinutes] = useState(value ? value.getMinutes() : new Date().getMinutes());

  // Calendar state
  const [viewDate, setViewDate] = useState(value || new Date());

  useEffect(() => {
    if (value) {
      setCurrentDate(value);
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
      setViewDate(value);
    }
  }, [value]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isPast = date < minDate;

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isPast
      });
    }

    return days;
  };

  const updateDateTime = (newHours?: number, newMinutes?: number) => {
    const h = newHours !== undefined ? newHours : hours;
    const m = newMinutes !== undefined ? newMinutes : minutes;
    const newDate = new Date(selectedDate);
    newDate.setHours(h, m, 0, 0);
    onChange(newDate);
  };

  const selectDate = (date: Date) => {
    if (date < minDate) return;
    setSelectedDate(date);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + (direction === 'next' ? 1 : -1));
    setViewDate(newDate);
  };

  // Quick date presets
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  ];

  // Quick time presets
  const quickTimes = [
    { label: 'Now', hours: new Date().getHours(), minutes: new Date().getMinutes() },
    { label: '9:00 AM', hours: 9, minutes: 0 },
    { label: '12:00 PM', hours: 12, minutes: 0 },
    { label: '3:00 PM', hours: 15, minutes: 0 },
    { label: '6:00 PM', hours: 18, minutes: 0 },
    { label: '9:00 PM', hours: 21, minutes: 0 }
  ];

  const setQuickTime = (quickTime: any) => {
    setHours(quickTime.hours);
    setMinutes(quickTime.minutes);
    const newDate = new Date(selectedDate);
    newDate.setHours(quickTime.hours, quickTime.minutes, 0, 0);
    onChange(newDate);
  };

  const formatDisplayDateTime = () => {
    if (!value) return placeholder;
    const date = value.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const time = value.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${date} at ${time}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDisplayDateTime()}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Schedule Post</h3>
            </div>
            <div className="text-xs text-gray-500">
              Like PostScheduler.co
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex space-x-2">
            {quickDates.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => selectDate(preset.date)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h4 className="font-medium">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => selectDate(day.date)}
                  disabled={day.isPast}
                  className={cn(
                    "p-2 text-sm rounded-md transition-colors",
                    day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                    day.isToday && "bg-blue-100 text-blue-600 font-medium",
                    day.isSelected && "bg-blue-600 text-white",
                    day.isPast && "opacity-50 cursor-not-allowed",
                    !day.isPast && !day.isSelected && "hover:bg-gray-100"
                  )}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Select Time</h4>
            
            {/* Quick Times */}
            <div className="grid grid-cols-3 gap-2">
              {quickTimes.map((time, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(time)}
                  className="text-xs"
                >
                  {time.label}
                </Button>
              ))}
            </div>

            {/* Manual Time Input */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="text-xs text-gray-600">Hour</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => {
                    const newHours = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                    setHours(newHours);
                    updateDateTime(newHours, minutes);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600">Minute</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setMinutes(newMinutes);
                    updateDateTime(hours, newMinutes);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Will be posted:</div>
            <div className="text-sm font-semibold text-green-800">
              {formatDisplayDateTime()}
            </div>
          </div>

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
              Schedule
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

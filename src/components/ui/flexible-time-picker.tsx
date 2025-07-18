import React, { useState, useEffect } from 'react';
import { Clock, Calendar, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FlexibleTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  className?: string;
  placeholder?: string;
}

/**
 * Flexible Time Picker - Like PostScheduler.co
 * Allows users to select ANY specific time (not limited to intervals)
 */
export function FlexibleTimePicker({
  value,
  onChange,
  minDate = new Date(),
  className = "",
  placeholder = "Select date and time"
}: FlexibleTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [hours, setHours] = useState(value ? value.getHours() : 12);
  const [minutes, setMinutes] = useState(value ? value.getMinutes() : 0);
  const [ampm, setAmpm] = useState(value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'PM');

  // Update internal state when value changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
      setAmpm(value.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  // Convert 12-hour to 24-hour format
  const get24Hour = (hour12: number, period: string) => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  // Update the final date/time
  const updateDateTime = (newHours?: number, newMinutes?: number, newAmPm?: string) => {
    const h = newHours !== undefined ? newHours : hours;
    const m = newMinutes !== undefined ? newMinutes : minutes;
    const period = newAmPm !== undefined ? newAmPm : ampm;
    
    const hour24 = get24Hour(h, period);
    const newDate = new Date(selectedDate);
    newDate.setHours(hour24, m, 0, 0);
    
    onChange(newDate);
  };

  // Increment/decrement functions
  const adjustHours = (increment: boolean) => {
    let newHours = increment ? hours + 1 : hours - 1;
    if (newHours > 12) newHours = 1;
    if (newHours < 1) newHours = 12;
    setHours(newHours);
    updateDateTime(newHours);
  };

  const adjustMinutes = (increment: boolean) => {
    let newMinutes = increment ? minutes + 1 : minutes - 1;
    if (newMinutes > 59) newMinutes = 0;
    if (newMinutes < 0) newMinutes = 59;
    setMinutes(newMinutes);
    updateDateTime(undefined, newMinutes);
  };

  const toggleAmPm = () => {
    const newAmPm = ampm === 'AM' ? 'PM' : 'AM';
    setAmpm(newAmPm);
    updateDateTime(undefined, undefined, newAmPm);
  };

  // Quick time presets (like PostScheduler)
  const quickTimes = [
    { label: 'Now', time: new Date() },
    { label: '9:00 AM', hours: 9, minutes: 0, ampm: 'AM' },
    { label: '12:00 PM', hours: 12, minutes: 0, ampm: 'PM' },
    { label: '3:00 PM', hours: 3, minutes: 0, ampm: 'PM' },
    { label: '6:00 PM', hours: 6, minutes: 0, ampm: 'PM' },
    { label: '9:00 PM', hours: 9, minutes: 0, ampm: 'PM' }
  ];

  const setQuickTime = (quickTime: any) => {
    if (quickTime.time) {
      // "Now" option
      const now = new Date();
      setSelectedDate(now);
      setHours(now.getHours() > 12 ? now.getHours() - 12 : now.getHours() || 12);
      setMinutes(now.getMinutes());
      setAmpm(now.getHours() >= 12 ? 'PM' : 'AM');
      onChange(now);
    } else {
      // Preset times
      setHours(quickTime.hours);
      setMinutes(quickTime.minutes);
      setAmpm(quickTime.ampm);
      updateDateTime(quickTime.hours, quickTime.minutes, quickTime.ampm);
    }
  };

  const formatDisplayTime = () => {
    const date = selectedDate.toLocaleDateString();
    const time = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    return `${date} at ${time}`;
  };

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
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatDisplayTime() : placeholder}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm">Schedule Time</h3>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(get24Hour(hours, ampm), minutes, 0, 0);
                setSelectedDate(newDate);
                onChange(newDate);
              }}
              min={minDate.toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Time Selection - Flexible Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Time</label>
            <div className="flex items-center space-x-2">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustHours(true)}
                  className="h-6 w-8 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={hours}
                  onChange={(e) => {
                    const newHours = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                    setHours(newHours);
                    updateDateTime(newHours);
                  }}
                  className="w-12 text-center border border-gray-300 rounded text-sm py-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustHours(false)}
                  className="h-6 w-8 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <span className="text-lg font-bold">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustMinutes(true)}
                  className="h-6 w-8 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes.toString().padStart(2, '0')}
                  onChange={(e) => {
                    const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setMinutes(newMinutes);
                    updateDateTime(undefined, newMinutes);
                  }}
                  className="w-12 text-center border border-gray-300 rounded text-sm py-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustMinutes(false)}
                  className="h-6 w-8 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <Button
                  variant={ampm === 'AM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAmPm}
                  className="h-8 w-12 text-xs"
                >
                  {ampm}
                </Button>
              </div>
            </div>
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
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Scheduled for:</div>
            <div className="text-sm font-semibold text-blue-800">
              {formatDisplayTime()}
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
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

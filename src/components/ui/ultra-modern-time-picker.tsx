import * as React from "react";
import { useState, useEffect } from "react";
import { Clock, Sunrise, Sun, Sunset, Moon, Zap, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface UltraModernTimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  placeholder?: string;
}

export function UltraModernTimePicker({
  value = "09:00",
  onChange,
  className,
  placeholder = "Select time"
}: UltraModernTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(() => {
    if (value) {
      return parseInt(value.split(':')[0]) || 9;
    }
    return 9;
  });
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      return parseInt(value.split(':')[1]) || 0;
    }
    return 0;
  });

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHours(h || 9);
      setMinutes(m || 0);
    }
  }, [value]);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatTime12Hour = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeSelect = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    const timeString = formatTime(newHours, newMinutes);
    onChange?.(timeString);
    setIsOpen(false);
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return <Sunrise className="h-3 w-3" />;
    if (hour >= 12 && hour < 18) return <Sun className="h-3 w-3" />;
    if (hour >= 18 && hour < 21) return <Sunset className="h-3 w-3" />;
    return <Moon className="h-3 w-3" />;
  };

  const getTimeCategory = (hour: number) => {
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 18) return "Afternoon";
    if (hour >= 18 && hour < 21) return "Evening";
    return "Night";
  };

  const popularTimes = [
    { h: 8, m: 0, label: "8:00 AM", category: "Morning Start" },
    { h: 9, m: 0, label: "9:00 AM", category: "Work Hours" },
    { h: 12, m: 0, label: "12:00 PM", category: "Lunch Time" },
    { h: 14, m: 0, label: "2:00 PM", category: "Peak Hours" },
    { h: 17, m: 0, label: "5:00 PM", category: "Rush Hour" },
    { h: 18, m: 0, label: "6:00 PM", category: "Prime Time" },
    { h: 20, m: 0, label: "8:00 PM", category: "Evening Peak" },
    { h: 21, m: 0, label: "9:00 PM", category: "Night Time" }
  ];

  // Generate time slots every 5 minutes for better granularity
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        slots.push({ hours: h, minutes: m });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal h-12 px-4 py-3",
            "border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
            "bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-white",
            "transition-all duration-300 ease-in-out shadow-sm hover:shadow-md",
            "rounded-xl group",
            className
          )}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {value ? formatTime12Hour(hours, minutes) : placeholder}
              </span>
              {value && (
                <span className="text-xs text-gray-500">
                  {getTimeCategory(hours)} • {formatTime(hours, minutes)}
                </span>
              )}
            </div>
          </div>
          {getTimeIcon(hours)}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-white shadow-2xl border-0 rounded-2xl overflow-hidden" 
        align="start"
        sideOffset={8}
      >
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Select Time</h3>
              <p className="text-blue-100 text-sm">Choose your perfect timing</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatTime12Hour(hours, minutes)}</div>
              <div className="text-blue-100 text-sm">{getTimeCategory(hours)}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Precise Time Adjustment */}
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-4">Precise Time</div>
            <div className="flex items-center justify-center space-x-6 bg-gray-50 rounded-xl p-4">
              {/* Hours */}
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHours = (hours + 1) % 24;
                    setHours(newHours);
                    onChange?.(formatTime(newHours, minutes));
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-3xl font-bold text-gray-900 w-16 text-center bg-white rounded-lg py-3 shadow-sm border">
                  {hours.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHours = (hours - 1 + 24) % 24;
                    setHours(newHours);
                    onChange?.(formatTime(newHours, minutes));
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 font-medium">Hours</span>
              </div>

              <div className="text-3xl font-bold text-gray-400">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMinutes = (minutes + 1) % 60;
                    setMinutes(newMinutes);
                    onChange?.(formatTime(hours, newMinutes));
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-3xl font-bold text-gray-900 w-16 text-center bg-white rounded-lg py-3 shadow-sm border">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMinutes = (minutes - 1 + 60) % 60;
                    setMinutes(newMinutes);
                    onChange?.(formatTime(hours, newMinutes));
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 font-medium">Minutes</span>
              </div>
            </div>
          </div>

          {/* Popular Times Grid */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-900">Popular Times</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {popularTimes.map((time) => {
                const isSelected = hours === time.h && minutes === time.m;
                return (
                  <Button
                    key={time.label}
                    variant="ghost"
                    onClick={() => handleTimeSelect(time.h, time.m)}
                    className={cn(
                      "h-16 p-3 flex flex-col items-start justify-center rounded-xl transition-all duration-200",
                      "border-2 hover:scale-105 transform",
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg"
                        : "bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getTimeIcon(time.h)}
                      <span className="font-semibold text-sm">{time.label}</span>
                    </div>
                    <span className={cn(
                      "text-xs",
                      isSelected ? "text-blue-100" : "text-gray-500"
                    )}>
                      {time.category}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* All Times Scrollable List */}
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">All Times</div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {timeSlots.map((slot) => {
                const timeString = formatTime(slot.hours, slot.minutes);
                const time12Hour = formatTime12Hour(slot.hours, slot.minutes);
                const isSelected = hours === slot.hours && minutes === slot.minutes;
                
                return (
                  <Button
                    key={timeString}
                    variant="ghost"
                    onClick={() => handleTimeSelect(slot.hours, slot.minutes)}
                    className={cn(
                      "w-full justify-between h-10 px-3 rounded-lg transition-all duration-150",
                      isSelected
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "hover:bg-blue-50 text-gray-700"
                    )}
                  >
                    <span className="font-medium">{time12Hour}</span>
                    <span className={cn(
                      "text-xs",
                      isSelected ? "text-blue-100" : "text-gray-500"
                    )}>
                      {timeString}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                handleTimeSelect(now.getHours(), now.getMinutes());
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
            >
              <Clock className="h-4 w-4 mr-2" />
              Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

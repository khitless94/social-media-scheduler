import * as React from "react";
import { useState } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ModernTimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  placeholder?: string;
}

export function ModernTimePicker({
  value = "09:00",
  onChange,
  className,
  placeholder = "Select time"
}: ModernTimePickerProps) {
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

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleTimeSelect = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    const timeString = formatTime(newHours, newMinutes);
    onChange?.(timeString);
    setIsOpen(false); // Auto-close when time is selected
  };

  const adjustHours = (increment: boolean) => {
    const newHours = increment 
      ? (hours + 1) % 24 
      : (hours - 1 + 24) % 24;
    setHours(newHours);
    const timeString = formatTime(newHours, minutes);
    onChange?.(timeString);
  };

  const adjustMinutes = (increment: boolean) => {
    const newMinutes = increment 
      ? (minutes + 15) % 60 
      : (minutes - 15 + 60) % 60;
    setMinutes(newMinutes);
    const timeString = formatTime(hours, newMinutes);
    onChange?.(timeString);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push({ hours: h, minutes: m });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-3 py-2",
            "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            "bg-white hover:bg-gray-50 transition-all duration-200",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-gray-500" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white shadow-xl border border-gray-200 rounded-xl" align="start">
        <div className="p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Select Time</h3>
          </div>

          {/* Time Selector */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            {/* Hours */}
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustHours(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-bold text-gray-900 w-12 text-center bg-blue-50 rounded-lg py-2">
                {hours.toString().padStart(2, '0')}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustHours(false)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-2xl font-bold text-gray-400">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustMinutes(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-bold text-gray-900 w-12 text-center bg-blue-50 rounded-lg py-2">
                {minutes.toString().padStart(2, '0')}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustMinutes(false)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Time Options */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Select</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { h: 9, m: 0, label: "9:00" },
                { h: 12, m: 0, label: "12:00" },
                { h: 15, m: 0, label: "15:00" },
                { h: 18, m: 0, label: "18:00" }
              ].map((time) => (
                <Button
                  key={time.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTimeSelect(time.h, time.m)}
                  className={cn(
                    "h-8 text-xs",
                    hours === time.h && minutes === time.m
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "hover:bg-blue-50 text-gray-600"
                  )}
                >
                  {time.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Scrollable Time List */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="text-xs font-medium text-gray-500 mb-2">All Times</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {timeOptions.map((time) => {
                const timeString = formatTime(time.hours, time.minutes);
                const isSelected = hours === time.hours && minutes === time.minutes;
                
                return (
                  <Button
                    key={timeString}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTimeSelect(time.hours, time.minutes)}
                    className={cn(
                      "w-full justify-start h-8 text-sm",
                      isSelected
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "hover:bg-blue-50 text-gray-600"
                    )}
                  >
                    {timeString}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                handleTimeSelect(now.getHours(), Math.floor(now.getMinutes() / 15) * 15);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
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

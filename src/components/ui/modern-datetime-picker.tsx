import * as React from "react";
import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UltraModernTimePicker } from "@/components/ui/ultra-modern-time-picker";

interface ModernDateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  showTime?: boolean;
}

export function ModernDateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  timeValue = "09:00",
  onTimeChange,
  showTime = true
}: ModernDateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get days from previous month to fill the grid
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  
  // Get days from next month to fill the grid
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateSelect = (date: Date) => {
    if (disabled && disabled(date)) return;
    onChange?.(date);
    // Always close the calendar when a date is selected
    setIsOpen(false);
  };

  const handleTimeChange = (time: string) => {
    onTimeChange?.(time);
    if (value && time) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(value);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange?.(newDate);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn("space-y-3", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-11 px-3 py-2",
              "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
              "bg-white hover:bg-gray-50 transition-all duration-200",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white shadow-xl border border-gray-200 rounded-xl" align="start">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = value && isSameDay(day, value);
                const isTodayDate = isToday(day);
                const isDisabled = disabled && disabled(day);

                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 p-0 font-normal text-sm transition-all duration-200",
                      !isCurrentMonth && "text-gray-400 hover:text-gray-600",
                      isCurrentMonth && "text-gray-900 hover:bg-gray-100",
                      isTodayDate && "bg-blue-50 text-blue-600 font-medium",
                      isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {format(day, "d")}
                  </Button>
                );
              })}
            </div>



            {/* Action buttons */}
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  handleDateSelect(today);
                  if (showTime) {
                    handleTimeChange(format(today, "HH:mm"));
                  }
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Today
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

      {/* Ultra Modern time picker when showTime is true */}
      {showTime && (
        <UltraModernTimePicker
          value={timeValue}
          onChange={handleTimeChange}
          placeholder="Select time"
          className="w-full mt-3"
        />
      )}
    </div>
  );
}

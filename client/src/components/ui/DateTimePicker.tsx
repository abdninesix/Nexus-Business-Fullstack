// src/components/ui/CustomDateTimePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfMinute } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside'; // Import the hook
import toast from 'react-hot-toast';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setIsOpen(false));

  useEffect(() => {
    // Sync the calendar month with the selected value if the picker is opened
    if (isOpen) {
      setCurrentMonth(value || new Date());
    }
  }, [isOpen, value]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateSelect = (day: Date) => {
    if (isBefore(day, startOfMinute(new Date()))) return;
    const newDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), value.getHours(), value.getMinutes());
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value: timeValue } = e.target;
    const newDate = new Date(value.getTime());
    let currentHours = newDate.getHours();

    if (name === 'hours') {
      const newHours = parseInt(timeValue, 10);
      // If AM/PM is PM and hour is not 12, add 12. If AM and hour is 12 (midnight), set to 0.
      const isPM = currentHours >= 12;
      if (isPM && newHours < 12) {
        newDate.setHours(newHours + 12);
      } else if (!isPM && newHours === 12) { // Special case for 12 AM (midnight)
        newDate.setHours(0);
      } else {
        newDate.setHours(newHours);
      }
    }
    if (name === 'minutes') {
      newDate.setMinutes(parseInt(timeValue, 10));
    }
    if (name === 'ampm') {
      const ampm = timeValue;
      if (ampm === 'PM' && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      } else if (ampm === 'AM' && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      }
    }
    if (isBefore(newDate, new Date())) {
      toast.error("Cannot select a time in the past.");
      return;
    }
    onChange(newDate);
  };

  // Get current hour in 12-hour format
  const current12Hour = value.getHours() % 12 || 12;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-start text-left font-normal border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
        {value ? format(value, 'MMM d, yyyy h:mm aa') : <span>Pick a date and time</span>}
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-sm">{format(currentMonth, 'MMMM yyyy')}</span>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronRight size={18} /></button>
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
            {daysOfWeek.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {calendarDays.map(day => {
              const isPast = isBefore(day, startOfMinute(new Date())) && !isSameDay(day, new Date());
              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isPast}
                  className={`w-full aspect-square text-sm rounded-full transition-colors 
                    ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : 'text-gray-800'}
                    ${isToday(day) && !isSameDay(day, value) ? 'border border-primary-500' : ''}
                    ${isSameDay(day, value) ? 'bg-primary-600 text-white' : ''}
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
          {/* Time Picker */}
          <div className="flex items-center justify-center space-x-2 pt-3 mt-3 border-t">
            <select name="hours" value={current12Hour} onChange={handleTimeChange} className="px-2 py-1 border rounded-md bg-transparent text-sm">
              {/* Generate hours from 1 to 12 */}
              {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
              ))}
            </select>
            <span>:</span>
            <select name="minutes" value={value.getMinutes()} onChange={handleTimeChange} className="px-2 py-1 border rounded-md bg-transparent text-sm">
              {Array.from({ length: 4 }, (_, i) => <option key={i * 15} value={i * 15}>{String(i * 15).padStart(2, '0')}</option>)}
            </select>
            {/* AM/PM Selector */}
            <select name="ampm" value={value.getHours() >= 12 ? 'PM' : 'AM'} onChange={handleTimeChange} className="px-2 py-1 border rounded-md bg-transparent text-sm">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
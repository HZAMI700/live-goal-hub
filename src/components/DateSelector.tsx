import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(subDays(new Date(), 3), i));
  
  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  const isSelected = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  return (
    <div className="flex items-center gap-2 py-3 px-4 overflow-x-auto scrollbar-hide">
      <Button 
        variant="ghost" 
        size="icon" 
        className="shrink-0 rounded-full"
        onClick={() => onDateChange(subDays(selectedDate, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex gap-2 flex-1 justify-center">
        {dates.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => onDateChange(date)}
            className={cn(
              'flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[60px]',
              isSelected(date) 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            <span className="text-xs font-medium uppercase">
              {isToday(date) ? 'Today' : format(date, 'EEE')}
            </span>
            <span className="text-lg font-bold">{format(date, 'd')}</span>
          </button>
        ))}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="shrink-0 rounded-full"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

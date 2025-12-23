import { MatchEvent } from '@/types/match';
import { Circle, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchEventsProps {
  events: MatchEvent[];
}

const EventIcon = ({ type }: { type: MatchEvent['type'] }) => {
  switch (type) {
    case 'goal':
      return <Circle className="w-4 h-4 fill-primary text-primary" />;
    case 'yellow_card':
      return <Square className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
    case 'red_card':
      return <Square className="w-4 h-4 fill-red-500 text-red-500" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
};

export const MatchEvents = ({ events }: MatchEventsProps) => {
  if (events.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <p className="text-muted-foreground">No events yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="font-bold text-lg mb-4">Match Events</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border" />
        
        <div className="space-y-4">
          {events.map((event) => (
            <div 
              key={event.id}
              className={cn(
                'flex items-center gap-3',
                event.team === 'home' ? 'flex-row' : 'flex-row-reverse'
              )}
            >
              <div className={cn(
                'flex-1',
                event.team === 'home' ? 'text-right' : 'text-left'
              )}>
                <p className="font-semibold text-sm">{event.playerName}</p>
                {event.assistPlayerName && (
                  <p className="text-xs text-muted-foreground">
                    Assist: {event.assistPlayerName}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-center w-12 relative z-10">
                <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                  <EventIcon type={event.type} />
                  <span className="text-xs font-bold">{event.minute}'</span>
                </div>
              </div>
              
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

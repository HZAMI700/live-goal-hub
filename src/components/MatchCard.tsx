import { forwardRef } from 'react';
import { Match } from '@/types/match';
import { LiveIndicator } from './LiveIndicator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface MatchCardProps {
  match: Match;
  showLeague?: boolean;
}

export const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
  ({ match, showLeague = false }, ref) => {
    const navigate = useNavigate();
    const isLive = match.status === 'LIVE' || match.status === 'HT';
    const isScheduled = match.status === 'SCHEDULED';

    const formatTime = (dateString: string) => {
      try {
        return format(new Date(dateString), 'HH:mm');
      } catch {
        return '--:--';
      }
    };

    return (
      <div 
        ref={ref}
        className="match-card cursor-pointer group"
        onClick={() => navigate(`/match/${match.id}`)}
      >
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 flex items-center gap-3">
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="team-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(match.homeTeam.shortName) + '&background=1a1f2e&color=22c55e&size=64';
              }}
            />
            <span className={cn(
              'font-semibold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px]',
              isLive && 'text-foreground',
              !isLive && 'text-muted-foreground'
            )}>
              {match.homeTeam.name}
            </span>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center gap-1 px-4 min-w-[80px]">
            {isScheduled ? (
              <span className="text-lg font-semibold text-muted-foreground">
                {formatTime(match.startTime)}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn(
                  'score-display',
                  isLive && 'text-foreground'
                )}>
                  {match.homeScore ?? '-'}
                </span>
                <span className="text-muted-foreground text-xl font-light">-</span>
                <span className={cn(
                  'score-display',
                  isLive && 'text-foreground'
                )}>
                  {match.awayScore ?? '-'}
                </span>
              </div>
            )}
            
            {!isScheduled && (
              <LiveIndicator 
                minute={match.minute} 
                status={match.status} 
              />
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center gap-3 justify-end">
            <span className={cn(
              'font-semibold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-right',
              isLive && 'text-foreground',
              !isLive && 'text-muted-foreground'
            )}>
              {match.awayTeam.name}
            </span>
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="team-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(match.awayTeam.shortName) + '&background=1a1f2e&color=22c55e&size=64';
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

MatchCard.displayName = 'MatchCard';

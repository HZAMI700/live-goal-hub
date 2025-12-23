import { forwardRef } from 'react';
import { League } from '@/types/match';
import { MatchCard } from './MatchCard';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeagueSectionProps {
  league: League;
}

export const LeagueSection = forwardRef<HTMLDivElement, LeagueSectionProps>(
  ({ league }, ref) => {
    const navigate = useNavigate();
    const liveCount = league.matches.filter(m => m.status === 'LIVE' || m.status === 'HT').length;

    return (
      <div ref={ref} className="mb-6">
        {/* League Header */}
        <div 
          className="league-header cursor-pointer group"
          onClick={() => navigate(`/standings/${league.id}`)}
        >
          <img 
            src={league.logo} 
            alt={league.name}
            className="w-8 h-8 rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{league.countryFlag}</span>
              <h3 className="font-semibold text-foreground">{league.name}</h3>
              {liveCount > 0 && (
                <span className="live-badge">{liveCount} Live</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{league.country}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Matches */}
        <div className="match-list space-y-2 px-2">
          {league.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    );
  }
);

LeagueSection.displayName = 'LeagueSection';

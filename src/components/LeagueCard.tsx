import { League } from '@/types/match';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LeagueCardProps {
  league: League;
}

export const LeagueCard = ({ league }: LeagueCardProps) => {
  const navigate = useNavigate();
  const liveCount = league.matches.filter(m => m.status === 'LIVE' || m.status === 'HT').length;

  return (
    <div 
      className={cn(
        'flex items-center gap-4 p-4 bg-card rounded-xl border border-border',
        'cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/30',
        'hover:shadow-lg hover:shadow-primary/5'
      )}
      onClick={() => navigate(`/standings/${league.id}`)}
    >
      <img 
        src={league.logo} 
        alt={league.name}
        className="w-12 h-12 rounded-xl"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{league.countryFlag}</span>
          <h3 className="font-semibold truncate">{league.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{league.country}</p>
      </div>

      <div className="flex items-center gap-3">
        {liveCount > 0 && (
          <span className="live-badge">{liveCount}</span>
        )}
        <span className="text-sm text-muted-foreground">
          {league.matches.length} matches
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
};

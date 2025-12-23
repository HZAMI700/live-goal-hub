import { MatchStats as MatchStatsType } from '@/types/match';
import { cn } from '@/lib/utils';

interface MatchStatsProps {
  stats: MatchStatsType;
}

interface StatBarProps {
  label: string;
  home: number;
  away: number;
  isPercentage?: boolean;
}

const StatBar = ({ label, home, away, isPercentage = false }: StatBarProps) => {
  const total = home + away;
  const homeWidth = total > 0 ? (home / total) * 100 : 50;
  const awayWidth = total > 0 ? (away / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className={cn('font-semibold', home > away && 'text-primary')}>
          {isPercentage ? `${home}%` : home}
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
        <span className={cn('font-semibold', away > home && 'text-primary')}>
          {isPercentage ? `${away}%` : away}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div 
          className={cn(
            'rounded-l-full transition-all duration-500',
            home >= away ? 'bg-primary' : 'bg-muted'
          )}
          style={{ width: `${homeWidth}%` }}
        />
        <div 
          className={cn(
            'rounded-r-full transition-all duration-500',
            away > home ? 'bg-primary' : 'bg-muted'
          )}
          style={{ width: `${awayWidth}%` }}
        />
      </div>
    </div>
  );
};

export const MatchStats = ({ stats }: MatchStatsProps) => {
  return (
    <div className="bg-card rounded-xl p-6 space-y-6 border border-border">
      <h3 className="font-bold text-lg text-center">Match Statistics</h3>
      
      <div className="space-y-5">
        <StatBar 
          label="Possession" 
          home={stats.possession.home} 
          away={stats.possession.away}
          isPercentage
        />
        <StatBar 
          label="Shots" 
          home={stats.shots.home} 
          away={stats.shots.away}
        />
        <StatBar 
          label="Shots on Target" 
          home={stats.shotsOnTarget.home} 
          away={stats.shotsOnTarget.away}
        />
        <StatBar 
          label="Corners" 
          home={stats.corners.home} 
          away={stats.corners.away}
        />
        <StatBar 
          label="Fouls" 
          home={stats.fouls.home} 
          away={stats.fouls.away}
        />
        <StatBar 
          label="Yellow Cards" 
          home={stats.yellowCards.home} 
          away={stats.yellowCards.away}
        />
        <StatBar 
          label="Red Cards" 
          home={stats.redCards.home} 
          away={stats.redCards.away}
        />
      </div>
    </div>
  );
};

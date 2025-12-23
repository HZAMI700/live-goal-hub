import { Standings } from '@/types/match';
import { cn } from '@/lib/utils';

interface StandingsTableProps {
  standings: Standings;
}

export const StandingsTable = ({ standings }: StandingsTableProps) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <img 
          src={standings.leagueLogo} 
          alt={standings.leagueName}
          className="w-10 h-10 rounded-lg"
        />
        <h2 className="font-bold text-lg">{standings.leagueName}</h2>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[auto_1fr_repeat(8,minmax(28px,1fr))] gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
        <span className="w-6 text-center">#</span>
        <span>Team</span>
        <span className="text-center">P</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-center">GF</span>
        <span className="text-center">GA</span>
        <span className="text-center">GD</span>
        <span className="text-center">Pts</span>
      </div>

      {/* Teams */}
      <div className="divide-y divide-border">
        {standings.teams.map((row, index) => (
          <div 
            key={row.team.id}
            className={cn(
              'grid grid-cols-[auto_1fr_repeat(8,minmax(28px,1fr))] gap-2 px-4 py-3 items-center hover:bg-secondary/50 transition-colors',
              index < 4 && 'border-l-2 border-l-primary'
            )}
          >
            <span className="w-6 text-center font-semibold text-sm">{row.position}</span>
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src={row.team.logo} 
                alt={row.team.name}
                className="w-6 h-6 rounded"
              />
              <span className="font-medium text-sm truncate">{row.team.name}</span>
            </div>
            <span className="text-center text-sm text-muted-foreground">{row.played}</span>
            <span className="text-center text-sm">{row.won}</span>
            <span className="text-center text-sm">{row.drawn}</span>
            <span className="text-center text-sm">{row.lost}</span>
            <span className="text-center text-sm text-muted-foreground">{row.goalsFor}</span>
            <span className="text-center text-sm text-muted-foreground">{row.goalsAgainst}</span>
            <span className={cn(
              'text-center text-sm font-medium',
              row.goalDifference > 0 && 'text-primary',
              row.goalDifference < 0 && 'text-destructive'
            )}>
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </span>
            <span className="text-center font-bold text-sm">{row.points}</span>
          </div>
        ))}
      </div>

      {/* Form Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-border">
        <span className="text-xs text-muted-foreground">Form:</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className="form-indicator form-w">W</span>
            <span className="text-xs text-muted-foreground">Win</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="form-indicator form-d">D</span>
            <span className="text-xs text-muted-foreground">Draw</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="form-indicator form-l">L</span>
            <span className="text-xs text-muted-foreground">Loss</span>
          </div>
        </div>
      </div>
    </div>
  );
};

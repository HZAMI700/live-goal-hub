import { Header } from '@/components/Header';
import { MatchCard } from '@/components/MatchCard';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const Live = () => {
  const { matches, isLoading, lastUpdated, refetch } = useLiveMatches();

  return (
    <div className="min-h-screen pb-24">
      <Header title="Live Matches" />
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-live fill-live" />
          <span className="font-semibold">
            {matches.length} Live {matches.length === 1 ? 'Match' : 'Matches'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated {format(lastUpdated, 'HH:mm:ss')}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refetch}
            disabled={isLoading}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Live Matches */}
      <div className="p-4 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No live matches right now
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for live action
            </p>
          </div>
        ) : (
          <div className="match-list space-y-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {matches.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
          <div className="bg-secondary/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Auto-refreshing every 15s
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;

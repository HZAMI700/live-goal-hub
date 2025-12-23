import { useParams, useNavigate } from 'react-router-dom';
import { getMatchDetails } from '@/data/mockData';
import { LiveIndicator } from '@/components/LiveIndicator';
import { MatchStats } from '@/components/MatchStats';
import { MatchEvents } from '@/components/MatchEvents';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MapPin, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const match = matchId ? getMatchDetails(matchId) : null;

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const isScheduled = match.status === 'SCHEDULED';

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex items-center h-14 px-4 gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <img 
              src={match.league.logo} 
              alt={match.league.name}
              className="w-6 h-6 rounded"
            />
            <span className="text-sm text-muted-foreground">{match.league.name}</span>
          </div>
        </div>
      </header>

      {/* Match Info */}
      <div className="bg-gradient-to-b from-card to-background p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center gap-3">
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="w-20 h-20 object-contain bg-secondary/50 p-2 rounded-2xl"
            />
            <span className="font-semibold text-sm">{match.homeTeam.name}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            {isScheduled ? (
              <div className="text-center">
                <p className="text-3xl font-bold">vs</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(match.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-5xl font-extrabold',
                    isLive && 'text-foreground'
                  )}>
                    {match.homeScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <span className={cn(
                    'text-5xl font-extrabold',
                    isLive && 'text-foreground'
                  )}>
                    {match.awayScore}
                  </span>
                </div>
                <LiveIndicator 
                  minute={match.minute} 
                  status={match.status} 
                />
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center gap-3">
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="w-20 h-20 object-contain bg-secondary/50 p-2 rounded-2xl"
            />
            <span className="font-semibold text-sm">{match.awayTeam.name}</span>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{match.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{match.referee}</span>
          </div>
          {match.attendance && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{match.attendance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isScheduled && (
        <Tabs defaultValue="events" className="p-4">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events" className="mt-4">
            <MatchEvents events={match.events} />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            {match.stats && <MatchStats stats={match.stats} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MatchDetail;

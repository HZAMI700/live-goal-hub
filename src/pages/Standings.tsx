import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StandingsTable } from '@/components/StandingsTable';
import { getStandings, allLeagues } from '@/data/mockData';
import { ChevronLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Standings = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  
  const standings = leagueId ? getStandings(leagueId) : null;
  const league = allLeagues.find(l => l.id === leagueId);

  return (
    <div className="min-h-screen pb-24">
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
          <h1 className="text-lg font-bold flex-1">
            {league?.name || 'Standings'}
          </h1>
        </div>
      </header>

      <div className="p-4">
        {standings ? (
          <StandingsTable standings={standings} />
        ) : (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Standings not available
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              This league's standings are coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Standings;

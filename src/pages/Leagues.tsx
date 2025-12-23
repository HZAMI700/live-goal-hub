import { Header } from '@/components/Header';
import { useLeagues } from '@/hooks/useLeagues';
import { Star, Globe, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeagueItemProps {
  league: {
    id: string;
    name: string;
    country: string;
    countryFlag: string;
    logo: string;
  };
}

const LeagueItem = ({ league }: LeagueItemProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
      <img 
        src={league.logo} 
        alt={league.name}
        className="w-10 h-10 rounded-lg object-contain"
        onError={(e) => {
          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(league.name.substring(0, 2))}&background=22c55e&color=0a0c10&size=64&rounded=true`;
        }}
      />
      <div className="flex-1">
        <h3 className="font-medium text-sm">{league.name}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{league.countryFlag}</span>
          <span>{league.country}</span>
        </p>
      </div>
    </div>
  );
};

const Leagues = () => {
  const { topLeagues, otherLeagues, isLoading, isError } = useLeagues();

  return (
    <div className="min-h-screen pb-24">
      <Header title="Leagues" />
      
      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading leagues...</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Top Leagues */}
          <section className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <h2 className="font-bold text-lg">Top Leagues</h2>
            </div>
            
            <div className="space-y-3">
              {topLeagues.map((league) => (
                <LeagueItem key={league.id} league={league} />
              ))}
              {topLeagues.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No top leagues available
                </p>
              )}
            </div>
          </section>

          {/* All Leagues */}
          <section className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-bold text-lg">All Leagues</h2>
            </div>
            
            <div className="space-y-3">
              {otherLeagues.slice(0, 20).map((league) => (
                <LeagueItem key={league.id} league={league} />
              ))}
              {otherLeagues.length > 20 && (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  + {otherLeagues.length - 20} more leagues
                </p>
              )}
              {otherLeagues.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No leagues available
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Leagues;

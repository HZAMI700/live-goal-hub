import { Header } from '@/components/Header';
import { LeagueCard } from '@/components/LeagueCard';
import { topLeagues, otherLeagues } from '@/data/mockData';
import { Star, Globe } from 'lucide-react';

const Leagues = () => {
  return (
    <div className="min-h-screen pb-24">
      <Header title="Leagues" />
      
      {/* Top Leagues */}
      <section className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary fill-primary" />
          <h2 className="font-bold text-lg">Top Leagues</h2>
        </div>
        
        <div className="space-y-3">
          {topLeagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      </section>

      {/* All Leagues */}
      <section className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-lg">All Leagues</h2>
        </div>
        
        <div className="space-y-3">
          {otherLeagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Leagues;

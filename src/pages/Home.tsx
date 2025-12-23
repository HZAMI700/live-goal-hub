import { useState } from 'react';
import { Header } from '@/components/Header';
import { DateSelector } from '@/components/DateSelector';
import { LeagueSection } from '@/components/LeagueSection';
import { topLeagues, otherLeagues } from '@/data/mockData';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  
  const liveCount = [...topLeagues, ...otherLeagues]
    .flatMap(l => l.matches)
    .filter(m => m.status === 'LIVE' || m.status === 'HT').length;

  return (
    <div className="min-h-screen pb-24">
      <Header title="LiveScore" />
      
      {/* Live Banner */}
      {liveCount > 0 && (
        <button 
          onClick={() => navigate('/live')}
          className="w-full bg-gradient-to-r from-live/20 via-live/10 to-transparent border-b border-live/20 py-3 px-4"
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-live fill-live" />
            <span className="font-semibold text-live">
              {liveCount} Live {liveCount === 1 ? 'Match' : 'Matches'}
            </span>
            <span className="text-muted-foreground text-sm">• Tap to view</span>
          </div>
        </button>
      )}
      
      <DateSelector 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate} 
      />

      {/* Top Leagues */}
      <section className="mt-4">
        <h2 className="px-4 text-lg font-bold mb-3 text-muted-foreground uppercase tracking-wider text-xs">
          Top Leagues
        </h2>
        {topLeagues.map((league) => (
          <LeagueSection key={league.id} league={league} />
        ))}
      </section>

      {/* Other Leagues */}
      <section className="mt-6">
        <h2 className="px-4 text-lg font-bold mb-3 text-muted-foreground uppercase tracking-wider text-xs">
          Other Leagues
        </h2>
        {otherLeagues.map((league) => (
          <LeagueSection key={league.id} league={league} />
        ))}
      </section>
    </div>
  );
};

export default Home;

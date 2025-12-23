import { useState } from 'react';
import { Header } from '@/components/Header';
import { DateSelector } from '@/components/DateSelector';
import { LeagueSection } from '@/components/LeagueSection';
import { allLeagues } from '@/data/mockData';
import { Calendar } from 'lucide-react';

const Fixtures = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Filter scheduled matches only
  const scheduledLeagues = allLeagues.map(league => ({
    ...league,
    matches: league.matches.filter(m => m.status === 'SCHEDULED'),
  })).filter(league => league.matches.length > 0);

  return (
    <div className="min-h-screen pb-24">
      <Header title="Fixtures" />
      
      <DateSelector 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate} 
      />

      <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">Upcoming matches</span>
      </div>

      {scheduledLeagues.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            No scheduled matches
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try selecting a different date
          </p>
        </div>
      ) : (
        scheduledLeagues.map((league) => (
          <LeagueSection key={league.id} league={league} />
        ))
      )}
    </div>
  );
};

export default Fixtures;

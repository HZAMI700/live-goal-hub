import { useState, useEffect, useCallback } from 'react';
import { Match } from '@/types/match';
import { getLiveMatches } from '@/data/mockData';

const REFRESH_INTERVAL = 15000; // 15 seconds

export const useLiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMatches = useCallback(async () => {
    try {
      // Simulate API call with mock data
      const liveMatches = getLiveMatches();
      
      // Simulate some score changes randomly for demo
      const updatedMatches = liveMatches.map(match => {
        if (match.status === 'LIVE' && Math.random() > 0.8) {
          return {
            ...match,
            minute: Math.min((match.minute || 0) + 1, 90),
          };
        }
        return match;
      });
      
      setMatches(updatedMatches);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    
    const interval = setInterval(fetchMatches, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, isLoading, lastUpdated, refetch: fetchMatches };
};

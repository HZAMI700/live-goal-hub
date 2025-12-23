import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match } from '@/types/match';
import { fetchLiveMatches } from '@/services/matchApi';

const REFRESH_INTERVAL = 15000; // 15 seconds

export const useLiveMatches = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: matches = [], isLoading, refetch } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: async () => {
      const result = await fetchLiveMatches();
      setLastUpdated(new Date());
      return result;
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 1000,
  });

  return { matches, isLoading, lastUpdated, refetch };
};

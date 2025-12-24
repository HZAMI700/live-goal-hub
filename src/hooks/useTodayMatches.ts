import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { League } from "@/types/match";
import { fetchTodayMatches, checkApiHealth, getApiStatus } from "@/services/sportsApi";

const REFRESH_INTERVAL = 60000; // 60 seconds

export const useTodayMatches = (_date?: string) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setIsInitializing(true);
      const health = await checkApiHealth();
      setApiOnline(health.online);
      setIsInitializing(false);
    };
    checkHealth();
  }, []);

  const {
    data,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["todayMatches", _date],
    queryFn: async () => {
      try {
        const result = await fetchTodayMatches();
        setLastUpdated(new Date());
        
        const status = getApiStatus();
        setApiOnline(status === "online");
        
        return result;
      } catch (error) {
        setApiOnline(false);
        return { topLeagues: [], otherLeagues: [] };
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000,
    retry: 2,
    retryDelay: 5000,
  });

  return {
    topLeagues: data?.topLeagues ?? [],
    otherLeagues: data?.otherLeagues ?? [],
    isLoading: isLoading || isInitializing,
    lastUpdated,
    refetch,
    isError,
    apiOnline,
    isInitializing,
  };
};

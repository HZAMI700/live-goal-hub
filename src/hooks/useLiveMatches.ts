import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/types/match";
import { fetchLiveMatches, checkApiHealth, getApiStatus } from "@/services/sportsApi";

const REFRESH_INTERVAL = 30000; // 30 seconds

export const useLiveMatches = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
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
    data: matches = [],
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["liveMatches"],
    queryFn: async () => {
      setIsUpdating(true);
      try {
        const result = await fetchLiveMatches();
        setLastUpdated(new Date());
        
        const status = getApiStatus();
        setApiOnline(status === "online");
        
        return result;
      } catch (error) {
        setApiOnline(false);
        return [];
      } finally {
        setIsUpdating(false);
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000,
    retry: 2,
    retryDelay: 5000,
  });

  const manualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    matches,
    isLoading: isLoading || isUpdating || isInitializing,
    lastUpdated,
    refetch: manualRefresh,
    isError,
    apiOnline,
    isInitializing,
  };
};

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/types/match";
import {
  fetchScraperLive,
  isScraperConfigured,
} from "@/services/scraperApi";
import { topLeagues, otherLeagues } from "@/data/mockData";

const REFRESH_INTERVAL = 15000; // 15 seconds

// Get mock live matches for fallback
const getMockLiveMatches = (): Match[] => {
  return [...topLeagues, ...otherLeagues]
    .flatMap((l) => l.matches)
    .filter((m) => m.status === "LIVE" || m.status === "HT");
};

export const useLiveMatches = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

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
        // If scraper is configured, use it
        if (isScraperConfigured()) {
          const result = await fetchScraperLive();
          setLastUpdated(new Date());
          return result;
        }
        // Otherwise use mock data
        setLastUpdated(new Date());
        return getMockLiveMatches();
      } finally {
        setIsUpdating(false);
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 1000,
    retry: 2,
    retryDelay: 3000,
  });

  const manualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    matches,
    isLoading: isLoading || isUpdating,
    lastUpdated,
    refetch: manualRefresh,
    isError,
    isConfigured: isScraperConfigured(),
  };
};

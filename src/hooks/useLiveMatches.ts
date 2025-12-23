import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/types/match";
import {
  fetchScraperLive,
  checkScraperHealth,
  getScraperStatus,
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
  const [scraperOnline, setScraperOnline] = useState<boolean | null>(null);
  const [isWaking, setIsWaking] = useState(false);

  // Check scraper health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setIsWaking(true);
      const health = await checkScraperHealth();
      setScraperOnline(health.online);
      setIsWaking(false);
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
        const result = await fetchScraperLive();
        setLastUpdated(new Date());
        
        // Check if we got real data
        if (result.length > 0) {
          setScraperOnline(true);
          return result;
        }
        
        // If no live matches from scraper, check if it's online
        const status = getScraperStatus();
        if (status === "online") {
          setScraperOnline(true);
          return result; // Empty but valid
        }
        
        // Scraper offline, use mock data
        setScraperOnline(false);
        return getMockLiveMatches();
      } catch (error) {
        setScraperOnline(false);
        return getMockLiveMatches();
      } finally {
        setIsUpdating(false);
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 1000,
    retry: 2,
    retryDelay: 5000,
  });

  const manualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    matches,
    isLoading: isLoading || isUpdating || isWaking,
    lastUpdated,
    refetch: manualRefresh,
    isError,
    scraperOnline,
    isWaking,
  };
};

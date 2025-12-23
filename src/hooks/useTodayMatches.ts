import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { League } from "@/types/match";
import {
  fetchScraperLeagues,
  isScraperConfigured,
} from "@/services/scraperApi";
import { topLeagues, otherLeagues } from "@/data/mockData";

const REFRESH_INTERVAL = 60000; // 60 seconds for today matches

export const useTodayMatches = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const {
    data,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["todayMatches"],
    queryFn: async () => {
      // If scraper is configured, use it
      if (isScraperConfigured()) {
        const leagues = await fetchScraperLeagues();
        setLastUpdated(new Date());
        
        // Separate into top leagues and others
        const topLeagueNames = [
          "premier league",
          "la liga",
          "bundesliga",
          "serie a",
          "ligue 1",
          "champions league",
          "europa league",
        ];
        
        const top = leagues.filter((l) =>
          topLeagueNames.some((name) => l.name.toLowerCase().includes(name))
        );
        const other = leagues.filter(
          (l) => !topLeagueNames.some((name) => l.name.toLowerCase().includes(name))
        );
        
        return { topLeagues: top, otherLeagues: other };
      }
      
      // Use mock data as fallback
      setLastUpdated(new Date());
      return { topLeagues, otherLeagues };
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000,
    retry: 2,
  });

  return {
    topLeagues: data?.topLeagues ?? topLeagues,
    otherLeagues: data?.otherLeagues ?? otherLeagues,
    isLoading,
    lastUpdated,
    refetch,
    isError,
    isConfigured: isScraperConfigured(),
  };
};

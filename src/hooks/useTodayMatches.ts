import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { League } from "@/types/match";
import {
  fetchScraperLeagues,
  checkScraperHealth,
  getScraperStatus,
} from "@/services/scraperApi";
import { topLeagues, otherLeagues } from "@/data/mockData";

const REFRESH_INTERVAL = 60000; // 60 seconds for today matches

export const useTodayMatches = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
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
    data,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["todayMatches"],
    queryFn: async () => {
      try {
        const leagues = await fetchScraperLeagues();
        setLastUpdated(new Date());
        
        if (leagues.length > 0) {
          setScraperOnline(true);
          
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
        
        // Check status
        const status = getScraperStatus();
        if (status === "online") {
          setScraperOnline(true);
          return { topLeagues: [], otherLeagues: [] };
        }
        
        // Use mock data as fallback
        setScraperOnline(false);
        return { topLeagues, otherLeagues };
      } catch (error) {
        setScraperOnline(false);
        return { topLeagues, otherLeagues };
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    staleTime: REFRESH_INTERVAL - 5000,
    retry: 2,
    retryDelay: 5000,
  });

  return {
    topLeagues: data?.topLeagues ?? topLeagues,
    otherLeagues: data?.otherLeagues ?? otherLeagues,
    isLoading: isLoading || isWaking,
    lastUpdated,
    refetch,
    isError,
    scraperOnline,
    isWaking,
  };
};

import { useQuery } from "@tanstack/react-query";
import { fetchMatchDetails } from "@/services/sportsApi";
import { MatchDetails } from "@/types/match";

export const useMatchDetails = (matchId: string | undefined) => {
  const {
    data: match,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["matchDetails", matchId],
    queryFn: async () => {
      if (!matchId) return null;
      return await fetchMatchDetails(matchId);
    },
    enabled: !!matchId,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: 3000,
  });

  return {
    match: match as MatchDetails | null,
    isLoading,
    isError,
    refetch,
  };
};

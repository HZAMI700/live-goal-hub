import { useQuery } from "@tanstack/react-query";
import { fetchLeagues } from "@/services/sportsApi";

export const useLeagues = () => {
  const {
    data,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const result = await fetchLeagues();
      return result;
    },
    staleTime: 3600000, // 1 hour
    retry: 2,
    retryDelay: 5000,
  });

  return {
    topLeagues: data?.topLeagues ?? [],
    otherLeagues: data?.otherLeagues ?? [],
    isLoading,
    refetch,
    isError,
  };
};

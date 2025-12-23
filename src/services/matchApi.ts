import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/match";

interface MatchesResponse {
  matches: Match[];
  timestamp: string;
}

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase.functions.invoke<MatchesResponse>("matches", {
    body: {},
    method: "GET",
  });
  
  // Handle GET with query params
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/matches?type=live`,
    {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch live matches");
  }

  const result: MatchesResponse = await response.json();
  return result.matches;
};

export const fetchTodayMatches = async (): Promise<Match[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/matches?type=today`,
    {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch today's matches");
  }

  const result: MatchesResponse = await response.json();
  return result.matches;
};

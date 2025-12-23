/**
 * TheSportsDB API Service
 * Connects to edge functions that proxy TheSportsDB API
 */

import { supabase } from "@/integrations/supabase/client";
import { Match, League, MatchDetails } from "@/types/match";

// API status tracking
let apiStatus: "online" | "offline" | "loading" = "loading";
let lastFetchTime: Date | null = null;

export const getApiStatus = () => apiStatus;
export const getLastFetchTime = () => lastFetchTime;

/**
 * Fetch live matches from TheSportsDB
 */
export const fetchLiveMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase.functions.invoke("thesportsdb-live");

    if (error) {
      console.error("Error fetching live matches:", error);
      apiStatus = "offline";
      throw error;
    }

    apiStatus = "online";
    lastFetchTime = new Date();
    return data?.matches || [];
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    apiStatus = "offline";
    return [];
  }
};

/**
 * Fetch today's matches from TheSportsDB
 */
export const fetchTodayMatches = async (date?: string): Promise<{
  topLeagues: League[];
  otherLeagues: League[];
}> => {
  try {
    const params = date ? { date } : undefined;
    const { data, error } = await supabase.functions.invoke("thesportsdb-today", {
      body: params,
    });

    if (error) {
      console.error("Error fetching today matches:", error);
      apiStatus = "offline";
      throw error;
    }

    apiStatus = "online";
    lastFetchTime = new Date();
    
    return {
      topLeagues: data?.topLeagues || [],
      otherLeagues: data?.otherLeagues || [],
    };
  } catch (error) {
    console.error("Failed to fetch today matches:", error);
    apiStatus = "offline";
    return { topLeagues: [], otherLeagues: [] };
  }
};

/**
 * Fetch all leagues from TheSportsDB
 */
export const fetchLeagues = async (): Promise<{
  topLeagues: Array<{ id: string; name: string; country: string; countryFlag: string; logo: string }>;
  otherLeagues: Array<{ id: string; name: string; country: string; countryFlag: string; logo: string }>;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke("thesportsdb-leagues");

    if (error) {
      console.error("Error fetching leagues:", error);
      apiStatus = "offline";
      throw error;
    }

    apiStatus = "online";
    lastFetchTime = new Date();
    
    return {
      topLeagues: data?.topLeagues || [],
      otherLeagues: data?.otherLeagues || [],
    };
  } catch (error) {
    console.error("Failed to fetch leagues:", error);
    apiStatus = "offline";
    return { topLeagues: [], otherLeagues: [] };
  }
};

/**
 * Fetch match details from TheSportsDB
 */
export const fetchMatchDetails = async (matchId: string): Promise<MatchDetails | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("thesportsdb-match", {
      body: { id: matchId },
    });

    if (error) {
      console.error("Error fetching match details:", error);
      throw error;
    }

    return data?.match || null;
  } catch (error) {
    console.error("Failed to fetch match details:", error);
    return null;
  }
};

/**
 * Check API health
 */
export const checkApiHealth = async (): Promise<{ online: boolean }> => {
  try {
    const { data, error } = await supabase.functions.invoke("thesportsdb-live");
    
    if (error) {
      apiStatus = "offline";
      return { online: false };
    }

    apiStatus = "online";
    return { online: true };
  } catch {
    apiStatus = "offline";
    return { online: false };
  }
};

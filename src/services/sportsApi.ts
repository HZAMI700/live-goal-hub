/**
 * Sports API Service
 * Primary: Flashscore (via Firecrawl scraping)
 * Fallback: TheSportsDB API
 */

import { supabase } from "@/integrations/supabase/client";
import { Match, League, MatchDetails } from "@/types/match";

// API status tracking
let apiStatus: "online" | "offline" | "loading" = "loading";
let lastFetchTime: Date | null = null;
let dataSource: "flashscore" | "thesportsdb" | null = null;

export const getApiStatus = () => apiStatus;
export const getLastFetchTime = () => lastFetchTime;
export const getDataSource = () => dataSource;

/**
 * Fetch live matches - tries Flashscore first, falls back to TheSportsDB
 */
export const fetchLiveMatches = async (): Promise<Match[]> => {
  try {
    // Try Flashscore first
    const { data: flashscoreData, error: flashscoreError } = await supabase.functions.invoke("flashscore-live");

    if (!flashscoreError && flashscoreData?.matches?.length > 0) {
      apiStatus = "online";
      lastFetchTime = new Date();
      dataSource = "flashscore";
      console.log("Live matches from Flashscore:", flashscoreData.matches.length);
      return flashscoreData.matches;
    }

    // Fallback to TheSportsDB
    console.log("Falling back to TheSportsDB for live matches");
    const { data, error } = await supabase.functions.invoke("thesportsdb-live");

    if (error) {
      console.error("Error fetching live matches:", error);
      apiStatus = "offline";
      throw error;
    }

    apiStatus = "online";
    lastFetchTime = new Date();
    dataSource = "thesportsdb";
    return data?.matches || [];
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    apiStatus = "offline";
    return [];
  }
};

/**
 * Fetch today's matches - tries Flashscore first, falls back to TheSportsDB
 */
export const fetchTodayMatches = async (date?: string): Promise<{
  topLeagues: League[];
  otherLeagues: League[];
}> => {
  try {
    // Try Flashscore first (only for today, not other dates)
    if (!date || date === new Date().toISOString().split('T')[0]) {
      const { data: flashscoreData, error: flashscoreError } = await supabase.functions.invoke("flashscore-today");

      if (!flashscoreError && (flashscoreData?.topLeagues?.length > 0 || flashscoreData?.otherLeagues?.length > 0)) {
        apiStatus = "online";
        lastFetchTime = new Date();
        dataSource = "flashscore";
        console.log("Today matches from Flashscore:", flashscoreData.count);
        return {
          topLeagues: flashscoreData.topLeagues || [],
          otherLeagues: flashscoreData.otherLeagues || [],
        };
      }
    }

    // Fallback to TheSportsDB
    console.log("Falling back to TheSportsDB for today matches");
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
    dataSource = "thesportsdb";
    
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
export const checkApiHealth = async (): Promise<{ online: boolean; source: string | null }> => {
  try {
    // Try Flashscore first
    const { error: flashscoreError } = await supabase.functions.invoke("flashscore-live");
    
    if (!flashscoreError) {
      apiStatus = "online";
      dataSource = "flashscore";
      return { online: true, source: "flashscore" };
    }

    // Try TheSportsDB
    const { error } = await supabase.functions.invoke("thesportsdb-live");
    
    if (!error) {
      apiStatus = "online";
      dataSource = "thesportsdb";
      return { online: true, source: "thesportsdb" };
    }

    apiStatus = "offline";
    return { online: false, source: null };
  } catch {
    apiStatus = "offline";
    return { online: false, source: null };
  }
};

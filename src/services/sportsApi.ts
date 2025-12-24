/**
 * Sports API Service
 * Uses Firecrawl to scrape Flashscore, SofaScore, and FotMob
 */

import { supabase } from "@/integrations/supabase/client";
import { Match, League, MatchDetails } from "@/types/match";

// API status tracking
let apiStatus: "online" | "offline" | "loading" = "loading";
let lastFetchTime: Date | null = null;
let dataSource: "flashscore" | "sofascore" | "fotmob" | null = null;

export const getApiStatus = () => apiStatus;
export const getLastFetchTime = () => lastFetchTime;
export const getDataSource = () => dataSource;

/**
 * Fetch live matches from all sources via Firecrawl
 */
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const allMatches: Match[] = [];
  const seenMatchKeys = new Set<string>();

  // Try all three sources in parallel
  const [flashscoreResult, sofascoreResult, fotmobResult] = await Promise.allSettled([
    supabase.functions.invoke("flashscore-live"),
    supabase.functions.invoke("sofascore-live"),
    supabase.functions.invoke("fotmob-live"),
  ]);

  // Process Flashscore results
  if (flashscoreResult.status === "fulfilled" && !flashscoreResult.value.error) {
    const matches = flashscoreResult.value.data?.matches || [];
    console.log(`Flashscore: ${matches.length} live matches`);
    for (const match of matches) {
      const key = `${match.homeTeam.name.toLowerCase()}-${match.awayTeam.name.toLowerCase()}`;
      if (!seenMatchKeys.has(key)) {
        seenMatchKeys.add(key);
        allMatches.push(match);
      }
    }
    if (matches.length > 0) dataSource = "flashscore";
  }

  // Process SofaScore results
  if (sofascoreResult.status === "fulfilled" && !sofascoreResult.value.error) {
    const matches = sofascoreResult.value.data?.matches || [];
    console.log(`SofaScore: ${matches.length} live matches`);
    for (const match of matches) {
      const key = `${match.homeTeam.name.toLowerCase()}-${match.awayTeam.name.toLowerCase()}`;
      if (!seenMatchKeys.has(key)) {
        seenMatchKeys.add(key);
        allMatches.push(match);
      }
    }
    if (matches.length > 0 && !dataSource) dataSource = "sofascore";
  }

  // Process FotMob results
  if (fotmobResult.status === "fulfilled" && !fotmobResult.value.error) {
    const matches = fotmobResult.value.data?.matches || [];
    console.log(`FotMob: ${matches.length} live matches`);
    for (const match of matches) {
      const key = `${match.homeTeam.name.toLowerCase()}-${match.awayTeam.name.toLowerCase()}`;
      if (!seenMatchKeys.has(key)) {
        seenMatchKeys.add(key);
        allMatches.push(match);
      }
    }
    if (matches.length > 0 && !dataSource) dataSource = "fotmob";
  }

  apiStatus = allMatches.length > 0 ? "online" : "offline";
  lastFetchTime = new Date();
  console.log(`Total unique live matches: ${allMatches.length}`);
  
  return allMatches;
};

/**
 * Fetch today's matches from all sources via Firecrawl
 */
export const fetchTodayMatches = async (): Promise<{
  topLeagues: League[];
  otherLeagues: League[];
}> => {
  const leagueMap = new Map<string, League>();
  const seenMatchKeys = new Set<string>();

  // Try all three sources in parallel
  const [flashscoreResult, sofascoreResult, fotmobResult] = await Promise.allSettled([
    supabase.functions.invoke("flashscore-today"),
    supabase.functions.invoke("sofascore-today"),
    supabase.functions.invoke("fotmob-today"),
  ]);

  const processLeagues = (leagues: League[], source: string) => {
    for (const league of leagues) {
      const leagueKey = league.name.toLowerCase();
      
      if (!leagueMap.has(leagueKey)) {
        leagueMap.set(leagueKey, { ...league, matches: [] });
      }
      
      const existingLeague = leagueMap.get(leagueKey)!;
      
      for (const match of league.matches) {
        const matchKey = `${match.homeTeam.name.toLowerCase()}-${match.awayTeam.name.toLowerCase()}`;
        if (!seenMatchKeys.has(matchKey)) {
          seenMatchKeys.add(matchKey);
          existingLeague.matches.push(match);
        }
      }
    }
    console.log(`${source}: processed leagues`);
  };

  // Process Flashscore results
  if (flashscoreResult.status === "fulfilled" && !flashscoreResult.value.error) {
    const data = flashscoreResult.value.data;
    processLeagues([...(data?.topLeagues || []), ...(data?.otherLeagues || [])], "Flashscore");
    if (data?.topLeagues?.length > 0 || data?.otherLeagues?.length > 0) dataSource = "flashscore";
  }

  // Process SofaScore results
  if (sofascoreResult.status === "fulfilled" && !sofascoreResult.value.error) {
    const data = sofascoreResult.value.data;
    processLeagues([...(data?.topLeagues || []), ...(data?.otherLeagues || [])], "SofaScore");
    if (!dataSource && (data?.topLeagues?.length > 0 || data?.otherLeagues?.length > 0)) dataSource = "sofascore";
  }

  // Process FotMob results
  if (fotmobResult.status === "fulfilled" && !fotmobResult.value.error) {
    const data = fotmobResult.value.data;
    processLeagues([...(data?.topLeagues || []), ...(data?.otherLeagues || [])], "FotMob");
    if (!dataSource && (data?.topLeagues?.length > 0 || data?.otherLeagues?.length > 0)) dataSource = "fotmob";
  }

  const allLeagues = Array.from(leagueMap.values()).filter(l => l.matches.length > 0);
  
  const TOP_LEAGUE_KEYWORDS = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League', 'Europa League'];
  const topLeagues = allLeagues.filter(l => TOP_LEAGUE_KEYWORDS.some(k => l.name.includes(k)));
  const otherLeagues = allLeagues.filter(l => !TOP_LEAGUE_KEYWORDS.some(k => l.name.includes(k)));

  apiStatus = allLeagues.length > 0 ? "online" : "offline";
  lastFetchTime = new Date();
  
  const totalMatches = allLeagues.reduce((sum, l) => sum + l.matches.length, 0);
  console.log(`Total unique today matches: ${totalMatches} in ${allLeagues.length} leagues`);
  
  return { topLeagues, otherLeagues };
};

/**
 * Fetch all leagues (returns empty as we're using scraped data)
 */
export const fetchLeagues = async (): Promise<{
  topLeagues: Array<{ id: string; name: string; country: string; countryFlag: string; logo: string }>;
  otherLeagues: Array<{ id: string; name: string; country: string; countryFlag: string; logo: string }>;
}> => {
  // Get leagues from today's matches
  const { topLeagues, otherLeagues } = await fetchTodayMatches();
  
  return {
    topLeagues: topLeagues.map(l => ({
      id: l.id,
      name: l.name,
      country: l.country,
      countryFlag: l.countryFlag,
      logo: l.logo,
    })),
    otherLeagues: otherLeagues.map(l => ({
      id: l.id,
      name: l.name,
      country: l.country,
      countryFlag: l.countryFlag,
      logo: l.logo,
    })),
  };
};

/**
 * Fetch match details (basic info from scraped data)
 */
export const fetchMatchDetails = async (matchId: string): Promise<MatchDetails | null> => {
  // For now, return null as detailed match info requires separate scraping
  console.log(`Match details requested for: ${matchId}`);
  return null;
};

/**
 * Check API health
 */
export const checkApiHealth = async (): Promise<{ online: boolean; source: string | null }> => {
  try {
    const [flashscoreResult, sofascoreResult, fotmobResult] = await Promise.allSettled([
      supabase.functions.invoke("flashscore-live"),
      supabase.functions.invoke("sofascore-live"),
      supabase.functions.invoke("fotmob-live"),
    ]);
    
    if (flashscoreResult.status === "fulfilled" && !flashscoreResult.value.error) {
      apiStatus = "online";
      dataSource = "flashscore";
      return { online: true, source: "flashscore" };
    }
    
    if (sofascoreResult.status === "fulfilled" && !sofascoreResult.value.error) {
      apiStatus = "online";
      dataSource = "sofascore";
      return { online: true, source: "sofascore" };
    }
    
    if (fotmobResult.status === "fulfilled" && !fotmobResult.value.error) {
      apiStatus = "online";
      dataSource = "fotmob";
      return { online: true, source: "fotmob" };
    }

    apiStatus = "offline";
    return { online: false, source: null };
  } catch {
    apiStatus = "offline";
    return { online: false, source: null };
  }
};

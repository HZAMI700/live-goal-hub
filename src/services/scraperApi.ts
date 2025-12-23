/**
 * Scraper API Service
 * Connects to the Render-hosted Flashscore scraper
 */

import { Match, League } from "@/types/match";

// Render scraper URL - your deployed scraper
const SCRAPER_URL = "https://live-goal-hub.onrender.com";

interface ScraperMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  startTime: string;
  leagueId: string;
  leagueName: string;
  country: string;
}

interface ApiResponse {
  matches: ScraperMatch[];
  count: number;
  timestamp: string;
}

interface LeaguesResponse {
  leagues: Array<{
    id: string;
    name: string;
    country: string;
    matches: ScraperMatch[];
  }>;
  count: number;
  timestamp: string;
}

interface HealthResponse {
  status: string;
  cached_matches: number;
  last_update: string | null;
  timestamp: string;
}

// Transform scraper response to app format
const transformMatch = (match: ScraperMatch): Match => ({
  id: match.id,
  homeTeam: match.homeTeam,
  awayTeam: match.awayTeam,
  homeScore: match.homeScore,
  awayScore: match.awayScore,
  status: match.status as Match["status"],
  minute: match.minute,
  startTime: match.startTime,
  leagueId: match.leagueId,
});

// Last known data for resilience
let cachedLiveMatches: Match[] = [];
let cachedTodayMatches: Match[] = [];
let cachedLeagues: League[] = [];
let lastFetchTime: Date | null = null;
let scraperStatus: "online" | "offline" | "waking" = "waking";

/**
 * Check if scraper is online and has data
 */
export const checkScraperHealth = async (): Promise<{
  online: boolean;
  matchCount: number;
  status: string;
}> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${SCRAPER_URL}/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      scraperStatus = "offline";
      return { online: false, matchCount: 0, status: "offline" };
    }

    const data: HealthResponse = await response.json();
    scraperStatus = "online";
    
    return {
      online: true,
      matchCount: data.cached_matches || 0,
      status: data.status || "ok",
    };
  } catch (error) {
    console.warn("Scraper health check failed:", error);
    scraperStatus = "waking";
    return { online: false, matchCount: 0, status: "waking" };
  }
};

/**
 * Get current scraper status
 */
export const getScraperStatus = () => scraperStatus;

/**
 * Check if scraper is configured (always true now)
 */
export const isScraperConfigured = (): boolean => {
  return Boolean(SCRAPER_URL && SCRAPER_URL.length > 0);
};

/**
 * Fetch live matches from scraper
 */
export const fetchScraperLive = async (): Promise<Match[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // Longer timeout for Render cold start

    const response = await fetch(`${SCRAPER_URL}/api/live`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.matches || !Array.isArray(data.matches)) {
      console.warn("Invalid response format, using cache");
      return cachedLiveMatches;
    }

    const matches = data.matches.map(transformMatch);

    // Update cache
    cachedLiveMatches = matches;
    lastFetchTime = new Date();
    scraperStatus = "online";

    return matches;
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    scraperStatus = error instanceof Error && error.name === "AbortError" ? "waking" : "offline";
    // Return cached data on error
    return cachedLiveMatches;
  }
};

/**
 * Fetch today's matches from scraper
 */
export const fetchScraperToday = async (): Promise<Match[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${SCRAPER_URL}/api/today`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.matches || !Array.isArray(data.matches)) {
      return cachedTodayMatches;
    }

    const matches = data.matches.map(transformMatch);

    // Update cache
    cachedTodayMatches = matches;
    lastFetchTime = new Date();
    scraperStatus = "online";

    return matches;
  } catch (error) {
    console.error("Failed to fetch today matches:", error);
    return cachedTodayMatches;
  }
};

/**
 * Fetch leagues with matches from scraper
 */
export const fetchScraperLeagues = async (): Promise<League[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${SCRAPER_URL}/api/leagues`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: LeaguesResponse = await response.json();

    if (!data.leagues || !Array.isArray(data.leagues)) {
      return cachedLeagues;
    }

    const leagues: League[] = data.leagues.map((league) => ({
      id: league.id,
      name: league.name,
      country: league.country,
      countryFlag: getCountryFlag(league.country),
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(league.name.substring(0, 2))}&background=22c55e&color=0a0c10&size=64&rounded=true`,
      matches: league.matches.map(transformMatch),
    }));

    // Update cache
    cachedLeagues = leagues;
    lastFetchTime = new Date();
    scraperStatus = "online";

    return leagues;
  } catch (error) {
    console.error("Failed to fetch leagues:", error);
    return cachedLeagues;
  }
};

/**
 * Get last successful fetch time
 */
export const getLastFetchTime = (): Date | null => lastFetchTime;

/**
 * Helper to get country flag emoji
 */
const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    spain: "🇪🇸",
    germany: "🇩🇪",
    italy: "🇮🇹",
    france: "🇫🇷",
    portugal: "🇵🇹",
    netherlands: "🇳🇱",
    belgium: "🇧🇪",
    turkey: "🇹🇷",
    scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    brazil: "🇧🇷",
    argentina: "🇦🇷",
    usa: "🇺🇸",
    mexico: "🇲🇽",
    japan: "🇯🇵",
    "south korea": "🇰🇷",
    australia: "🇦🇺",
    "saudi arabia": "🇸🇦",
    europe: "🇪🇺",
    world: "🌍",
  };

  return flags[country.toLowerCase()] || "🏳️";
};

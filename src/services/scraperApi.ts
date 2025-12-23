/**
 * Scraper API Service
 * Connects to the external Render-hosted Flashscore scraper
 */

import { Match, League } from "@/types/match";

// IMPORTANT: Set your Render scraper URL here after deployment
// For development/testing, we use mock data as fallback
const SCRAPER_URL = import.meta.env.VITE_SCRAPER_URL || "";

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

/**
 * Check if scraper is configured
 */
export const isScraperConfigured = (): boolean => {
  return Boolean(SCRAPER_URL && SCRAPER_URL.length > 0);
};

/**
 * Fetch live matches from scraper
 */
export const fetchScraperLive = async (): Promise<Match[]> => {
  if (!isScraperConfigured()) {
    console.warn("Scraper URL not configured, using cached/mock data");
    return cachedLiveMatches;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
    const matches = data.matches.map(transformMatch);

    // Update cache
    cachedLiveMatches = matches;
    lastFetchTime = new Date();

    return matches;
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    // Return cached data on error
    return cachedLiveMatches;
  }
};

/**
 * Fetch today's matches from scraper
 */
export const fetchScraperToday = async (): Promise<Match[]> => {
  if (!isScraperConfigured()) {
    console.warn("Scraper URL not configured, using cached/mock data");
    return cachedTodayMatches;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
    const matches = data.matches.map(transformMatch);

    // Update cache
    cachedTodayMatches = matches;
    lastFetchTime = new Date();

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
  if (!isScraperConfigured()) {
    console.warn("Scraper URL not configured, using cached/mock data");
    return cachedLeagues;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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

    const leagues: League[] = data.leagues.map((league) => ({
      id: league.id,
      name: league.name,
      country: league.country,
      countryFlag: `https://flagcdn.com/24x18/${getCountryCode(league.country)}.png`,
      logo: `https://www.flashscore.com/res/image/empty-logo-team-share.gif`,
      matches: league.matches.map(transformMatch),
    }));

    // Update cache
    cachedLeagues = leagues;
    lastFetchTime = new Date();

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
 * Helper to get country code for flags
 */
const getCountryCode = (country: string): string => {
  const codes: Record<string, string> = {
    england: "gb-eng",
    spain: "es",
    germany: "de",
    italy: "it",
    france: "fr",
    portugal: "pt",
    netherlands: "nl",
    belgium: "be",
    turkey: "tr",
    scotland: "gb-sct",
    brazil: "br",
    argentina: "ar",
    usa: "us",
    mexico: "mx",
    japan: "jp",
    "south korea": "kr",
    australia: "au",
    "saudi arabia": "sa",
  };

  return codes[country.toLowerCase()] || "un";
};

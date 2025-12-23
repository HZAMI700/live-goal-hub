import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = "3"; // Free tier API key for TheSportsDB
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

// Cache
let cachedData: any = null;
let cacheTime: number = 0;
let cacheDate: string = "";
const CACHE_DURATION = 300000; // 5 minutes cache

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const today = dateParam || new Date().toISOString().split("T")[0];
    const now = Date.now();

    // Return cached data if valid and same date
    if (cachedData && now - cacheTime < CACHE_DURATION && cacheDate === today) {
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch events for the day
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`
    );

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();

    // Group matches by league
    const leaguesMap = new Map();

    (data.events || []).forEach((event: any) => {
      const leagueId = event.idLeague;
      
      if (!leaguesMap.has(leagueId)) {
        leaguesMap.set(leagueId, {
          id: leagueId,
          name: event.strLeague,
          country: event.strCountry || "World",
          countryFlag: getCountryFlag(event.strCountry || "World"),
          logo: event.strLeagueBadge || `https://ui-avatars.com/api/?name=${encodeURIComponent((event.strLeague || 'L').substring(0, 2))}&background=22c55e&color=0a0c10&size=64&rounded=true`,
          matches: [],
        });
      }

      leaguesMap.get(leagueId).matches.push({
        id: event.idEvent,
        homeTeam: {
          id: event.idHomeTeam || event.strHomeTeam?.replace(/\s/g, '-').toLowerCase(),
          name: event.strHomeTeam,
          shortName: event.strHomeTeam?.substring(0, 3).toUpperCase() || "???",
          logo: event.strHomeTeamBadge || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.strHomeTeam || 'H')}&background=1a1f2e&color=22c55e&bold=true&size=64`,
        },
        awayTeam: {
          id: event.idAwayTeam || event.strAwayTeam?.replace(/\s/g, '-').toLowerCase(),
          name: event.strAwayTeam,
          shortName: event.strAwayTeam?.substring(0, 3).toUpperCase() || "???",
          logo: event.strAwayTeamBadge || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.strAwayTeam || 'A')}&background=1a1f2e&color=22c55e&bold=true&size=64`,
        },
        homeScore: event.intHomeScore !== null && event.intHomeScore !== "" ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore !== null && event.intAwayScore !== "" ? parseInt(event.intAwayScore) : null,
        status: parseStatus(event.strStatus),
        minute: parseMinute(event.strStatus),
        startTime: event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`,
        leagueId: event.idLeague,
      });
    });

    const leagues = Array.from(leaguesMap.values());

    // Separate top leagues
    const topLeagueKeywords = [
      "premier league", "la liga", "bundesliga", "serie a", "ligue 1",
      "champions league", "europa league", "conference league",
      "world cup", "euro 202", "mls", "liga mx"
    ];

    const topLeagues = leagues.filter((l: any) =>
      topLeagueKeywords.some(k => l.name.toLowerCase().includes(k))
    );
    const otherLeagues = leagues.filter((l: any) =>
      !topLeagueKeywords.some(k => l.name.toLowerCase().includes(k))
    );

    const result = {
      topLeagues,
      otherLeagues,
      allLeagues: leagues,
      count: leagues.reduce((acc: number, l: any) => acc + l.matches.length, 0),
      date: today,
      timestamp: new Date().toISOString(),
      source: "thesportsdb",
    };

    // Update cache
    cachedData = result;
    cacheTime = now;
    cacheDate = today;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching today matches:", error);

    if (cachedData) {
      return new Response(JSON.stringify({ ...cachedData, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        topLeagues: [],
        otherLeagues: [],
        allLeagues: [],
        count: 0,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseStatus(status: string | null): string {
  if (!status) return "SCHEDULED";
  const s = status.toLowerCase();
  
  if (s.includes("ht") || s === "halftime") return "HT";
  if (s.includes("ft") || s === "finished" || s.includes("match finished") || s.includes("aet") || s.includes("pen")) return "FT";
  if (s.includes("postponed") || s.includes("pst")) return "POSTPONED";
  if (s.includes("cancelled") || s.includes("canc")) return "CANCELLED";
  if (s.includes("not started") || s.includes("ns") || s === "") return "SCHEDULED";
  if (s.includes("'") || /^\d+$/.test(s.trim())) return "LIVE";
  
  return "SCHEDULED";
}

function parseMinute(status: string | null): number | null {
  if (!status) return null;
  const match = status.match(/(\d+)/);
  if (match) return parseInt(match[1]);
  if (status.toLowerCase().includes("ht")) return 45;
  return null;
}

function getCountryFlag(country: string): string {
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
    "united states": "🇺🇸",
    mexico: "🇲🇽",
    japan: "🇯🇵",
    "south korea": "🇰🇷",
    australia: "🇦🇺",
    "saudi arabia": "🇸🇦",
    europe: "🇪🇺",
    world: "🌍",
    international: "🌍",
  };
  return flags[country.toLowerCase()] || "🏳️";
}

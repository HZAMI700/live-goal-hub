import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = "3"; // Free tier API key for TheSportsDB
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

// Cache for rate limiting
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedData && now - cacheTime < CACHE_DURATION) {
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch live soccer scores
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/livescore.php?s=Soccer`
    );

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to our app format
    const matches = (data.events || []).map((event: any) => ({
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
      homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
      status: parseStatus(event.strStatus, event.strProgress),
      minute: parseMinute(event.strProgress, event.strStatus),
      startTime: event.strTimestamp || event.dateEvent + 'T' + (event.strTime || '00:00:00'),
      leagueId: event.idLeague,
      leagueName: event.strLeague,
      leagueBadge: event.strLeagueBadge,
      country: event.strCountry || "World",
    }));

    const result = {
      matches,
      count: matches.length,
      timestamp: new Date().toISOString(),
      source: "thesportsdb",
    };

    // Update cache
    cachedData = result;
    cacheTime = now;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching live scores:", error);
    
    // Return cached data on error if available
    if (cachedData) {
      return new Response(JSON.stringify({ ...cachedData, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        matches: [],
        count: 0,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function parseStatus(status: string | null, progress: string | null): string {
  if (!status && !progress) return "SCHEDULED";
  
  const s = (status || progress || "").toLowerCase();
  
  if (s.includes("ht") || s === "halftime") return "HT";
  if (s.includes("ft") || s === "finished" || s === "match finished") return "FT";
  if (s.includes("postponed") || s.includes("pst")) return "POSTPONED";
  if (s.includes("cancelled") || s.includes("canc")) return "CANCELLED";
  if (s.includes("not started") || s.includes("ns")) return "SCHEDULED";
  if (s.includes("'") || /^\d+$/.test(s) || s.includes("live")) return "LIVE";
  
  return "LIVE";
}

function parseMinute(progress: string | null, status: string | null): number | null {
  const text = progress || status || "";
  const match = text.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  if (text.toLowerCase().includes("ht")) return 45;
  return null;
}

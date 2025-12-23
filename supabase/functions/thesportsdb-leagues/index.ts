import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = "3";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

// Cache
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour cache for leagues list

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    if (cachedData && now - cacheTime < CACHE_DURATION) {
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all soccer leagues
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/all_leagues.php`
    );

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter soccer leagues
    const soccerLeagues = (data.leagues || [])
      .filter((l: any) => l.strSport === "Soccer")
      .map((league: any) => ({
        id: league.idLeague,
        name: league.strLeague,
        alternativeName: league.strLeagueAlternate,
        country: league.strCountry || "World",
        countryFlag: getCountryFlag(league.strCountry || "World"),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent((league.strLeague || 'L').substring(0, 2))}&background=22c55e&color=0a0c10&size=64&rounded=true`,
      }));

    // Define top leagues
    const topLeagueIds = [
      "4328", // Premier League
      "4335", // La Liga
      "4331", // Bundesliga
      "4332", // Serie A
      "4334", // Ligue 1
      "4480", // Champions League
      "4481", // Europa League
      "4346", // MLS
      "4351", // Liga MX
    ];

    const topLeagues = soccerLeagues.filter((l: any) => topLeagueIds.includes(l.id));
    const otherLeagues = soccerLeagues.filter((l: any) => !topLeagueIds.includes(l.id));

    const result = {
      topLeagues,
      otherLeagues,
      allLeagues: soccerLeagues,
      count: soccerLeagues.length,
      timestamp: new Date().toISOString(),
      source: "thesportsdb",
    };

    cachedData = result;
    cacheTime = now;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching leagues:", error);

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

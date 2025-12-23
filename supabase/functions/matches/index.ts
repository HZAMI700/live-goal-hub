import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock data for demonstration - replace with real API integration
const getMockMatches = () => [
  {
    id: "1",
    homeTeam: { id: "t1", name: "Manchester United", shortName: "MUN", logo: "https://media.api-sports.io/football/teams/33.png" },
    awayTeam: { id: "t2", name: "Liverpool", shortName: "LIV", logo: "https://media.api-sports.io/football/teams/40.png" },
    homeScore: 2,
    awayScore: 1,
    status: "LIVE" as const,
    minute: 67,
    startTime: new Date().toISOString(),
    league: { id: "l1", name: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://media.api-sports.io/football/leagues/39.png" }
  },
  {
    id: "2",
    homeTeam: { id: "t3", name: "Real Madrid", shortName: "RMA", logo: "https://media.api-sports.io/football/teams/541.png" },
    awayTeam: { id: "t4", name: "Barcelona", shortName: "BAR", logo: "https://media.api-sports.io/football/teams/529.png" },
    homeScore: 1,
    awayScore: 1,
    status: "HT" as const,
    minute: 45,
    startTime: new Date().toISOString(),
    league: { id: "l2", name: "La Liga", country: "Spain", countryFlag: "🇪🇸", logo: "https://media.api-sports.io/football/leagues/140.png" }
  },
  {
    id: "3",
    homeTeam: { id: "t5", name: "Bayern Munich", shortName: "BAY", logo: "https://media.api-sports.io/football/teams/157.png" },
    awayTeam: { id: "t6", name: "Dortmund", shortName: "DOR", logo: "https://media.api-sports.io/football/teams/165.png" },
    homeScore: 3,
    awayScore: 0,
    status: "LIVE" as const,
    minute: 78,
    startTime: new Date().toISOString(),
    league: { id: "l3", name: "Bundesliga", country: "Germany", countryFlag: "🇩🇪", logo: "https://media.api-sports.io/football/leagues/78.png" }
  },
  {
    id: "4",
    homeTeam: { id: "t7", name: "PSG", shortName: "PSG", logo: "https://media.api-sports.io/football/teams/85.png" },
    awayTeam: { id: "t8", name: "Lyon", shortName: "LYO", logo: "https://media.api-sports.io/football/teams/80.png" },
    homeScore: 0,
    awayScore: 0,
    status: "SCHEDULED" as const,
    startTime: new Date(Date.now() + 3600000).toISOString(),
    league: { id: "l4", name: "Ligue 1", country: "France", countryFlag: "🇫🇷", logo: "https://media.api-sports.io/football/leagues/61.png" }
  },
  {
    id: "5",
    homeTeam: { id: "t9", name: "Juventus", shortName: "JUV", logo: "https://media.api-sports.io/football/teams/496.png" },
    awayTeam: { id: "t10", name: "AC Milan", shortName: "MIL", logo: "https://media.api-sports.io/football/teams/489.png" },
    homeScore: 2,
    awayScore: 2,
    status: "FT" as const,
    startTime: new Date(Date.now() - 7200000).toISOString(),
    league: { id: "l5", name: "Serie A", country: "Italy", countryFlag: "🇮🇹", logo: "https://media.api-sports.io/football/leagues/135.png" }
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    
    console.log(`[matches] Fetching matches, type: ${type}`);
    
    const allMatches = getMockMatches();
    
    let matches;
    switch (type) {
      case "live":
        matches = allMatches.filter(m => m.status === "LIVE" || m.status === "HT");
        break;
      case "today":
        matches = allMatches;
        break;
      default:
        matches = allMatches;
    }

    console.log(`[matches] Returning ${matches.length} matches`);

    return new Response(JSON.stringify({ matches, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[matches] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

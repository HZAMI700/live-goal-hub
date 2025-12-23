import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = "3";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("id");

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "Event ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch event details
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/lookupevent.php?id=${eventId}`
    );

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const event = data.events?.[0];

    if (!event) {
      return new Response(
        JSON.stringify({ error: "Match not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform to our format
    const match = {
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
      venue: event.strVenue || "Unknown Stadium",
      referee: event.strReferee || "TBA",
      attendance: event.intSpectators ? parseInt(event.intSpectators) : null,
      league: {
        id: event.idLeague,
        name: event.strLeague,
        logo: event.strLeagueBadge || `https://ui-avatars.com/api/?name=${encodeURIComponent((event.strLeague || 'L').substring(0, 2))}&background=22c55e&color=0a0c10&size=64&rounded=true`,
      },
      // Basic stats from available data (TheSportsDB free tier has limited stats)
      stats: null,
      events: parseEvents(event),
      description: event.strDescriptionEN || null,
      thumbnail: event.strThumb || event.strPoster || null,
      video: event.strVideo || null,
    };

    return new Response(JSON.stringify({ match, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching match details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

function parseEvents(event: any): any[] {
  // TheSportsDB free tier doesn't include detailed events
  // But we can parse goals from strResult or description if available
  const events: any[] = [];
  
  // Parse home goals
  if (event.strHomeGoalDetails) {
    const homeGoals = event.strHomeGoalDetails.split(";").filter((g: string) => g.trim());
    homeGoals.forEach((goal: string, index: number) => {
      const minuteMatch = goal.match(/(\d+)/);
      events.push({
        id: `hg-${index}`,
        type: "goal",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "home",
        playerName: goal.replace(/\d+[':]/g, "").trim() || "Goal",
      });
    });
  }

  // Parse away goals
  if (event.strAwayGoalDetails) {
    const awayGoals = event.strAwayGoalDetails.split(";").filter((g: string) => g.trim());
    awayGoals.forEach((goal: string, index: number) => {
      const minuteMatch = goal.match(/(\d+)/);
      events.push({
        id: `ag-${index}`,
        type: "goal",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "away",
        playerName: goal.replace(/\d+[':]/g, "").trim() || "Goal",
      });
    });
  }

  // Parse cards if available
  if (event.strHomeYellowCards) {
    const cards = event.strHomeYellowCards.split(";").filter((c: string) => c.trim());
    cards.forEach((card: string, index: number) => {
      const minuteMatch = card.match(/(\d+)/);
      events.push({
        id: `hyc-${index}`,
        type: "yellow_card",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "home",
        playerName: card.replace(/\d+[':]/g, "").trim() || "Card",
      });
    });
  }

  if (event.strAwayYellowCards) {
    const cards = event.strAwayYellowCards.split(";").filter((c: string) => c.trim());
    cards.forEach((card: string, index: number) => {
      const minuteMatch = card.match(/(\d+)/);
      events.push({
        id: `ayc-${index}`,
        type: "yellow_card",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "away",
        playerName: card.replace(/\d+[':]/g, "").trim() || "Card",
      });
    });
  }

  if (event.strHomeRedCards) {
    const cards = event.strHomeRedCards.split(";").filter((c: string) => c.trim());
    cards.forEach((card: string, index: number) => {
      const minuteMatch = card.match(/(\d+)/);
      events.push({
        id: `hrc-${index}`,
        type: "red_card",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "home",
        playerName: card.replace(/\d+[':]/g, "").trim() || "Card",
      });
    });
  }

  if (event.strAwayRedCards) {
    const cards = event.strAwayRedCards.split(";").filter((c: string) => c.trim());
    cards.forEach((card: string, index: number) => {
      const minuteMatch = card.match(/(\d+)/);
      events.push({
        id: `arc-${index}`,
        type: "red_card",
        minute: minuteMatch ? parseInt(minuteMatch[1]) : null,
        team: "away",
        playerName: card.replace(/\d+[':]/g, "").trim() || "Card",
      });
    });
  }

  // Sort by minute
  return events.sort((a, b) => (a.minute || 0) - (b.minute || 0));
}

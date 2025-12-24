const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Match {
  id: string;
  homeTeam: { id: string; name: string; shortName: string; logo: string };
  awayTeam: { id: string; name: string; shortName: string; logo: string };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: string | null;
  startTime: string;
}

interface League {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  logo: string;
  matches: Match[];
}

let cache: { topLeagues: League[]; otherLeagues: League[]; timestamp: number } | null = null;
const CACHE_TTL = 60000;

const TOP_LEAGUE_KEYWORDS = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League', 'Europa League'];

function parseSofascoreMatches(markdown: string): { topLeagues: League[]; otherLeagues: League[] } {
  const leagues: Map<string, League> = new Map();
  const lines = markdown.split('\n');
  
  let currentLeague = '';
  let currentCountry = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#') || line.startsWith('**') || line.includes('League') || line.includes('Cup')) {
      const leagueMatch = line.replace(/[#*\[\]]/g, '').trim();
      if (leagueMatch && !leagueMatch.match(/^\d/)) {
        const parts = leagueMatch.split(/[-–:]/);
        if (parts.length >= 2 && parts[0].length < 20) {
          currentCountry = parts[0].trim();
          currentLeague = parts.slice(1).join(' ').trim();
        } else {
          currentLeague = leagueMatch;
        }
      }
    }
    
    const matchPattern = /([A-Za-z\s.&']+?)\s*(\d+)\s*[-–:]\s*(\d+)\s*([A-Za-z\s.&']+)/;
    const timePattern = /(\d{1,2}:\d{2})|(\d+)'|HT|FT|LIVE/i;
    
    const matchResult = line.match(matchPattern);
    if (matchResult && currentLeague) {
      const [, homeTeam, homeScore, awayScore, awayTeam] = matchResult;
      const timeMatch = line.match(timePattern);
      
      let status = 'SCHEDULED';
      let minute: string | null = null;
      let startTime = new Date().toISOString();
      
      if (timeMatch) {
        const timeStr = timeMatch[0].toUpperCase();
        if (timeStr === 'HT') {
          status = 'HT';
          minute = 'HT';
        } else if (timeStr === 'FT') {
          status = 'FT';
        } else if (timeStr.includes("'") || timeStr === 'LIVE') {
          status = 'LIVE';
          minute = timeMatch[0].replace("'", "");
        } else if (timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          startTime = date.toISOString();
        }
      }
      
      const leagueId = currentLeague.toLowerCase().replace(/\s/g, '-');
      
      if (!leagues.has(leagueId)) {
        leagues.set(leagueId, {
          id: leagueId,
          name: currentLeague,
          country: currentCountry || 'World',
          countryFlag: '',
          logo: '',
          matches: [],
        });
      }
      
      const matchId = `ss-${Date.now()}-${leagues.get(leagueId)!.matches.length}`;
      
      leagues.get(leagueId)!.matches.push({
        id: matchId,
        homeTeam: {
          id: homeTeam.trim().toLowerCase().replace(/\s/g, '-'),
          name: homeTeam.trim(),
          shortName: homeTeam.trim().substring(0, 3).toUpperCase(),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam.trim())}&background=2d4a3e&color=22c55e&bold=true&size=64`,
        },
        awayTeam: {
          id: awayTeam.trim().toLowerCase().replace(/\s/g, '-'),
          name: awayTeam.trim(),
          shortName: awayTeam.trim().substring(0, 3).toUpperCase(),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam.trim())}&background=2d4a3e&color=22c55e&bold=true&size=64`,
        },
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status,
        minute,
        startTime,
      });
    }
  }
  
  const allLeagues = Array.from(leagues.values()).filter(l => l.matches.length > 0);
  const topLeagues = allLeagues.filter(l => TOP_LEAGUE_KEYWORDS.some(k => l.name.includes(k)));
  const otherLeagues = allLeagues.filter(l => !TOP_LEAGUE_KEYWORDS.some(k => l.name.includes(k)));
  
  return { topLeagues, otherLeagues };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('Returning cached SofaScore today matches');
      return new Response(JSON.stringify({
        topLeagues: cache.topLeagues,
        otherLeagues: cache.otherLeagues,
        count: cache.topLeagues.reduce((sum, l) => sum + l.matches.length, 0) + cache.otherLeagues.reduce((sum, l) => sum + l.matches.length, 0),
        timestamp: new Date(cache.timestamp).toISOString(),
        source: 'sofascore',
        cached: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'Firecrawl not configured',
        topLeagues: [],
        otherLeagues: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping SofaScore today matches...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.sofascore.com/football',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firecrawl API error:', errorData);
      return new Response(JSON.stringify({
        error: `Firecrawl error: ${response.status}`,
        topLeagues: [],
        otherLeagues: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const { topLeagues, otherLeagues } = parseSofascoreMatches(markdown);
    
    const totalMatches = topLeagues.reduce((sum, l) => sum + l.matches.length, 0) + otherLeagues.reduce((sum, l) => sum + l.matches.length, 0);
    console.log(`Parsed ${totalMatches} matches from SofaScore`);

    cache = { topLeagues, otherLeagues, timestamp: Date.now() };

    return new Response(JSON.stringify({
      topLeagues,
      otherLeagues,
      count: totalMatches,
      timestamp: new Date().toISOString(),
      source: 'sofascore',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error scraping SofaScore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage,
      topLeagues: [],
      otherLeagues: [],
      count: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
  leagueId: string;
  leagueName: string;
  leagueBadge: string;
  country: string;
}

// Cache for live matches
let cache: { data: Match[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds cache

function parseFlashscoreData(markdown: string): Match[] {
  const matches: Match[] = [];
  const lines = markdown.split('\n');
  
  let currentLeague = '';
  let currentCountry = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for league headers (usually in bold or as headers)
    if (line.startsWith('#') || line.startsWith('**')) {
      const leagueMatch = line.replace(/[#*]/g, '').trim();
      if (leagueMatch && !leagueMatch.includes('-') && !leagueMatch.match(/^\d/)) {
        // Parse country: league format
        const parts = leagueMatch.split(':');
        if (parts.length >= 2) {
          currentCountry = parts[0].trim();
          currentLeague = parts.slice(1).join(':').trim();
        } else {
          currentLeague = leagueMatch;
        }
      }
    }
    
    // Look for match patterns: Team1 score - score Team2 or similar
    const matchPattern = /([A-Za-z\s.]+)\s*(\d+)\s*[-–:]\s*(\d+)\s*([A-Za-z\s.]+)/;
    const livePattern = /(\d+)'|HT|FT|LIVE|1H|2H/i;
    
    const matchResult = line.match(matchPattern);
    if (matchResult) {
      const [, homeTeam, homeScore, awayScore, awayTeam] = matchResult;
      const timeMatch = line.match(livePattern);
      
      let status = 'SCHEDULED';
      let minute: string | null = null;
      
      if (timeMatch) {
        const timeStr = timeMatch[0].toUpperCase();
        if (timeStr === 'HT') {
          status = 'HT';
          minute = 'HT';
        } else if (timeStr === 'FT') {
          status = 'FT';
        } else if (timeStr.includes("'") || timeStr === 'LIVE' || timeStr === '1H' || timeStr === '2H') {
          status = 'LIVE';
          minute = timeMatch[0].replace("'", "");
        }
      }
      
      const matchId = `fs-${Date.now()}-${matches.length}`;
      
      matches.push({
        id: matchId,
        homeTeam: {
          id: homeTeam.trim().toLowerCase().replace(/\s/g, '-'),
          name: homeTeam.trim(),
          shortName: homeTeam.trim().substring(0, 3).toUpperCase(),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam.trim())}&background=1a1f2e&color=22c55e&bold=true&size=64`,
        },
        awayTeam: {
          id: awayTeam.trim().toLowerCase().replace(/\s/g, '-'),
          name: awayTeam.trim(),
          shortName: awayTeam.trim().substring(0, 3).toUpperCase(),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam.trim())}&background=1a1f2e&color=22c55e&bold=true&size=64`,
        },
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status,
        minute,
        startTime: new Date().toISOString(),
        leagueId: currentLeague.toLowerCase().replace(/\s/g, '-'),
        leagueName: currentLeague || 'Unknown League',
        leagueBadge: '',
        country: currentCountry || 'World',
      });
    }
  }
  
  return matches;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('Returning cached live matches');
      return new Response(JSON.stringify({
        matches: cache.data,
        count: cache.data.length,
        timestamp: new Date(cache.timestamp).toISOString(),
        source: 'flashscore',
        cached: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({
        error: 'Firecrawl not configured',
        matches: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping Flashscore live matches...');
    
    // Scrape Flashscore live scores page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.flashscore.com/football/',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firecrawl API error:', errorData);
      return new Response(JSON.stringify({
        error: `Firecrawl error: ${response.status}`,
        matches: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Firecrawl response received');
    
    const markdown = data.data?.markdown || data.markdown || '';
    const matches = parseFlashscoreData(markdown);
    
    // Filter for live matches only
    const liveMatches = matches.filter(m => 
      m.status === 'LIVE' || m.status === 'HT' || m.status === '1H' || m.status === '2H'
    );
    
    console.log(`Parsed ${liveMatches.length} live matches from Flashscore`);

    // Update cache
    cache = { data: liveMatches, timestamp: Date.now() };

    return new Response(JSON.stringify({
      matches: liveMatches,
      count: liveMatches.length,
      timestamp: new Date().toISOString(),
      source: 'flashscore',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error scraping Flashscore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage,
      matches: [],
      count: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

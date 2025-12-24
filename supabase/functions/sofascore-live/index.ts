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

let cache: { data: Match[]; timestamp: number } | null = null;
const CACHE_TTL = 30000;

function parseSofascoreData(markdown: string): Match[] {
  const matches: Match[] = [];
  const lines = markdown.split('\n');
  
  let currentLeague = '';
  let currentCountry = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for league/tournament headers
    if (line.startsWith('#') || line.startsWith('**') || line.includes('League') || line.includes('Cup') || line.includes('Championship')) {
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
    
    // Match patterns for scores
    const matchPattern = /([A-Za-z\s.&']+?)\s*(\d+)\s*[-–:]\s*(\d+)\s*([A-Za-z\s.&']+)/;
    const livePattern = /(\d+)'|HT|FT|LIVE|Live|1st|2nd|Half/i;
    
    const matchResult = line.match(matchPattern);
    if (matchResult) {
      const [, homeTeam, homeScore, awayScore, awayTeam] = matchResult;
      const timeMatch = line.match(livePattern);
      
      let status = 'SCHEDULED';
      let minute: string | null = null;
      
      if (timeMatch) {
        const timeStr = timeMatch[0].toUpperCase();
        if (timeStr === 'HT' || timeStr === 'HALF') {
          status = 'HT';
          minute = 'HT';
        } else if (timeStr === 'FT') {
          status = 'FT';
        } else if (timeStr.includes("'") || timeStr === 'LIVE' || timeStr === '1ST' || timeStr === '2ND') {
          status = 'LIVE';
          minute = timeMatch[0].replace("'", "");
        }
      }
      
      const matchId = `ss-${Date.now()}-${matches.length}`;
      
      matches.push({
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
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('Returning cached SofaScore live matches');
      return new Response(JSON.stringify({
        matches: cache.data,
        count: cache.data.length,
        timestamp: new Date(cache.timestamp).toISOString(),
        source: 'sofascore',
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

    console.log('Scraping SofaScore live matches...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.sofascore.com/football/livescore',
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
        matches: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Firecrawl response received from SofaScore');
    
    const markdown = data.data?.markdown || data.markdown || '';
    const matches = parseSofascoreData(markdown);
    
    const liveMatches = matches.filter(m => 
      m.status === 'LIVE' || m.status === 'HT' || m.status === '1H' || m.status === '2H'
    );
    
    console.log(`Parsed ${liveMatches.length} live matches from SofaScore`);

    cache = { data: liveMatches, timestamp: Date.now() };

    return new Response(JSON.stringify({
      matches: liveMatches,
      count: liveMatches.length,
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
      matches: [],
      count: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
}

interface League {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  logo: string;
  matches: Match[];
}

// Cache for today's matches
let cache: { data: League[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute cache

const TOP_LEAGUES = [
  'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
  'champions league', 'europa league', 'world cup', 'euro'
];

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'spain': '🇪🇸', 'germany': '🇩🇪', 'italy': '🇮🇹',
    'france': '🇫🇷', 'portugal': '🇵🇹', 'netherlands': '🇳🇱', 'belgium': '🇧🇪',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'europe': '🇪🇺', 'world': '🌍', 'usa': '🇺🇸',
    'brazil': '🇧🇷', 'argentina': '🇦🇷', 'mexico': '🇲🇽',
  };
  return flags[country.toLowerCase()] || '🌍';
}

function parseFlashscoreData(markdown: string): League[] {
  const leagues: Map<string, League> = new Map();
  const lines = markdown.split('\n');
  
  let currentLeagueName = '';
  let currentCountry = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for league headers
    if (line.startsWith('#') || line.startsWith('**')) {
      const headerText = line.replace(/[#*]/g, '').trim();
      if (headerText && !headerText.match(/^\d/) && headerText.length > 2) {
        const parts = headerText.split(':');
        if (parts.length >= 2) {
          currentCountry = parts[0].trim();
          currentLeagueName = parts.slice(1).join(':').trim();
        } else {
          currentLeagueName = headerText;
          currentCountry = 'World';
        }
      }
    }
    
    // Match patterns for scores
    const patterns = [
      // Pattern: Team1 X - Y Team2
      /^([A-Za-z\s.&']+?)\s+(\d+)\s*[-–]\s*(\d+)\s+([A-Za-z\s.&']+?)(?:\s+(\d+'|HT|FT|LIVE|NS|PST))?$/i,
      // Pattern with time: 15:00 Team1 vs Team2
      /^(\d{1,2}:\d{2})\s+([A-Za-z\s.&']+?)\s+(?:vs?|[-–])\s+([A-Za-z\s.&']+?)$/i,
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let homeTeam: string, awayTeam: string;
        let homeScore: number | null = null, awayScore: number | null = null;
        let status = 'SCHEDULED';
        let minute: string | null = null;
        let startTime = new Date().toISOString();
        
        if (match.length === 6) {
          // Score pattern
          homeTeam = match[1].trim();
          homeScore = parseInt(match[2]);
          awayScore = parseInt(match[3]);
          awayTeam = match[4].trim();
          const statusStr = match[5]?.toUpperCase() || '';
          
          if (statusStr === 'HT') {
            status = 'HT';
            minute = 'HT';
          } else if (statusStr === 'FT') {
            status = 'FT';
          } else if (statusStr === 'NS' || statusStr === 'PST') {
            status = 'SCHEDULED';
          } else if (statusStr.includes("'") || statusStr === 'LIVE') {
            status = 'LIVE';
            minute = statusStr.replace("'", "");
          } else if (homeScore !== null) {
            status = 'LIVE';
          }
        } else if (match.length === 4) {
          // Time pattern (upcoming match)
          const time = match[1];
          homeTeam = match[2].trim();
          awayTeam = match[3].trim();
          
          const [hours, mins] = time.split(':');
          const matchDate = new Date();
          matchDate.setHours(parseInt(hours), parseInt(mins), 0, 0);
          startTime = matchDate.toISOString();
        } else {
          continue;
        }
        
        if (!homeTeam || !awayTeam || homeTeam.length < 2 || awayTeam.length < 2) continue;
        
        const leagueId = currentLeagueName.toLowerCase().replace(/\s/g, '-') || 'unknown';
        
        if (!leagues.has(leagueId)) {
          leagues.set(leagueId, {
            id: leagueId,
            name: currentLeagueName || 'Unknown League',
            country: currentCountry,
            countryFlag: getCountryFlag(currentCountry),
            logo: '',
            matches: [],
          });
        }
        
        const matchId = `fs-${leagueId}-${leagues.get(leagueId)!.matches.length}`;
        
        leagues.get(leagueId)!.matches.push({
          id: matchId,
          homeTeam: {
            id: homeTeam.toLowerCase().replace(/\s/g, '-'),
            name: homeTeam,
            shortName: homeTeam.substring(0, 3).toUpperCase(),
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam)}&background=1a1f2e&color=22c55e&bold=true&size=64`,
          },
          awayTeam: {
            id: awayTeam.toLowerCase().replace(/\s/g, '-'),
            name: awayTeam,
            shortName: awayTeam.substring(0, 3).toUpperCase(),
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam)}&background=1a1f2e&color=22c55e&bold=true&size=64`,
          },
          homeScore,
          awayScore,
          status,
          minute,
          startTime,
          leagueId,
        });
        
        break;
      }
    }
  }
  
  return Array.from(leagues.values());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('Returning cached today matches');
      const allLeagues = cache.data;
      const topLeagues = allLeagues.filter(l => 
        TOP_LEAGUES.some(top => l.name.toLowerCase().includes(top))
      );
      const otherLeagues = allLeagues.filter(l => 
        !TOP_LEAGUES.some(top => l.name.toLowerCase().includes(top))
      );
      
      return new Response(JSON.stringify({
        topLeagues,
        otherLeagues,
        allLeagues,
        count: allLeagues.reduce((acc, l) => acc + l.matches.length, 0),
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
        topLeagues: [],
        otherLeagues: [],
        allLeagues: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping Flashscore today matches...');
    
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
        allLeagues: [],
        count: 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const allLeagues = parseFlashscoreData(markdown);
    
    console.log(`Parsed ${allLeagues.length} leagues from Flashscore`);

    // Update cache
    cache = { data: allLeagues, timestamp: Date.now() };

    const topLeagues = allLeagues.filter(l => 
      TOP_LEAGUES.some(top => l.name.toLowerCase().includes(top))
    );
    const otherLeagues = allLeagues.filter(l => 
      !TOP_LEAGUES.some(top => l.name.toLowerCase().includes(top))
    );

    return new Response(JSON.stringify({
      topLeagues,
      otherLeagues,
      allLeagues,
      count: allLeagues.reduce((acc, l) => acc + l.matches.length, 0),
      date: new Date().toISOString().split('T')[0],
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
      topLeagues: [],
      otherLeagues: [],
      allLeagues: [],
      count: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

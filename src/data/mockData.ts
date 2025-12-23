import { League, Match, Standings, MatchDetails, MatchStatus } from '@/types/match';

// Team logos using placeholder football icons
const getTeamLogo = (teamName: string) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=1a1f2e&color=22c55e&bold=true&size=64`;

const getLeagueLogo = (leagueName: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(leagueName)}&background=22c55e&color=0a0c10&bold=true&size=64&rounded=true`;

const getCountryFlag = (country: string) => {
  const flags: Record<string, string> = {
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Spain': '🇪🇸',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'France': '🇫🇷',
    'Europe': '🇪🇺',
    'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹',
  };
  return flags[country] || '🏳️';
};

export const topLeagues: League[] = [
  {
    id: 'premier-league',
    name: 'Premier League',
    country: 'England',
    countryFlag: getCountryFlag('England'),
    logo: getLeagueLogo('PL'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-1',
        homeTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: getTeamLogo('Arsenal') },
        awayTeam: { id: 'che', name: 'Chelsea', shortName: 'CHE', logo: getTeamLogo('Chelsea') },
        homeScore: 2,
        awayScore: 1,
        status: 'LIVE' as MatchStatus,
        minute: 67,
        startTime: '2024-12-23T15:00:00Z',
        leagueId: 'premier-league',
      },
      {
        id: 'match-2',
        homeTeam: { id: 'mci', name: 'Manchester City', shortName: 'MCI', logo: getTeamLogo('Man City') },
        awayTeam: { id: 'liv', name: 'Liverpool', shortName: 'LIV', logo: getTeamLogo('Liverpool') },
        homeScore: 1,
        awayScore: 1,
        status: 'HT' as MatchStatus,
        minute: 45,
        startTime: '2024-12-23T15:00:00Z',
        leagueId: 'premier-league',
      },
      {
        id: 'match-3',
        homeTeam: { id: 'mun', name: 'Manchester United', shortName: 'MUN', logo: getTeamLogo('Man Utd') },
        awayTeam: { id: 'tot', name: 'Tottenham', shortName: 'TOT', logo: getTeamLogo('Spurs') },
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED' as MatchStatus,
        minute: null,
        startTime: '2024-12-23T20:00:00Z',
        leagueId: 'premier-league',
      },
    ],
  },
  {
    id: 'la-liga',
    name: 'La Liga',
    country: 'Spain',
    countryFlag: getCountryFlag('Spain'),
    logo: getLeagueLogo('LL'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-4',
        homeTeam: { id: 'rma', name: 'Real Madrid', shortName: 'RMA', logo: getTeamLogo('Real Madrid') },
        awayTeam: { id: 'bar', name: 'Barcelona', shortName: 'BAR', logo: getTeamLogo('Barcelona') },
        homeScore: 3,
        awayScore: 2,
        status: 'LIVE' as MatchStatus,
        minute: 78,
        startTime: '2024-12-23T16:00:00Z',
        leagueId: 'la-liga',
      },
      {
        id: 'match-5',
        homeTeam: { id: 'atm', name: 'Atletico Madrid', shortName: 'ATM', logo: getTeamLogo('Atletico') },
        awayTeam: { id: 'sev', name: 'Sevilla', shortName: 'SEV', logo: getTeamLogo('Sevilla') },
        homeScore: 2,
        awayScore: 0,
        status: 'FT' as MatchStatus,
        minute: 90,
        startTime: '2024-12-23T13:00:00Z',
        leagueId: 'la-liga',
      },
    ],
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    country: 'Germany',
    countryFlag: getCountryFlag('Germany'),
    logo: getLeagueLogo('BL'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-6',
        homeTeam: { id: 'bay', name: 'Bayern Munich', shortName: 'BAY', logo: getTeamLogo('Bayern') },
        awayTeam: { id: 'dor', name: 'Borussia Dortmund', shortName: 'BVB', logo: getTeamLogo('Dortmund') },
        homeScore: 0,
        awayScore: 0,
        status: 'LIVE' as MatchStatus,
        minute: 23,
        startTime: '2024-12-23T17:30:00Z',
        leagueId: 'bundesliga',
      },
    ],
  },
  {
    id: 'serie-a',
    name: 'Serie A',
    country: 'Italy',
    countryFlag: getCountryFlag('Italy'),
    logo: getLeagueLogo('SA'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-7',
        homeTeam: { id: 'juv', name: 'Juventus', shortName: 'JUV', logo: getTeamLogo('Juventus') },
        awayTeam: { id: 'int', name: 'Inter Milan', shortName: 'INT', logo: getTeamLogo('Inter') },
        homeScore: 1,
        awayScore: 2,
        status: 'FT' as MatchStatus,
        minute: 90,
        startTime: '2024-12-23T11:30:00Z',
        leagueId: 'serie-a',
      },
      {
        id: 'match-8',
        homeTeam: { id: 'mil', name: 'AC Milan', shortName: 'MIL', logo: getTeamLogo('AC Milan') },
        awayTeam: { id: 'nap', name: 'Napoli', shortName: 'NAP', logo: getTeamLogo('Napoli') },
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED' as MatchStatus,
        minute: null,
        startTime: '2024-12-23T19:45:00Z',
        leagueId: 'serie-a',
      },
    ],
  },
  {
    id: 'ligue-1',
    name: 'Ligue 1',
    country: 'France',
    countryFlag: getCountryFlag('France'),
    logo: getLeagueLogo('L1'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-9',
        homeTeam: { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', logo: getTeamLogo('PSG') },
        awayTeam: { id: 'mon', name: 'Monaco', shortName: 'MON', logo: getTeamLogo('Monaco') },
        homeScore: 4,
        awayScore: 1,
        status: 'LIVE' as MatchStatus,
        minute: 82,
        startTime: '2024-12-23T16:00:00Z',
        leagueId: 'ligue-1',
      },
    ],
  },
  {
    id: 'champions-league',
    name: 'UEFA Champions League',
    country: 'Europe',
    countryFlag: getCountryFlag('Europe'),
    logo: getLeagueLogo('UCL'),
    isTopLeague: true,
    matches: [
      {
        id: 'match-10',
        homeTeam: { id: 'bay', name: 'Bayern Munich', shortName: 'BAY', logo: getTeamLogo('Bayern') },
        awayTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: getTeamLogo('Arsenal') },
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED' as MatchStatus,
        minute: null,
        startTime: '2024-12-24T20:00:00Z',
        leagueId: 'champions-league',
      },
    ],
  },
];

export const otherLeagues: League[] = [
  {
    id: 'eredivisie',
    name: 'Eredivisie',
    country: 'Netherlands',
    countryFlag: getCountryFlag('Netherlands'),
    logo: getLeagueLogo('ERE'),
    matches: [
      {
        id: 'match-11',
        homeTeam: { id: 'aja', name: 'Ajax', shortName: 'AJA', logo: getTeamLogo('Ajax') },
        awayTeam: { id: 'psv', name: 'PSV Eindhoven', shortName: 'PSV', logo: getTeamLogo('PSV') },
        homeScore: 2,
        awayScore: 2,
        status: 'FT' as MatchStatus,
        minute: 90,
        startTime: '2024-12-23T14:30:00Z',
        leagueId: 'eredivisie',
      },
    ],
  },
  {
    id: 'liga-portugal',
    name: 'Liga Portugal',
    country: 'Portugal',
    countryFlag: getCountryFlag('Portugal'),
    logo: getLeagueLogo('LP'),
    matches: [
      {
        id: 'match-12',
        homeTeam: { id: 'ben', name: 'Benfica', shortName: 'BEN', logo: getTeamLogo('Benfica') },
        awayTeam: { id: 'por', name: 'FC Porto', shortName: 'POR', logo: getTeamLogo('Porto') },
        homeScore: 1,
        awayScore: 0,
        status: 'LIVE' as MatchStatus,
        minute: 55,
        startTime: '2024-12-23T18:00:00Z',
        leagueId: 'liga-portugal',
      },
    ],
  },
];

export const allLeagues = [...topLeagues, ...otherLeagues];

export const getLiveMatches = (): Match[] => {
  return allLeagues.flatMap(league => 
    league.matches.filter(match => match.status === 'LIVE' || match.status === 'HT')
  );
};

export const getMatchesByDate = (date: string): League[] => {
  // For demo, return all leagues
  return allLeagues;
};

export const getStandings = (leagueId: string): Standings | null => {
  const standingsData: Record<string, Standings> = {
    'premier-league': {
      leagueId: 'premier-league',
      leagueName: 'Premier League',
      leagueLogo: getLeagueLogo('PL'),
      teams: [
        { position: 1, team: { id: 'liv', name: 'Liverpool', shortName: 'LIV', logo: getTeamLogo('Liverpool') }, played: 17, won: 13, drawn: 3, lost: 1, goalsFor: 40, goalsAgainst: 15, goalDifference: 25, points: 42, form: ['W', 'W', 'D', 'W', 'W'] },
        { position: 2, team: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: getTeamLogo('Arsenal') }, played: 17, won: 10, drawn: 5, lost: 2, goalsFor: 35, goalsAgainst: 18, goalDifference: 17, points: 35, form: ['W', 'D', 'W', 'W', 'D'] },
        { position: 3, team: { id: 'che', name: 'Chelsea', shortName: 'CHE', logo: getTeamLogo('Chelsea') }, played: 17, won: 9, drawn: 5, lost: 3, goalsFor: 35, goalsAgainst: 20, goalDifference: 15, points: 32, form: ['W', 'W', 'L', 'D', 'W'] },
        { position: 4, team: { id: 'not', name: 'Nottingham Forest', shortName: 'NFO', logo: getTeamLogo('Forest') }, played: 17, won: 9, drawn: 4, lost: 4, goalsFor: 25, goalsAgainst: 19, goalDifference: 6, points: 31, form: ['L', 'W', 'W', 'W', 'D'] },
        { position: 5, team: { id: 'mci', name: 'Manchester City', shortName: 'MCI', logo: getTeamLogo('Man City') }, played: 17, won: 8, drawn: 4, lost: 5, goalsFor: 32, goalsAgainst: 24, goalDifference: 8, points: 28, form: ['L', 'L', 'D', 'L', 'W'] },
        { position: 6, team: { id: 'bou', name: 'Bournemouth', shortName: 'BOU', logo: getTeamLogo('Bournemouth') }, played: 17, won: 8, drawn: 4, lost: 5, goalsFor: 28, goalsAgainst: 22, goalDifference: 6, points: 28, form: ['W', 'D', 'W', 'L', 'W'] },
        { position: 7, team: { id: 'ast', name: 'Aston Villa', shortName: 'AVL', logo: getTeamLogo('Villa') }, played: 17, won: 8, drawn: 4, lost: 5, goalsFor: 26, goalsAgainst: 23, goalDifference: 3, points: 28, form: ['D', 'W', 'L', 'W', 'W'] },
        { position: 8, team: { id: 'ful', name: 'Fulham', shortName: 'FUL', logo: getTeamLogo('Fulham') }, played: 17, won: 7, drawn: 5, lost: 5, goalsFor: 26, goalsAgainst: 22, goalDifference: 4, points: 26, form: ['W', 'D', 'D', 'W', 'L'] },
      ],
    },
    'la-liga': {
      leagueId: 'la-liga',
      leagueName: 'La Liga',
      leagueLogo: getLeagueLogo('LL'),
      teams: [
        { position: 1, team: { id: 'bar', name: 'Barcelona', shortName: 'BAR', logo: getTeamLogo('Barcelona') }, played: 18, won: 13, drawn: 4, lost: 1, goalsFor: 48, goalsAgainst: 16, goalDifference: 32, points: 43, form: ['W', 'W', 'W', 'D', 'L'] },
        { position: 2, team: { id: 'rma', name: 'Real Madrid', shortName: 'RMA', logo: getTeamLogo('Real Madrid') }, played: 17, won: 12, drawn: 3, lost: 2, goalsFor: 38, goalsAgainst: 16, goalDifference: 22, points: 39, form: ['W', 'D', 'W', 'W', 'W'] },
        { position: 3, team: { id: 'atm', name: 'Atletico Madrid', shortName: 'ATM', logo: getTeamLogo('Atletico') }, played: 17, won: 11, drawn: 4, lost: 2, goalsFor: 30, goalsAgainst: 12, goalDifference: 18, points: 37, form: ['W', 'W', 'W', 'W', 'D'] },
        { position: 4, team: { id: 'ath', name: 'Athletic Bilbao', shortName: 'ATH', logo: getTeamLogo('Bilbao') }, played: 18, won: 9, drawn: 6, lost: 3, goalsFor: 27, goalsAgainst: 16, goalDifference: 11, points: 33, form: ['D', 'W', 'D', 'W', 'W'] },
      ],
    },
  };

  return standingsData[leagueId] || null;
};

export const getMatchDetails = (matchId: string): MatchDetails | null => {
  const allMatches = allLeagues.flatMap(l => l.matches);
  const match = allMatches.find(m => m.id === matchId);
  
  if (!match) return null;

  const league = allLeagues.find(l => l.id === match.leagueId);
  
  return {
    ...match,
    venue: 'Emirates Stadium',
    referee: 'Michael Oliver',
    attendance: 60243,
    league: {
      id: league?.id || '',
      name: league?.name || '',
      logo: league?.logo || '',
    },
    stats: match.status !== 'SCHEDULED' ? {
      possession: { home: 56, away: 44 },
      shots: { home: 14, away: 9 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 4 },
      fouls: { home: 10, away: 13 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 },
    } : null,
    events: match.status !== 'SCHEDULED' ? [
      { id: 'e1', type: 'goal', minute: 23, team: 'home', playerName: 'M. Saka', assistPlayerName: 'M. Ødegaard' },
      { id: 'e2', type: 'goal', minute: 45, team: 'away', playerName: 'C. Palmer' },
      { id: 'e3', type: 'yellow_card', minute: 52, team: 'away', playerName: 'E. Fernandez' },
      { id: 'e4', type: 'goal', minute: 67, team: 'home', playerName: 'G. Jesus', assistPlayerName: 'B. Saka' },
    ] : [],
  };
};

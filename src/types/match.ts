export type MatchStatus = 'LIVE' | 'HT' | 'FT' | 'SCHEDULED' | 'POSTPONED' | 'CANCELLED';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute: number | null;
  startTime: string;
  leagueId: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  logo: string;
  matches: Match[];
  isTopLeague?: boolean;
}

export interface StandingsTeam {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface Standings {
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  teams: StandingsTeam[];
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var';
  minute: number;
  team: 'home' | 'away';
  playerName: string;
  assistPlayerName?: string;
}

export interface MatchDetails extends Match {
  venue: string;
  referee: string;
  attendance: number | null;
  stats: MatchStats | null;
  events: MatchEvent[];
  league: {
    id: string;
    name: string;
    logo: string;
  };
}

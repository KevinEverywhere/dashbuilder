export const SPORTS_LEAGUES = [
  { value: 'basketball/nba', label: 'NBA' },
  { value: 'baseball/mlb', label: 'MLB' },
  { value: 'football/nfl', label: 'NFL' },
  { value: 'soccer/eng.1', label: 'Premier League' },
] as const;

export interface ScoreboardGame {
  id: string;
  name: string;
  status: string;
  amount: string;
  date: string;
  detail: string;
}

export interface Scoreboard {
  league: string;
  games: ScoreboardGame[];
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  team?: { displayName?: string; abbreviation?: string };
}

interface EspnEvent {
  id?: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: { type?: { state?: string; shortDetail?: string; completed?: boolean } };
  competitions?: Array<{ competitors?: EspnCompetitor[] }>;
}

interface EspnScoreboard {
  events?: EspnEvent[];
  leagues?: Array<{ abbreviation?: string }>;
}

const SAMPLE_GAMES: ScoreboardGame[] = [
  {
    id: 'sample-1',
    name: 'LAL @ BOS',
    status: 'Final',
    amount: '112–108',
    date: 'Tonight',
    detail: 'Sample board — live ESPN feed unavailable',
  },
  {
    id: 'sample-2',
    name: 'DEN @ MIL',
    status: 'Q3',
    amount: '84–79',
    date: 'Live',
    detail: 'Sample board — live ESPN feed unavailable',
  },
];

function stateLabel(state: string | undefined, short: string | undefined): string {
  if (state === 'in') {
    return short || 'Live';
  }
  if (state === 'post') {
    return 'Final';
  }
  return short || 'Scheduled';
}

export async function fetchScoreboard(leaguePath: string, signal?: AbortSignal): Promise<Scoreboard> {
  try {
    const response = await fetch(`/espn/apis/site/v2/sports/${leaguePath}/scoreboard`, { signal });
    if (!response.ok) {
      throw new Error(`Scoreboard request failed (${response.status})`);
    }
    const body = (await response.json()) as EspnScoreboard;
    const games = (body.events ?? []).slice(0, 8).map((event, index) => {
      const competitors = event.competitions?.[0]?.competitors ?? [];
      const home = competitors.find((team) => team.homeAway === 'home');
      const away = competitors.find((team) => team.homeAway === 'away');
      const amount = `${away?.score ?? '0'}–${home?.score ?? '0'}`;
      return {
        id: event.id ?? `game-${index}`,
        name: event.shortName || event.name || 'Matchup',
        status: stateLabel(event.status?.type?.state, event.status?.type?.shortDetail),
        amount,
        date: event.status?.type?.shortDetail || (event.date ?? '').slice(0, 10),
        detail: event.name || `${away?.team?.displayName ?? 'Away'} at ${home?.team?.displayName ?? 'Home'}`,
      };
    });
    if (!games.length) {
      throw new Error('No games on the board');
    }
    return {
      league: body.leagues?.[0]?.abbreviation ?? leaguePath,
      games,
    };
  } catch {
    return { league: leaguePath, games: SAMPLE_GAMES };
  }
}

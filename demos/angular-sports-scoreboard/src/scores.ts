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

export interface OffseasonItem {
  id: string;
  beat: string;
  line: string;
}

export interface LeagueCard {
  path: string;
  label: string;
  offseason: boolean;
  board: Scoreboard;
  lede: string;
  desk: OffseasonItem[];
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

function gamePhase(status: string): 'live' | 'final' | 'scheduled' {
  const value = status.toLowerCase();
  if (value === 'final' || value.startsWith('final')) {
    return 'final';
  }
  if (
    value === 'live' ||
    /\bq[1-4]\b/.test(value) ||
    /\bot\b/.test(value) ||
    value.includes('half') ||
    value.includes('inning') ||
    value.includes('period')
  ) {
    return 'live';
  }
  return 'scheduled';
}

/** No live or final games — the feed is only future tips, so talk off-season. */
export function isOffseason(games: ScoreboardGame[]): boolean {
  return !games.some((game) => gamePhase(game.status) !== 'scheduled');
}

const LEAGUE_LABEL: Record<string, string> = {
  'basketball/nba': 'NBA',
  'baseball/mlb': 'MLB',
  'football/nfl': 'NFL',
  'soccer/eng.1': 'Premier League',
};

const OFFSEASON_DESK: Record<string, { lede: string; desk: Array<[string, string]> }> = {
  'basketball/nba': {
    lede: 'The floor is dark until October. The interesting NBA talk is roster math, not 0–0 openers.',
    desk: [
      ['Draft', 'Lottery clubs are still moving seconds and parking two-ways.'],
      ['Free agency', 'Taxpayer deals and the mid-level are the chips left on the table.'],
      ['Camp', 'Media day sets the first depth-chart fights of the year.'],
      ['Schedule', 'Opening night is posted. Everything before that is rumor season.'],
      ['Film', 'Staffs are already cutting last spring’s closeouts for spacing tells.'],
      ['Summer', 'Vegas leftovers still decide who makes the 15-man.'],
    ],
  },
  'football/nfl': {
    lede: 'Kickoff is still on the horizon. The NFL story right now is the 53-man, not a 0–0 scoreboard.',
    desk: [
      ['Roster', 'Cut-down week turns camp darlings into practice-squad math.'],
      ['QB room', 'Rep counts in August decide who opens week one.'],
      ['Injuries', 'PUP and IR designations are the real preseason standings.'],
      ['Travel', 'Week-one sites are locked; body clocks are the remaining variable.'],
      ['Scheme', 'New coordinators are still installing, not game-planning.'],
      ['Odds', 'Futures boards move on camp buzz long before kickoff.'],
    ],
  },
  'baseball/mlb': {
    lede: 'If the diamond is quiet, the winter market is the sport.',
    desk: [
      ['Hot stove', 'Pitching depth is the first chip every front office counts.'],
      ['Options', 'Club options and QO decisions rewrite the free-agent board.'],
      ['Prospects', 'Rule 5 protection lists leak before the meetings.'],
      ['Skipper', 'Bench jobs turn over faster than the rotation.'],
      ['Awards', 'MVP and Cy Young arguments fill the dead air.'],
      ['Calendar', 'Pitchers and catchers is the next real date on the wall.'],
    ],
  },
  'soccer/eng.1': {
    lede: 'When the Premier League is between match weeks, the window is the story.',
    desk: [
      ['Window', 'Late deals and loan recalls move more points than friendlies.'],
      ['Fixture pile', 'Cup replays and Europe decide who rotates in August.'],
      ['Injuries', 'International breaks rewrite the first XI before Saturday.'],
      ['Table talk', 'Expected goals arguments start before the first red.'],
      ['Manager', 'Press-room tone is the early-season standings.'],
      ['Academy', 'Homegrown minutes are a PSR lever, not a romance.'],
    ],
  },
};

interface EspnNewsArticle {
  headline?: string;
  description?: string;
  published?: string;
  type?: string;
}

interface EspnNews {
  articles?: EspnNewsArticle[];
}

function deskFromCopy(path: string): { lede: string; desk: OffseasonItem[] } {
  const copy = OFFSEASON_DESK[path] ?? OFFSEASON_DESK['basketball/nba'];
  return {
    lede: copy.lede,
    desk: copy.desk.map(([beat, line], index) => ({
      id: `${path}-desk-${index}`,
      beat,
      line,
    })),
  };
}

export async function fetchOffseasonDesk(
  leaguePath: string,
  signal?: AbortSignal,
): Promise<{ lede: string; desk: OffseasonItem[] }> {
  const fallback = deskFromCopy(leaguePath);
  try {
    const response = await fetch(`/espn/apis/site/v2/sports/${leaguePath}/news`, { signal });
    if (!response.ok) {
      return fallback;
    }
    const body = (await response.json()) as EspnNews;
    const articles = (body.articles ?? [])
      .filter((article) => article.headline)
      .slice(0, 6)
      .map((article, index) => ({
        id: `${leaguePath}-news-${index}`,
        beat: article.type === 'HeadlineNews' ? 'News' : article.type || 'Desk',
        line: article.headline ?? '',
      }));
    if (!articles.length) {
      return fallback;
    }
    return {
      lede: fallback.lede,
      desk: articles,
    };
  } catch {
    return fallback;
  }
}

export async function fetchLeagueCard(
  leaguePath: string,
  signal?: AbortSignal,
): Promise<LeagueCard> {
  const board = await fetchScoreboard(leaguePath, signal);
  const label = LEAGUE_LABEL[leaguePath] ?? board.league;
  const offseason = isOffseason(board.games);
  if (!offseason) {
    return {
      path: leaguePath,
      label,
      offseason: false,
      board,
      lede: '',
      desk: [],
    };
  }
  const desk = await fetchOffseasonDesk(leaguePath, signal);
  return {
    path: leaguePath,
    label,
    offseason: true,
    board,
    lede: desk.lede,
    desk: desk.desk,
  };
}

export async function fetchScoreboard(leaguePath: string, signal?: AbortSignal): Promise<Scoreboard> {
  try {
    const response = await fetch(`/espn/apis/site/v2/sports/${leaguePath}/scoreboard`, {
      signal,
    });
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

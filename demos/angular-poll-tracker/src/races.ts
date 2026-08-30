export interface PollCandidate {
  id: string;
  name: string;
  status: string;
  amount: string;
  date: string;
  share: number;
}

export interface PollRace {
  id: string;
  label: string;
  field: string;
  pollster: string;
  sample: string;
  moe: string;
  candidates: PollCandidate[];
}

export const POLL_RACES: PollRace[] = [
  {
    id: 'va-gov',
    label: 'Virginia governor',
    field: 'Governor',
    pollster: 'Roanoke Survey',
    sample: '812 LV',
    moe: '±3.4',
    candidates: [
      { id: 'spanberger', name: 'Spanberger', status: 'D', amount: '48%', date: 'Aug 22', share: 48 },
      { id: 'earle-sears', name: 'Earle-Sears', status: 'R', amount: '44%', date: 'Aug 22', share: 44 },
      { id: 'undecided-va', name: 'Undecided', status: '—', amount: '8%', date: 'Aug 22', share: 8 },
    ],
  },
  {
    id: 'nj-sen',
    label: 'New Jersey senate',
    field: 'U.S. Senate',
    pollster: 'Garden Poll',
    sample: '904 RV',
    moe: '±3.1',
    candidates: [
      { id: 'kim', name: 'Kim', status: 'D', amount: '51%', date: 'Aug 18', share: 51 },
      { id: 'ciattarelli', name: 'Ciattarelli', status: 'R', amount: '41%', date: 'Aug 18', share: 41 },
      { id: 'undecided-nj', name: 'Undecided', status: '—', amount: '8%', date: 'Aug 18', share: 8 },
    ],
  },
  {
    id: 'az-house',
    label: 'Arizona CD-01',
    field: 'U.S. House',
    pollster: 'Desert Research',
    sample: '540 LV',
    moe: '±4.2',
    candidates: [
      { id: 'schweikert', name: 'Schweikert', status: 'R', amount: '46%', date: 'Aug 12', share: 46 },
      { id: 'shah', name: 'Shah', status: 'D', amount: '45%', date: 'Aug 12', share: 45 },
      { id: 'undecided-az', name: 'Undecided', status: '—', amount: '9%', date: 'Aug 12', share: 9 },
    ],
  },
];

export function getPollRace(id: string): PollRace | undefined {
  return POLL_RACES.find((race) => race.id === id);
}

export function raceLead(race: PollRace): string {
  const ranked = [...race.candidates].filter((row) => row.status !== '—').sort((a, b) => b.share - a.share);
  const [lead, trail] = ranked;
  if (!lead || !trail) {
    return '—';
  }
  const gap = lead.share - trail.share;
  if (gap < 1) {
    return 'Tie';
  }
  return `${lead.name} +${gap}`;
}

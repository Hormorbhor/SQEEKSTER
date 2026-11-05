import { LeaderboardEntry } from '../types/game';

export interface ActivityEvent {
  id: string;
  type: 'MAZE_CLEAR' | 'SIM_BET_WON' | 'SIM_BET_PLACED' | 'FAUCET_CLAIM';
  playerAddress: string;
  name: string;
  details: string;
  score: number;
  earningsETH: number;
  timestamp: string;
  timeSeconds?: number;
  levelName?: string;
  verifiedWallet: boolean;
}

const STORAGE_KEY = 'squeek_realtime_activity_memory_v2';

export const INITIAL_SEED_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_seed_1',
    type: 'MAZE_CLEAR',
    playerAddress: '0x71C...8A92',
    name: 'SqueekMaster_99',
    details: 'Cleared Level 5 (Genesis Matrix) with zero damage',
    score: 3850,
    earningsETH: 7.7,
    timeSeconds: 24.2,
    levelName: 'Level 5 - Genesis Matrix',
    timestamp: '2 mins ago',
    verifiedWallet: true,
  },
  {
    id: 'act_seed_2',
    type: 'SIM_BET_WON',
    playerAddress: '0x3F9...1102',
    name: 'RabbyWhale',
    details: 'Won 12.0 ETH bet on Cyber Nibbler (6.0x Payout)',
    score: 2400,
    earningsETH: 12.0,
    timestamp: '8 mins ago',
    verifiedWallet: true,
  },
  {
    id: 'act_seed_3',
    type: 'MAZE_CLEAR',
    playerAddress: '0x12A...49C1',
    name: 'RodentRacer',
    details: 'Cleared Level 3 (Neon Vault) in record speed',
    score: 2100,
    earningsETH: 4.2,
    timeSeconds: 18.5,
    levelName: 'Level 3 - Neon Vault',
    timestamp: '15 mins ago',
    verifiedWallet: false,
  },
  {
    id: 'act_seed_4',
    type: 'FAUCET_CLAIM',
    playerAddress: '0x88D...001F',
    name: 'SepoliaRunner',
    details: 'Claimed +5.00 SepoliaETH Testnet tokens',
    score: 500,
    earningsETH: 5.0,
    timestamp: '32 mins ago',
    verifiedWallet: true,
  },
];

export function getActivityLogs(): ActivityEvent[] {
  if (typeof window === 'undefined') return INITIAL_SEED_ACTIVITIES;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  // Initialize with seed if empty
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ACTIVITIES));
  return INITIAL_SEED_ACTIVITIES;
}

export function recordActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
  const logs = getActivityLogs();
  const newEvent: ActivityEvent = {
    ...event,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  const updated = [newEvent, ...logs].slice(0, 50); // keep last 50 activity items
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Dispatch custom window event for instant live state broadcast across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('squeek_activity_updated', { detail: updated }));
  }

  return newEvent;
}

export function clearActivityMemory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('squeek_activity_updated', { detail: [] }));
  }
}

export function getRealTimeLeaderboard(): LeaderboardEntry[] {
  const logs = getActivityLogs();

  // Filter maze clear and bet win events that have scores
  const scoreEvents = logs.filter((l) => l.score > 0 || l.earningsETH > 0);

  // Map to LeaderboardEntry
  const entries: LeaderboardEntry[] = scoreEvents.map((ev, index) => ({
    rank: index + 1,
    playerAddress: ev.playerAddress,
    name: ev.name,
    level: ev.levelName || ev.details,
    timeSeconds: ev.timeSeconds || 30.0,
    score: ev.score,
    earningsAETH: ev.earningsETH,
    verifiedWallet: ev.verifiedWallet,
  }));

  // Sort by highest score descending
  return entries.sort((a, b) => b.score - a.score);
}

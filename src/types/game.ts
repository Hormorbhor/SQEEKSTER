export interface HamsterStats {
  speed: number;        // 1 - 100
  agility: number;      // 1 - 100
  trapEvasion: number;  // 1 - 100
  stamina: number;      // 1 - 100
  courage: number;      // 1 - 100
}

export interface Hamster {
  id: string;
  name: string;
  breed: string;
  color: string;
  accentColor: string;
  stats: HamsterStats;
  winRate: number;      // percentage e.g. 48.5
  odds: number;         // payout multiplier e.g. 2.4
  wins: number;
  losses: number;
  totalRaces: number;
  specialSkill: string;
  bio: string;
  avatarIcon: string;   // emoji or canvas render key
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balanceAETH: number;
  chainName: string;
  chainId: string;
  isRabby: boolean;
  hasHamsterPass: boolean;
}

export type GridCellType = 
  | 0 // Empty path
  | 1 // Wall
  | 2 // Trap (Spike / Mine)
  | 3 // Cheese reward
  | 4 // Start point
  | 5 // Exit Portal
  | 6 // Powerup (Shield/Speed)
  | 7 // Hidden Trap (Revealed by light!)

export interface MazeLevel {
  id: number;
  name: string;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  difficulty: 'ENTRY' | 'VETERAN' | 'CYBER' | 'GENESIS';
  parTimeSeconds: number;
  grid: GridCellType[][];
  themeColor: string;
  description: string;
  rewardsCount: number;
}

export interface MatchBet {
  id: string;
  hamsterId: string;
  amountAETH: number;
  potentialPayout: number;
  timestamp: string;
  status: 'PENDING' | 'WON' | 'LOST';
}

export interface PvPBetMatch {
  id: string;
  title: string;
  levelId: number;
  entryFeeAETH: number;
  prizePoolAETH: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  creatorAddress: string;
  winnerAddress?: string;
  contractAddress: string;
  txHash: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  name: string;
  level: string;
  timeSeconds: number;
  score: number;
  earningsAETH: number;
  verifiedWallet: boolean;
}

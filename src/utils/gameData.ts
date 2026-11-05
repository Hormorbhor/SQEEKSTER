import { Hamster, MazeLevel, PvPBetMatch, LeaderboardEntry, GridCellType } from '../types/game';

export const HAMSTER_RACERS: Hamster[] = [
  {
    id: 'hamster_1',
    name: 'Squeek Supreme',
    breed: 'Syrian Cyber-Rodent',
    color: '#E61938',
    accentColor: '#FF5E78',
    stats: { speed: 88, agility: 92, trapEvasion: 85, stamina: 90, courage: 84 },
    winRate: 64.2,
    odds: 2.10,
    wins: 48,
    losses: 27,
    totalRaces: 75,
    specialSkill: 'Quantum Sprint (Immune to first trap)',
    bio: 'Champion of the Ethereum Sepolia Genesis trial. High agility and supreme trap detection.',
    avatarIcon: '🐹'
  },
  {
    id: 'hamster_2',
    name: 'Pyro Whiskers',
    breed: 'Roborovski Ember',
    color: '#FF4500',
    accentColor: '#FFA500',
    stats: { speed: 95, agility: 78, trapEvasion: 70, stamina: 82, courage: 96 },
    winRate: 58.0,
    odds: 2.80,
    wins: 36,
    losses: 26,
    totalRaces: 62,
    specialSkill: 'Flame Burst (Breaks nearby walls)',
    bio: 'Raw acceleration monster. Aggressive maze style that risks traps for high speed.',
    avatarIcon: '🔥'
  },
  {
    id: 'hamster_3',
    name: 'Cyber Nibbles',
    breed: 'Dwarf Holographic',
    color: '#00F0FF',
    accentColor: '#70F8FF',
    stats: { speed: 76, agility: 96, trapEvasion: 94, stamina: 75, courage: 80 },
    winRate: 51.5,
    odds: 3.40,
    wins: 31,
    losses: 29,
    totalRaces: 60,
    specialSkill: 'Phase Shift (Slips through corner traps)',
    bio: 'Precision navigator that excels in tight serpentine corridors and laser grids.',
    avatarIcon: '⚡'
  },
  {
    id: 'hamster_4',
    name: 'Bloodline Apex',
    breed: 'Genesis Alpha',
    color: '#990B1E',
    accentColor: '#DC2626',
    stats: { speed: 92, agility: 89, trapEvasion: 88, stamina: 94, courage: 92 },
    winRate: 72.8,
    odds: 1.85,
    wins: 59,
    losses: 22,
    totalRaces: 81,
    specialSkill: 'Vampiric Boost (Gains stamina from cheese)',
    bio: 'Undefeated legend in high-stakes Ethereum Sepolia contract matches.',
    avatarIcon: '👑'
  },
  {
    id: 'hamster_5',
    name: 'Shadow Spectre',
    breed: 'Black Velvet Phantom',
    color: '#4B0082',
    accentColor: '#9370DB',
    stats: { speed: 82, agility: 91, trapEvasion: 89, stamina: 84, courage: 88 },
    winRate: 44.0,
    odds: 4.20,
    wins: 22,
    losses: 28,
    totalRaces: 50,
    specialSkill: 'Shadow Camo (Rays do not trigger mines)',
    bio: 'Moves undetected through dark sensory fog. A fan favorite longshot.',
    avatarIcon: '👁️'
  },
  {
    id: 'hamster_6',
    name: 'Mecha Fluff',
    breed: 'Armored Cyber-Dwarf',
    color: '#71717A',
    accentColor: '#A1A1AA',
    stats: { speed: 70, agility: 80, trapEvasion: 98, stamina: 96, courage: 90 },
    winRate: 49.0,
    odds: 3.80,
    wins: 25,
    losses: 26,
    totalRaces: 51,
    specialSkill: 'Titan Shell (Absorbs 2 trap hits)',
    bio: 'Built like a tank. Takes damage without slowing down, perfect for trap-heavy mazes.',
    avatarIcon: '🛡️'
  },
  {
    id: 'hamster_7',
    name: 'Ethereum Sepolia King',
    breed: 'Chain Gold Rodent',
    color: '#EAB308',
    accentColor: '#FDE047',
    stats: { speed: 85, agility: 85, trapEvasion: 82, stamina: 88, courage: 85 },
    winRate: 55.4,
    odds: 3.00,
    wins: 36,
    losses: 29,
    totalRaces: 65,
    specialSkill: 'Golden Magnet (Pulls rewards from distance)',
    bio: 'Backed by smart contract automated payouts. Extremely balanced performance.',
    avatarIcon: '💰'
  },
  {
    id: 'hamster_8',
    name: 'Quantum Squeak',
    breed: 'Particle Racer',
    color: '#A855F7',
    accentColor: '#C084FC',
    stats: { speed: 94, agility: 72, trapEvasion: 65, stamina: 70, courage: 95 },
    winRate: 39.2,
    odds: 5.50,
    wins: 19,
    losses: 29,
    totalRaces: 48,
    specialSkill: 'Time Warp (Brief speed burst)',
    bio: 'Erratic and hyper-fast. High volatility with massive payout potential.',
    avatarIcon: '🌌'
  },
  {
    id: 'hamster_9',
    name: 'Neon Chomp',
    breed: 'Cyberpunk Striker',
    color: '#EC4899',
    accentColor: '#F472B6',
    stats: { speed: 89, agility: 75, trapEvasion: 60, stamina: 80, courage: 82 },
    winRate: 33.1,
    odds: 7.20,
    wins: 14,
    losses: 28,
    totalRaces: 42,
    specialSkill: 'Sonic Bark (Clears obstacles)',
    bio: 'Wild card runner known for thrilling comebacks in final stretch turns.',
    avatarIcon: '⚡'
  },
  {
    id: 'hamster_10',
    name: 'Crimson Titan',
    breed: 'Squeekchain Behemoth',
    color: '#7F1D1D',
    accentColor: '#EF4444',
    stats: { speed: 90, agility: 68, trapEvasion: 55, stamina: 92, courage: 99 },
    winRate: 28.5,
    odds: 9.50,
    wins: 12,
    losses: 30,
    totalRaces: 42,
    specialSkill: 'Berserker Dash (Blasts straight through mazes)',
    bio: 'Extreme underdog. If Crimson Titan dodges early traps, no one can stop him.',
    avatarIcon: '🩸'
  }
];

// Helper to generate spacious, BFS-validated maze layout grids with zero blockages
export function generateMazeGrid(width: number, height: number, density: number = 0.18): GridCellType[][] {
  const grid: GridCellType[][] = Array.from({ length: height }, () => Array(width).fill(0 as GridCellType));

  // 1. Boundary walls
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (r === 0 || r === height - 1 || c === 0 || c === width - 1) {
        grid[r][c] = 1; // Solid outer wall
      }
    }
  }

  // 2. Structured interior walls (Placing wall blocks with generous 2-tile wide corridors)
  for (let r = 2; r < height - 2; r += 2) {
    for (let c = 2; c < width - 2; c += 2) {
      if (Math.random() < 0.60) {
        grid[r][c] = 1;
        // Extend wall in one random cardinal direction to form neat tactical barriers
        const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const nr = r + dr;
        const nc = c + dc;
        if (nr > 0 && nr < height - 1 && nc > 0 && nc < width - 1) {
          grid[nr][nc] = 1;
        }
      }
    }
  }

  // Set Start (1,1) and Exit (width-2, height-2)
  grid[1][1] = 4; // Start
  grid[height - 2][width - 2] = 5; // Exit

  // Clear 3x3 surrounding zones at start and exit for complete freedom of movement
  for (let dr = 0; dr <= 2; dr++) {
    for (let dc = 0; dc <= 2; dc++) {
      if (1 + dr < height - 1 && 1 + dc < width - 1) grid[1 + dr][1 + dc] = 0;
      if (height - 2 - dr > 0 && width - 2 - dc > 0) grid[height - 2 - dr][width - 2 - dc] = 0;
    }
  }

  // 3. BFS Validator to guarantee path exists from Start (1,1) to Exit (width-2, height-2)
  const isReachable = (startR: number, startC: number, targetR: number, targetC: number): boolean => {
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const queue: [number, number][] = [[startR, startC]];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      if (r === targetR && c === targetC) return true;

      const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
          if (!visited[nr][nc] && grid[nr][nc] !== 1) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }
    return false;
  };

  // If exit is not reachable, carve a clear connecting corridor
  if (!isReachable(1, 1, height - 2, width - 2)) {
    let currR = 1;
    let currC = 1;
    while (currR < height - 2 || currC < width - 2) {
      grid[currR][currC] = 0;
      if (currR < height - 2 && (Math.random() < 0.5 || currC === width - 2)) {
        currR++;
      } else if (currC < width - 2) {
        currC++;
      }
    }
  }

  // 4. Place rewards (3), traps (2), and powerups (6) strictly on reachable, open floor cells
  const openCells: [number, number][] = [];
  for (let r = 1; r < height - 1; r++) {
    for (let c = 1; c < width - 1; c++) {
      if (grid[r][c] === 0 && isReachable(1, 1, r, c)) {
        // Keep immediate start area clear
        if (Math.hypot(r - 1, c - 1) > 2) {
          openCells.push([r, c]);
        }
      }
    }
  }

  // Shuffle open cells
  openCells.sort(() => Math.random() - 0.5);

  const rewardCount = Math.min(openCells.length, Math.floor(width * 0.75));
  const trapCount = Math.min(openCells.length - rewardCount, Math.floor(width * 0.35));
  const powerupCount = Math.min(openCells.length - rewardCount - trapCount, 3);

  let idx = 0;
  for (let i = 0; i < rewardCount && idx < openCells.length; i++, idx++) {
    const [r, c] = openCells[idx];
    grid[r][c] = 3; // Cheese Reward
  }
  for (let i = 0; i < trapCount && idx < openCells.length; i++, idx++) {
    const [r, c] = openCells[idx];
    grid[r][c] = 2; // Spike Trap
  }
  for (let i = 0; i < powerupCount && idx < openCells.length; i++, idx++) {
    const [r, c] = openCells[idx];
    grid[r][c] = 6; // Powerup Core
  }

  grid[1][1] = 4; // Ensure start point
  grid[height - 2][width - 2] = 5; // Ensure exit portal

  return grid;
}

export const INITIAL_MAZE_LEVELS: MazeLevel[] = [
  {
    id: 1,
    name: 'Level 1: Squeek Lab Alpha',
    subtitle: 'Entry Grid · Sensor Calibration',
    gridWidth: 12,
    gridHeight: 12,
    difficulty: 'ENTRY',
    parTimeSeconds: 45,
    themeColor: '#E61938',
    description: 'Learn mouse steering, collect cheese rewards, and locate the glowing exit portal.',
    rewardsCount: 6,
    grid: generateMazeGrid(12, 12, 0.22)
  },
  {
    id: 2,
    name: 'Level 2: Dark Red Reactor',
    subtitle: 'Hazard Area · Laser Traps',
    gridWidth: 14,
    gridHeight: 14,
    difficulty: 'VETERAN',
    parTimeSeconds: 60,
    themeColor: '#DC2626',
    description: 'Avoid razor traps and glowing spike hazards. Keep clear of active hazard cells.',
    rewardsCount: 9,
    grid: generateMazeGrid(14, 14, 0.26)
  },
  {
    id: 3,
    name: 'Level 3: Ethereum Sepolia Core',
    subtitle: 'High Security · Quantum Walls',
    gridWidth: 16,
    gridHeight: 16,
    difficulty: 'CYBER',
    parTimeSeconds: 80,
    themeColor: '#B91C1C',
    description: 'Densely packed maze walls with responsive neon highlights. Collect all rewards before exit.',
    rewardsCount: 12,
    grid: generateMazeGrid(16, 16, 0.30)
  },
  {
    id: 4,
    name: 'Level 4: Shadow Abyss Grid',
    subtitle: 'Deep Labyrinth · Dark Red Neon',
    gridWidth: 18,
    gridHeight: 18,
    difficulty: 'CYBER',
    parTimeSeconds: 100,
    themeColor: '#990B1E',
    description: 'Complex multi-turn labyrinth on Ethereum Sepolia. Direct your hamster with precision.',
    rewardsCount: 15,
    grid: generateMazeGrid(18, 18, 0.32)
  },
  {
    id: 5,
    name: 'Level 5: Squeek Genesis Vault',
    subtitle: 'Master Trial · Ultimate Contract',
    gridWidth: 20,
    gridHeight: 20,
    difficulty: 'GENESIS',
    parTimeSeconds: 120,
    themeColor: '#7F1D1D',
    description: 'The pinnacle Squeekchain maze. Moving trap clusters, high stakes, and maximum Sepolia ETH rewards.',
    rewardsCount: 18,
    grid: generateMazeGrid(20, 20, 0.35)
  }
];

export const INITIAL_PVP_MATCHES: PvPBetMatch[] = [
  {
    id: 'match_101',
    title: 'Ethereum Sepolia Speedrun Cup #1',
    levelId: 2,
    entryFeeAETH: 0.1,
    prizePoolAETH: 0.4,
    maxPlayers: 4,
    currentPlayers: 3,
    status: 'OPEN',
    creatorAddress: '0x71C...392A',
    contractAddress: '0x39a1B74C9aE8019C28181A129038',
    txHash: '0x9a8f...4e1b',
    createdAt: '5 mins ago'
  },
  {
    id: 'match_102',
    title: 'High Stakes Genesis Duels 1v1',
    levelId: 5,
    entryFeeAETH: 0.5,
    prizePoolAETH: 1.0,
    maxPlayers: 2,
    currentPlayers: 1,
    status: 'OPEN',
    creatorAddress: '0xE92...A01B',
    contractAddress: '0x882bF4C2a912B90382B1a39',
    txHash: '0x3d4e...789c',
    createdAt: '12 mins ago'
  },
  {
    id: 'match_103',
    title: 'Community Traps Challenge',
    levelId: 3,
    entryFeeAETH: 0.05,
    prizePoolAETH: 0.2,
    maxPlayers: 4,
    currentPlayers: 4,
    status: 'IN_PROGRESS',
    creatorAddress: '0x14D...890C',
    contractAddress: '0x771aC49e00184A716298',
    txHash: '0x12bc...34de',
    createdAt: '18 mins ago'
  }
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerAddress: '0x8b32...4f91', name: 'SqueekLord_Eth', level: 'Genesis Vault', timeSeconds: 38.4, score: 14850, earningsAETH: 4.82, verifiedWallet: true },
  { rank: 2, playerAddress: '0x3a19...9e22', name: 'RabbyRunner_X', level: 'Genesis Vault', timeSeconds: 41.2, score: 13900, earningsAETH: 3.25, verifiedWallet: true },
  { rank: 3, playerAddress: '0x7c45...1a08', name: 'HamsterMatrix', level: 'Shadow Abyss', timeSeconds: 44.8, score: 12600, earningsAETH: 2.41, verifiedWallet: true },
  { rank: 4, playerAddress: '0xd920...6b33', name: 'PyroSqueek', level: 'Ethereum Sepolia Core', timeSeconds: 48.1, score: 11200, earningsAETH: 1.80, verifiedWallet: true },
  { rank: 5, playerAddress: '0x5e88...2c44', name: 'CyberWhiskers', level: 'Dark Red Reactor', timeSeconds: 52.3, score: 9800, earningsAETH: 1.24, verifiedWallet: false },
];

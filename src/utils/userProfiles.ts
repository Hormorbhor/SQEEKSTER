import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { recordActivity } from './activityMemory';

export interface UserProfile {
  walletAddress: string;
  username: string;
  twitterHandle: string;
  bio: string;
  avatarIcon: string;
  highScore: number;
  levelsCleared: number;
  totalEthEarned: number;
  currentStreak?: number;
  lastActiveDate?: string;
  squeekXP?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CloudLeaderboardRecord {
  id?: string;
  playerAddress: string;
  username: string;
  twitterHandle: string;
  levelName: string;
  timeSeconds: number;
  score: number;
  earningsETH: number;
  squeekXP?: number;
  verifiedWallet: boolean;
  createdAt?: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Fetch user profile by wallet address
export async function fetchUserProfile(address: string): Promise<UserProfile | null> {
  if (!address) return null;
  const cleanAddr = address.toLowerCase();
  try {
    const docRef = doc(db, 'profiles', cleanAddr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `profiles/${cleanAddr}`);
  }
  return null;
}

// Save or update user profile in Firestore
export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const cleanAddr = profile.walletAddress.toLowerCase();
  const data: UserProfile = {
    ...profile,
    walletAddress: cleanAddr,
    twitterHandle: profile.twitterHandle ? profile.twitterHandle.replace(/^@/, '').trim() : '',
    currentStreak: profile.currentStreak || 1,
    squeekXP: profile.squeekXP || 50,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'profiles', cleanAddr);
    await setDoc(docRef, data, { merge: true });

    // Also record event locally
    recordActivity({
      type: 'FAUCET_CLAIM',
      playerAddress: cleanAddr.slice(0, 6) + '...' + cleanAddr.slice(-4),
      name: data.username,
      details: `Profile Updated (Streak: 🔥 ${data.currentStreak} Days · ${data.squeekXP} XP)`,
      score: 100,
      earningsETH: 0,
      verifiedWallet: true,
    });

    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `profiles/${cleanAddr}`);
    throw err;
  }
}

// Record Daily Streak & Grant Squeek XP
export async function recordDailyActivity(address: string): Promise<{
  currentStreak: number;
  xpGained: number;
  squeekXP: number;
  isNewDay: boolean;
}> {
  if (!address) {
    return { currentStreak: 1, xpGained: 50, squeekXP: 50, isNewDay: false };
  }

  const profile = await fetchUserProfile(address);
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let streak = profile?.currentStreak || 0;
  let xp = profile?.squeekXP || 0;
  const lastActive = profile?.lastActiveDate || '';
  let isNewDay = false;

  if (lastActive === today) {
    // Already active today, grant standard 15 Squeek XP per additional race
    const xpGained = 15;
    xp += xpGained;
    if (profile) {
      await saveUserProfile({ ...profile, squeekXP: xp });
    }
    return { currentStreak: streak || 1, xpGained, squeekXP: xp, isNewDay: false };
  }

  isNewDay = true;
  if (lastActive === yesterday) {
    // Consecutive active day!
    streak = (streak || 0) + 1;
  } else {
    // Broken streak or fresh start
    streak = 1;
  }

  // Base Daily XP (75 XP) + Streak Bonus (streak * 30 XP)
  const xpGained = 75 + streak * 30;
  xp += xpGained;

  if (profile) {
    await saveUserProfile({
      ...profile,
      currentStreak: streak,
      lastActiveDate: today,
      squeekXP: xp,
    });
  }

  return { currentStreak: streak, xpGained, squeekXP: xp, isNewDay: true };
}

// Submit score to Cloud Leaderboard
export async function submitCloudScore(record: Omit<CloudLeaderboardRecord, 'id' | 'createdAt'>): Promise<void> {
  try {
    const colRef = collection(db, 'leaderboard');
    await addDoc(colRef, {
      ...record,
      playerAddress: record.playerAddress.toLowerCase(),
      twitterHandle: record.twitterHandle ? record.twitterHandle.replace(/^@/, '').trim() : '',
      createdAt: new Date().toISOString(),
    });

    // Also update high score & streak on profile
    if (record.playerAddress) {
      const profile = await fetchUserProfile(record.playerAddress);
      if (profile) {
        const isBetterScore = record.score > profile.highScore;
        await saveUserProfile({
          ...profile,
          highScore: isBetterScore ? record.score : profile.highScore,
          levelsCleared: (profile.levelsCleared || 0) + 1,
          totalEthEarned: (profile.totalEthEarned || 0) + record.earningsETH,
          squeekXP: (profile.squeekXP || 0) + (record.squeekXP || 50),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'leaderboard');
  }
}

// Real-time listener for Cloud Leaderboard
export function subscribeCloudLeaderboard(
  callback: (records: CloudLeaderboardRecord[]) => void
): () => void {
  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, orderBy('score', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const records: CloudLeaderboardRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...docSnap.data() } as CloudLeaderboardRecord);
        });
        callback(records);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'leaderboard');
      }
    );
  } catch (e) {
    console.warn('Leaderboard subscription error', e);
    return () => {};
  }
}

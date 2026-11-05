import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveMazeGame from './components/LiveMazeGame';
import HamsterSimulation from './components/HamsterSimulation';
import Leaderboard from './components/Leaderboard';
import WalletModal from './components/WalletModal';
import UserProfileModal from './components/UserProfileModal';
import { WalletState } from './types/game';
import { getInitialWalletState, saveWalletState, formatAddress, fetchRealSepoliaBalance } from './utils/web3';
import { fetchUserProfile, submitCloudScore, recordDailyActivity, UserProfile } from './utils/userProfiles';
import { recordActivity } from './utils/activityMemory';
import { ExternalLink, Flame, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'MAZE' | 'SIMULATION' | 'LEADERBOARD'>('MAZE');
  const [wallet, setWalletState] = useState<WalletState>(getInitialWalletState);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [streakToastMsg, setStreakToastMsg] = useState<string | null>(null);

  // Keep state saved
  const setWallet = (w: WalletState) => {
    setWalletState(w);
    saveWalletState(w);
  };

  // Fetch user profile when wallet address changes
  useEffect(() => {
    if (!wallet.address) {
      setCurrentUserProfile(null);
      return;
    }
    fetchUserProfile(wallet.address).then((profile) => {
      if (profile) setCurrentUserProfile(profile);
    });
  }, [wallet.address]);

  // Automatically refresh real SepoliaETH balance on load and when connected
  useEffect(() => {
    if (!wallet.address) return;

    let isMounted = true;
    const updateBalance = async () => {
      const realBal = await fetchRealSepoliaBalance(wallet.address!);
      if (isMounted && wallet.balanceAETH !== realBal) {
        setWalletState((prev) => {
          const updated = { ...prev, balanceAETH: realBal };
          saveWalletState(updated);
          return updated;
        });
      }
    };

    updateBalance();

    // Listen for Web3 Rabby Wallet account / chain change events
    const ethereum = (window as unknown as { ethereum?: { on?: (event: string, handler: (params: unknown) => void) => void } }).ethereum;
    if (ethereum && typeof ethereum.on === 'function') {
      const handleAccountsChanged = async (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs && accs.length > 0) {
          const newAddress = accs[0];
          const realBal = await fetchRealSepoliaBalance(newAddress);
          setWalletState((prev) => {
            const updated = { ...prev, address: newAddress, balanceAETH: realBal, isConnected: true };
            saveWalletState(updated);
            return updated;
          });
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', updateBalance);
    }

    const interval = setInterval(updateBalance, 15000); // refresh every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [wallet.address, wallet.balanceAETH]);

  // Handle score submission from maze win
  const handleScoreSubmit = async (levelName: string, timeSeconds: number, score: number) => {
    const earningsETH = Math.round((score / 500) * 10) / 10;
    const playerAddr = wallet.address ? wallet.address : '0xGuest...User';

    // Update daily streak and grant Squeek XP bonus
    let xpAwarded = 50;
    if (wallet.address) {
      const streakRes = await recordDailyActivity(wallet.address);
      xpAwarded = streakRes.xpGained;
      setStreakToastMsg(`🔥 Day ${streakRes.currentStreak} Streak! +${streakRes.xpGained} Squeek XP Bonus Granted!`);
      setTimeout(() => setStreakToastMsg(null), 4000);

      // Refresh profile state
      const updatedP = await fetchUserProfile(wallet.address);
      if (updatedP) setCurrentUserProfile(updatedP);
    }

    const username = currentUserProfile?.username || (wallet.address ? `Runner_${wallet.address.slice(2, 6)}` : 'Squeek_Runner');
    const twitterHandle = currentUserProfile?.twitterHandle || '';

    // Record in local memory
    recordActivity({
      type: 'MAZE_CLEAR',
      playerAddress: formatAddress(playerAddr),
      name: username,
      details: `Cleared ${levelName} in ${timeSeconds.toFixed(1)}s (+${xpAwarded} Squeek XP)`,
      score,
      earningsETH,
      timeSeconds,
      levelName,
      verifiedWallet: wallet.isConnected,
    });

    // Submit to Cloud Firestore Real Leaderboard
    if (wallet.isConnected && wallet.address) {
      await submitCloudScore({
        playerAddress: wallet.address,
        username,
        twitterHandle,
        levelName,
        timeSeconds,
        score,
        earningsETH,
        squeekXP: xpAwarded,
        verifiedWallet: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050203] text-zinc-100 flex flex-col font-cyber relative selection:bg-red-600 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        streakCount={currentUserProfile?.currentStreak || 1}
        squeekXP={currentUserProfile?.squeekXP || 50}
      />

      {/* Daily Streak & Squeek XP Toast Notification */}
      {streakToastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border border-amber-500/80 p-3.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] text-xs font-cyber text-amber-300 flex items-center gap-2.5 animate-bounce">
          <Flame className="w-5 h-5 text-amber-400 fill-amber-500 shrink-0" />
          <div className="font-bold">{streakToastMsg}</div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 py-4 md:py-8">
        {activeTab === 'MAZE' && (
          <LiveMazeGame
            wallet={wallet}
            onScoreSubmit={handleScoreSubmit}
          />
        )}

        {activeTab === 'SIMULATION' && (
          <HamsterSimulation
            wallet={wallet}
            setWallet={setWallet}
          />
        )}

        {activeTab === 'LEADERBOARD' && (
          <Leaderboard onOpenProfileModal={() => setIsProfileModalOpen(true)} />
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        wallet={wallet}
        onProfileUpdated={(p) => setCurrentUserProfile(p)}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        setWallet={setWallet}
      />

      {/* Dark Red Footer */}
      <footer className="border-t border-red-950/80 bg-[#070305] py-6 px-4 md:px-8 text-xs font-tech text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-red-500 text-glow-red text-xs">SQUEEK GENESIS</span>
            <span>·</span>
            <span>Ethereum Sepolia (Chain 11155111)</span>
            <span>·</span>
            <span className="text-zinc-400">Rabby Wallet Native</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://squeekchain.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              squeekchain.com <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="hover:text-red-400 transition-colors cursor-pointer"
            >
              Contract Specs
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

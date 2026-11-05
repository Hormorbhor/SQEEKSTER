import { WalletState } from '../types/game';
import { formatAddress } from '../utils/web3';
import { Wallet, ShieldCheck, Zap, User, Flame } from 'lucide-react';

interface NavbarProps {
  activeTab: 'MAZE' | 'SIMULATION' | 'LEADERBOARD';
  setActiveTab: (tab: 'MAZE' | 'SIMULATION' | 'LEADERBOARD') => void;
  wallet: WalletState;
  onOpenWalletModal: () => void;
  onOpenProfileModal: () => void;
  streakCount?: number;
  squeekXP?: number;
}

export default function Navbar({ activeTab, setActiveTab, wallet, onOpenWalletModal, onOpenProfileModal, streakCount = 1, squeekXP = 50 }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#070305]/95 backdrop-blur-md border-b border-red-950/80 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('MAZE')}
          className="flex items-center gap-2.5 group text-left shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-500 font-pixel text-lg shadow-[0_0_12px_rgba(230,25,56,0.5)] group-hover:scale-105 transition-transform">
            🐹
          </div>
          <div>
            <div className="font-pixel text-xs md:text-sm tracking-wider text-red-500 text-glow-red whitespace-nowrap">
              SQUEEK GENESIS
            </div>
            <div className="text-[10px] font-tech text-red-400/70 tracking-widest uppercase hidden sm:block">
              ETH Sepolia · Chain 11155111
            </div>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-red-950/30 p-1 rounded-lg border border-red-900/40">
          <button
            onClick={() => setActiveTab('MAZE')}
            className={`px-3.5 py-1.5 text-xs font-cyber font-semibold rounded transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MAZE'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(230,25,56,0.6)]'
                : 'text-zinc-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            Live Hamster Maze
          </button>

          <button
            onClick={() => setActiveTab('SIMULATION')}
            className={`px-3.5 py-1.5 text-xs font-cyber font-semibold rounded transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SIMULATION'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(230,25,56,0.6)]'
                : 'text-zinc-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <span>🏁</span>
            10-Hamster Sim
          </button>

          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`px-3.5 py-1.5 text-xs font-cyber font-semibold rounded transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LEADERBOARD'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(230,25,56,0.6)]'
                : 'text-zinc-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <span>🏆</span>
            Leaderboard
          </button>
        </nav>

        {/* Zone 3: Primary Action (Profile & Rabby Wallet Buttons) */}
        <div className="flex items-center gap-2 shrink-0">
          {wallet.isConnected && (
            <>
              {/* Daily Streak Counter Badge */}
              <button
                onClick={onOpenProfileModal}
                className="px-2.5 py-1.5 bg-amber-950/70 border border-amber-500/60 rounded-md text-amber-400 font-pixel text-[11px] flex items-center gap-1 cursor-pointer hover:bg-amber-900/80 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                title={`${streakCount} Day Daily Streak Active!`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>{streakCount}D</span>
              </button>

              {/* Squeek XP Badge */}
              <button
                onClick={onOpenProfileModal}
                className="hidden lg:flex px-2.5 py-1.5 bg-emerald-950/70 border border-emerald-500/60 rounded-md text-emerald-400 font-mono font-bold text-[11px] items-center gap-1 cursor-pointer hover:bg-emerald-900/80 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                title={`${squeekXP} Squeek XP`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
                <span>{squeekXP} XP</span>
              </button>

              <button
                onClick={onOpenProfileModal}
                className="px-3 py-2 text-xs font-tech font-bold rounded-md bg-red-950/60 border border-red-700/60 text-red-200 hover:border-red-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(230,25,56,0.2)]"
              >
                <User className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenWalletModal}
            className={`px-4 py-2 text-xs font-tech font-bold rounded-md border transition-all flex items-center gap-2 cursor-pointer ${
              wallet.isConnected
                ? 'bg-red-950/80 border-red-500/80 text-red-200 hover:border-red-400 shadow-[0_0_10px_rgba(230,25,56,0.3)]'
                : 'bg-gradient-to-r from-red-700 to-red-600 border-red-400 text-white hover:from-red-600 hover:to-red-500 shadow-[0_0_15px_rgba(230,25,56,0.5)]'
            }`}
          >
            {wallet.isConnected ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline font-mono">{formatAddress(wallet.address)}</span>
                <span className="bg-red-900/90 text-red-300 px-2 py-0.5 rounded font-mono text-[11px] border border-red-700/50">
                  {wallet.balanceAETH.toFixed(2)} ETH
                </span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect Rabby Wallet</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Mobile sub-navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-red-950/60 mt-2.5 pt-2 text-[11px] font-cyber">
        <button
          onClick={() => setActiveTab('MAZE')}
          className={`py-1 px-2 rounded ${activeTab === 'MAZE' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}
        >
          Maze
        </button>
        <button
          onClick={() => setActiveTab('SIMULATION')}
          className={`py-1 px-2 rounded ${activeTab === 'SIMULATION' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}
        >
          Sim (10)
        </button>
        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`py-1 px-2 rounded ${activeTab === 'LEADERBOARD' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}
        >
          Ranks
        </button>
      </div>
    </header>
  );
}

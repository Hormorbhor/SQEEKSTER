import React, { useState, useEffect } from 'react';
import { subscribeCloudLeaderboard, CloudLeaderboardRecord } from '../utils/userProfiles';
import { getActivityLogs, ActivityEvent } from '../utils/activityMemory';
import { Trophy, ShieldCheck, Zap, RefreshCw, Database, History, Coins, Flame, Award, Clock, Twitter, ExternalLink, User } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface LeaderboardProps {
  onOpenProfileModal?: () => void;
}

export default function Leaderboard({ onOpenProfileModal }: LeaderboardProps) {
  const [cloudRecords, setCloudRecords] = useState<CloudLeaderboardRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>(getActivityLogs);
  const [activeSubTab, setActiveSubTab] = useState<'CLOUD_PLAYERS' | 'LIVE_FEED'>('CLOUD_PLAYERS');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to Cloud Firestore real-time leaderboard
  useEffect(() => {
    const unsubscribe = subscribeCloudLeaderboard((records) => {
      setCloudRecords(records);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to local memory activity updates
  useEffect(() => {
    const handleMemoryUpdate = () => {
      setActivityLogs(getActivityLogs());
    };
    window.addEventListener('squeek_activity_updated', handleMemoryUpdate);
    return () => window.removeEventListener('squeek_activity_updated', handleMemoryUpdate);
  }, []);

  const handleManualRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    setActivityLogs(getActivityLogs());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Stats calculation
  const totalEthEarned = cloudRecords.reduce((acc, curr) => acc + (curr.earningsETH || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#0e0306] to-red-950 p-6 rounded-2xl border border-red-900/80 shadow-[0_0_30px_rgba(230,25,56,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
            <h2 className="font-pixel text-lg md:text-xl text-red-500 text-glow-red">
              GLOBAL CLOUD LEADERBOARD
            </h2>
            <span className="px-2.5 py-0.5 text-[11px] font-tech font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/60 rounded flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Cloud Firestore Live Sync
            </span>
          </div>
          <p className="text-xs font-tech text-zinc-300 mt-2 max-w-2xl leading-relaxed">
            Real registered player profiles on Cloud Firestore. Connect your wallet to create your profile, link your Twitter handle, and compete on the Ethereum Sepolia leaderboards.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenProfileModal && (
            <button
              onClick={() => { playClickSound(); onOpenProfileModal(); }}
              className="py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-400 text-white text-xs font-cyber font-bold rounded-xl shadow-[0_0_15px_rgba(230,25,56,0.5)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" /> My Profile & Twitter
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            className="py-2.5 px-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-cyber rounded-xl hover:bg-red-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cloud Diagnostics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#090305] border border-red-950 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-tech text-zinc-400">
            <span>Registered Cloud Players</span>
            <Database className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-pixel text-xl text-white text-glow-red">
            {cloudRecords.length} Players
          </div>
          <div className="text-[10px] font-tech text-emerald-400">
            Synced via Firebase Firestore
          </div>
        </div>

        <div className="p-4 bg-[#090305] border border-red-950 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-tech text-zinc-400">
            <span>Top High Score</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-pixel text-xl text-amber-400">
            {cloudRecords.length > 0 ? Math.max(...cloudRecords.map((r) => r.score)) : 0} PTS
          </div>
          <div className="text-[10px] font-tech text-zinc-400">
            Real Player Record
          </div>
        </div>

        <div className="p-4 bg-[#090305] border border-red-950 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-tech text-zinc-400">
            <span>Distributed Rewards</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-pixel text-xl text-emerald-400">
            {totalEthEarned.toFixed(2)} ETH
          </div>
          <div className="text-[10px] font-tech text-zinc-400">
            On-Chain Sepolia Payouts
          </div>
        </div>

        <div className="p-4 bg-[#090305] border border-red-950 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-tech text-zinc-400">
            <span>Web3 Verification</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-pixel text-xl text-blue-400">
            Rabby Signed
          </div>
          <div className="text-[10px] font-tech text-zinc-400">
            Ath Sepolia Chain 11155111
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-red-950 pb-2">
        <button
          onClick={() => { playClickSound(); setActiveSubTab('CLOUD_PLAYERS'); }}
          className={`px-4 py-2 text-xs font-cyber font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'CLOUD_PLAYERS'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(230,25,56,0.5)]'
              : 'text-zinc-400 hover:text-white hover:bg-red-950/40'
          }`}
        >
          <Award className="w-4 h-4" /> Registered Cloud Players ({cloudRecords.length})
        </button>

        <button
          onClick={() => { playClickSound(); setActiveSubTab('LIVE_FEED'); }}
          className={`px-4 py-2 text-xs font-cyber font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'LIVE_FEED'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(230,25,56,0.5)]'
              : 'text-zinc-400 hover:text-white hover:bg-red-950/40'
          }`}
        >
          <History className="w-4 h-4" /> Live Memory Activity ({activityLogs.length})
        </button>
      </div>

      {/* View 1: Real Cloud Registered Players */}
      {activeSubTab === 'CLOUD_PLAYERS' && (
        <div className="bg-[#090305] border border-red-900/70 rounded-2xl p-4 md:p-6 shadow-[0_0_25px_rgba(230,25,56,0.15)] space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-tech">
              <thead>
                <tr className="border-b border-red-950 text-red-400/80 uppercase tracking-wider text-[11px] font-cyber">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Registered Player</th>
                  <th className="py-3 px-3">Twitter / X</th>
                  <th className="py-3 px-3">Level Cleared</th>
                  <th className="py-3 px-3">Clear Time</th>
                  <th className="py-3 px-3">Score Points</th>
                  <th className="py-3 px-3">ETH Earned</th>
                  <th className="py-3 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-950/60">
                {cloudRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400 font-tech space-y-3">
                      <div className="text-2xl">🐹</div>
                      <div className="text-white font-cyber font-bold text-sm">No Registered Cloud Players Yet</div>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        Connect your Rabby Wallet, create your Profile with your Twitter handle, and play a maze level to register your place on the global Cloud Leaderboard!
                      </p>
                      {onOpenProfileModal && (
                        <button
                          onClick={onOpenProfileModal}
                          className="mt-2 py-2 px-5 bg-red-600 hover:bg-red-500 text-white font-cyber text-xs rounded-lg shadow-[0_0_12px_rgba(230,25,56,0.5)] transition-all cursor-pointer"
                        >
                          Register My Profile Now
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  cloudRecords.map((record, idx) => (
                    <tr key={record.id || idx} className="hover:bg-red-950/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-pixel text-xs ${
                          idx === 0
                            ? 'bg-amber-950 text-amber-400 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : idx === 1
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-400'
                            : idx === 2
                            ? 'bg-amber-950/50 text-amber-600 border border-amber-800'
                            : 'text-zinc-500 font-mono'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-cyber font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{record.username}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">{record.playerAddress}</div>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {record.twitterHandle ? (
                          <a
                            href={`https://x.com/${record.twitterHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50 transition-colors"
                          >
                            <Twitter className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>@{record.twitterHandle}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-zinc-300 font-semibold">{record.levelName}</td>

                      <td className="py-3.5 px-3 text-white font-mono">{record.timeSeconds.toFixed(1)}s</td>

                      <td className="py-3.5 px-3 font-pixel text-red-400 text-glow-red">{record.score}</td>

                      <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">
                        +{record.earningsETH.toFixed(2)} ETH
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/50">
                          <ShieldCheck className="w-3.5 h-3.5" /> Cloud Verified
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Live Memory Activity Stream */}
      {activeSubTab === 'LIVE_FEED' && (
        <div className="bg-[#090305] border border-red-900/70 rounded-2xl p-4 md:p-6 shadow-[0_0_25px_rgba(230,25,56,0.15)] space-y-3">
          <div className="flex items-center justify-between border-b border-red-950 pb-3">
            <h3 className="font-cyber font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-red-500" /> Live Application Memory Stream
            </h3>
            <span className="text-xs font-mono text-zinc-500">Auto-updating on activity</span>
          </div>

          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <p className="py-6 text-center text-xs font-tech text-zinc-500">
                Memory ledger is empty.
              </p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-red-950/20 border border-red-950 hover:border-red-900/60 rounded-xl flex items-center justify-between gap-4 text-xs font-tech transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-pixel shrink-0 ${
                      log.type === 'MAZE_CLEAR'
                        ? 'bg-red-950 border border-red-600 text-red-400'
                        : log.type === 'SIM_BET_WON'
                        ? 'bg-emerald-950 border border-emerald-600 text-emerald-400'
                        : log.type === 'FAUCET_CLAIM'
                        ? 'bg-amber-950 border border-amber-600 text-amber-400'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-300'
                    }`}>
                      {log.type === 'MAZE_CLEAR' ? '🧀' : log.type === 'SIM_BET_WON' ? '🏆' : log.type === 'FAUCET_CLAIM' ? '⚡' : '🎲'}
                    </div>

                    <div>
                      <div className="font-cyber font-bold text-white flex items-center gap-2">
                        {log.name}
                        <span className="text-[10px] text-zinc-400 font-mono">({log.playerAddress})</span>
                      </div>
                      <div className="text-zinc-300 text-[11px] mt-0.5">{log.details}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-pixel text-red-400 text-glow-red">
                      +{log.score} PTS
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

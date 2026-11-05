import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Hamster, WalletState, MatchBet } from '../types/game';
import { HAMSTER_RACERS } from '../utils/gameData';
import { playClickSound, playBetSound, playVictorySound, playTrapSound } from '../utils/audio';
import { generateTxHash, formatAddress } from '../utils/web3';
import { recordActivity } from '../utils/activityMemory';
import confetti from 'canvas-confetti';
import { Flag, Trophy, TrendingUp, Zap, BarChart3, ShieldCheck, Play, RotateCcw, Info } from 'lucide-react';

interface HamsterSimulationProps {
  wallet: WalletState;
  setWallet: (w: WalletState) => void;
}

interface SimulatedHamsterPosition {
  id: string;
  x: number; // 0 to 100 percentage
  speed: number;
  rank: number;
  isStunned: boolean;
  stunTimer: number;
  hasBoost: boolean;
  boostTimer: number;
  finishedTime?: number;
}

export default function HamsterSimulation({ wallet, setWallet }: HamsterSimulationProps) {
  const [raceState, setRaceState] = useState<'IDLE' | 'RACING' | 'FINISHED'>('IDLE');
  const [selectedHamsterId, setSelectedHamsterId] = useState<string>('hamster_1');
  const [betAmount, setBetAmount] = useState<number>(1.0);
  const [activeBets, setActiveBets] = useState<MatchBet[]>([]);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const [inspectedHamster, setInspectedHamster] = useState<Hamster | null>(HAMSTER_RACERS[0]);
  const [winnerHamster, setWinnerHamster] = useState<Hamster | null>(null);

  // Live positions during race
  const [positions, setPositions] = useState<SimulatedHamsterPosition[]>([]);

  // Selected hamster object
  const chosenHamster = HAMSTER_RACERS.find((h) => h.id === selectedHamsterId) || HAMSTER_RACERS[0];
  const potentialPayout = betAmount * chosenHamster.odds;

  // Initialize positions on load
  const initPositions = useCallback(() => {
    const initial: SimulatedHamsterPosition[] = HAMSTER_RACERS.map((h) => ({
      id: h.id,
      x: 0,
      speed: (h.stats.speed / 100) * 0.4 + 0.3,
      rank: 1,
      isStunned: false,
      stunTimer: 0,
      hasBoost: false,
      boostTimer: 0,
    }));
    setPositions(initial);
  }, []);

  useEffect(() => {
    initPositions();
  }, [initPositions]);

  // Place Bet handler
  const handlePlaceBet = () => {
    if (!wallet.isConnected) {
      alert('Please connect your Rabby Wallet or Ethereum Sepolia Dev Wallet first!');
      return;
    }
    if (wallet.balanceAETH < betAmount) {
      alert('Insufficient ETH balance in wallet!');
      return;
    }

    playBetSound();

    // Deduct ETH balance
    const updatedWallet = {
      ...wallet,
      balanceAETH: wallet.balanceAETH - betAmount,
    };
    setWallet(updatedWallet);

    const newBet: MatchBet = {
      id: 'bet_' + Date.now(),
      hamsterId: selectedHamsterId,
      amountAETH: betAmount,
      potentialPayout,
      timestamp: new Date().toLocaleTimeString(),
      status: 'PENDING',
    };

    setActiveBets((prev) => [newBet, ...prev]);
    setCommentaryLog((prev) => [`[Contract Escrow Locked] ${betAmount} ETH placed on #${chosenHamster.name} (${chosenHamster.odds}x)`, ...prev]);

    recordActivity({
      type: 'SIM_BET_PLACED',
      playerAddress: wallet.address ? formatAddress(wallet.address) : '0xGuest...User',
      name: wallet.address ? `Bettor_${wallet.address.slice(2, 6)}` : 'Squeek_Bettor',
      details: `Placed ${betAmount} ETH bet on #${chosenHamster.name}`,
      score: 100,
      earningsETH: 0,
      verifiedWallet: wallet.isConnected,
    });
  };

  // Start 10-Hamster Race Simulation Loop
  const handleStartRace = () => {
    playClickSound();
    initPositions();
    setRaceState('RACING');
    setWinnerHamster(null);
    setCommentaryLog(['🏁 10-Hamster Ethereum Sepolia Grand Prix HAS STARTED!']);
  };

  // Simulation tick loop
  useEffect(() => {
    if (raceState !== 'RACING') return;

    let interval: NodeJS.Timeout;
    let tickCount = 0;

    interval = setInterval(() => {
      tickCount++;

      setPositions((prevPositions) => {
        let anyFinished = false;

        const updated = prevPositions.map((pos) => {
          if (pos.x >= 100) {
            anyFinished = true;
            return pos;
          }

          const baseHamster = HAMSTER_RACERS.find((h) => h.id === pos.id)!;
          let currentSpeed = (baseHamster.stats.speed / 100) * 0.45 + 0.35;

          // Handle stuns from traps
          if (pos.isStunned) {
            if (pos.stunTimer > 0) {
              return { ...pos, stunTimer: pos.stunTimer - 1 };
            } else {
              return { ...pos, isStunned: false };
            }
          }

          // Handle boosts
          if (pos.hasBoost) {
            currentSpeed *= 1.8;
            if (pos.boostTimer > 0) {
              pos.boostTimer--;
            } else {
              pos.hasBoost = false;
            }
          }

          // Random trap events based on trapEvasion stat
          const trapChance = (100 - baseHamster.stats.trapEvasion) / 4500;
          if (Math.random() < trapChance && !pos.isStunned) {
            playTrapSound();
            setCommentaryLog((logs) => [`⚠️ ${baseHamster.name} tripped on a hazard!`, ...logs.slice(0, 10)]);
            return { ...pos, isStunned: true, stunTimer: 8 };
          }

          // Random speed boost event based on agility stat
          const boostChance = baseHamster.stats.agility / 4000;
          if (Math.random() < boostChance && !pos.hasBoost) {
            setCommentaryLog((logs) => [`⚡ ${baseHamster.name} triggered Speed Boost!`, ...logs.slice(0, 10)]);
            return { ...pos, hasBoost: true, boostTimer: 10 };
          }

          const nextX = Math.min(100, pos.x + currentSpeed);
          return { ...pos, x: nextX };
        });

        // Calculate rankings
        const sorted = [...updated].sort((a, b) => b.x - a.x);
        sorted.forEach((item, index) => {
          const orig = updated.find((p) => p.id === item.id);
          if (orig) orig.rank = index + 1;
        });

        // Check if leader reached 100%
        const firstToFinish = sorted.find((p) => p.x >= 100);
        if (firstToFinish && !winnerHamster) {
          const winningHam = HAMSTER_RACERS.find((h) => h.id === firstToFinish.id)!;
          setWinnerHamster(winningHam);
          setRaceState('FINISHED');
          playVictorySound();
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });

          // Resolve bets
          setActiveBets((prevBets) =>
            prevBets.map((b) => {
              if (b.status === 'PENDING') {
                if (b.hamsterId === winningHam.id) {
                  // Winner payout!
                  const payout = b.potentialPayout;
                  setWallet({
                    ...wallet,
                    balanceAETH: wallet.balanceAETH + payout,
                  });
                  setCommentaryLog((logs) => [
                    `🎉 SMART CONTRACT PAYOUT RELEASED: ${payout.toFixed(2)} ETH sent on Sepolia (${generateTxHash().slice(0, 10)}...)`,
                    ...logs,
                  ]);

                  recordActivity({
                    type: 'SIM_BET_WON',
                    playerAddress: wallet.address ? formatAddress(wallet.address) : '0xGuest...User',
                    name: wallet.address ? `Bettor_${wallet.address.slice(2, 6)}` : 'Squeek_Bettor',
                    details: `Won ${payout.toFixed(2)} ETH on #${winningHam.name} (${winningHam.odds}x Payout)`,
                    score: Math.round(payout * 250),
                    earningsETH: payout,
                    verifiedWallet: wallet.isConnected,
                  });

                  return { ...b, status: 'WON' };
                } else {
                  return { ...b, status: 'LOST' };
                }
              }
              return b;
            })
          );
        }

        return updated;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [raceState, winnerHamster, wallet, setWallet]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#0e0407] to-red-950 p-6 rounded-2xl border border-red-900/80 shadow-[0_0_30px_rgba(230,25,56,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-pixel text-lg md:text-xl text-red-500 text-glow-red">
              10-HAMSTER SIMULATION GRAND PRIX
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-tech font-bold bg-red-900/80 text-red-200 border border-red-600 rounded">
              Ethereum Sepolia (11155111)
            </span>
          </div>
          <p className="text-xs font-tech text-zinc-300 mt-1 max-w-2xl">
            Watch 10 cyber hamsters with custom win rates, agility stats, and trap evasion algorithms compete in real-time. Place SepoliaETH bets for automated smart contract payout execution upon race completion.
          </p>
        </div>

        <button
          onClick={handleStartRace}
          disabled={raceState === 'RACING'}
          className="py-3.5 px-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-pixel text-xs rounded-xl shadow-[0_0_20px_rgba(230,25,56,0.5)] transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          {raceState === 'RACING' ? 'RACE IN PROGRESS...' : 'START 10-HAMSTER SIM'}
        </button>
      </div>

      {/* Main Grid Split: Race Visualizer (2 cols) + Betting & Stats (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: 10-Lane Live Race Canvas / Simulation View */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#090305] border border-red-900/70 rounded-2xl p-4 md:p-6 shadow-[0_0_20px_rgba(230,25,56,0.15)] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-red-950 text-xs font-cyber">
              <span className="text-zinc-300 font-bold flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" /> LIVE SIMULATED TRACK (10 LANES)
              </span>
              <span className="text-red-400 font-mono">
                {raceState === 'RACING' ? '🔴 LIVE SIMULATION RUNNING' : raceState === 'FINISHED' ? '🏆 RACE FINISHED' : 'READY TO START'}
              </span>
            </div>

            {/* 10 Lanes Container */}
            <div className="space-y-2 py-2">
              {HAMSTER_RACERS.map((hamster, idx) => {
                const pos = positions.find((p) => p.id === hamster.id) || { x: 0, rank: idx + 1, isStunned: false, hasBoost: false };

                return (
                  <div
                    key={hamster.id}
                    onClick={() => setInspectedHamster(hamster)}
                    className={`relative p-2.5 rounded-lg border transition-all cursor-pointer ${
                      selectedHamsterId === hamster.id
                        ? 'bg-red-950/70 border-red-500/80 shadow-[0_0_12px_rgba(230,25,56,0.3)]'
                        : 'bg-zinc-950/80 border-red-950/60 hover:border-red-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-xs font-tech">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-500 w-5">#{idx + 1}</span>
                        <span className="text-xl">{hamster.avatarIcon}</span>
                        <span className="font-bold text-white font-cyber">{hamster.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">({hamster.breed})</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">{hamster.odds}x</span>
                        <span className="text-zinc-400">Win Rate: {hamster.winRate}%</span>
                        <span className="text-red-400 font-bold">Rank #{pos.rank}</span>
                      </div>
                    </div>

                    {/* Progress Track Lane */}
                    <div className="relative w-full h-5 bg-black/90 rounded border border-red-950 overflow-hidden flex items-center">
                      
                      {/* Track background lines */}
                      <div className="absolute inset-0 scanline opacity-30" />

                      {/* Finish line marker */}
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-red-600/40 border-l border-red-500/80 flex items-center justify-center font-pixel text-[8px] text-white">
                        FINISH
                      </div>

                      {/* Hamster Runner Marker */}
                      <div
                        className="absolute top-0 bottom-0 flex items-center justify-center transition-all duration-150"
                        style={{ left: `calc(${pos.x}% - 14px)` }}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md transition-transform ${
                            pos.hasBoost ? 'scale-125 bg-amber-500 shadow-[0_0_12px_#f59e0b]' : pos.isStunned ? 'bg-zinc-700 opacity-60' : 'bg-red-600'
                          }`}
                        >
                          {pos.isStunned ? '💥' : hamster.avatarIcon}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commentary Feed Ticker */}
            <div className="mt-4 p-3 bg-black/90 border border-red-950 rounded-lg text-xs font-tech space-y-1 max-h-28 overflow-y-auto">
              <div className="text-red-500 font-bold uppercase tracking-widest text-[10px] mb-1">
                LIVE COMMENTARY LOG
              </div>
              {commentaryLog.length === 0 ? (
                <div className="text-zinc-600 italic">Select a hamster, place a bet, and click Start 10-Hamster Sim...</div>
              ) : (
                commentaryLog.map((log, i) => (
                  <div key={i} className="text-zinc-300 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Winner Celebration Announcement */}
          {winnerHamster && (
            <div className="p-5 bg-gradient-to-r from-red-950 via-[#18050a] to-red-950 border border-red-500 rounded-2xl shadow-[0_0_30px_rgba(230,25,56,0.4)] flex items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  👑
                </div>
                <div>
                  <div className="text-xs font-tech text-amber-400 font-bold">ETHEREUM SEPOLIA GRAND PRIX WINNER</div>
                  <h3 className="font-pixel text-lg text-white text-glow-red">{winnerHamster.name}</h3>
                  <p className="text-xs font-tech text-zinc-300">
                    Breed: {winnerHamster.breed} · Payout Odds: {winnerHamster.odds}x
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartRace}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(230,25,56,0.5)] cursor-pointer"
              >
                Rematch
              </button>
            </div>
          )}

        </div>

        {/* Right 1 Column: Betting Panel & Detailed Stats Inspector */}
        <div className="space-y-6">
          
          {/* Betting Setup Card */}
          <div className="p-5 bg-[#090305] border border-red-900/80 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(230,25,56,0.15)]">
            <h3 className="font-cyber font-bold text-sm text-white flex items-center gap-2 border-b border-red-950 pb-2">
              <Trophy className="w-4 h-4 text-amber-500" /> SepoliaETH Match Betting Category
            </h3>

            {/* Select Hamster */}
            <div className="space-y-1.5">
              <label className="text-xs font-tech text-zinc-400">Select Winner Candidate:</label>
              <select
                value={selectedHamsterId}
                onChange={(e) => {
                  setSelectedHamsterId(e.target.value);
                  const found = HAMSTER_RACERS.find((h) => h.id === e.target.value);
                  if (found) setInspectedHamster(found);
                }}
                className="w-full p-2.5 bg-zinc-950 border border-red-900 text-xs font-cyber font-semibold text-white rounded-lg focus:outline-none focus:border-red-500"
              >
                {HAMSTER_RACERS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.avatarIcon} #{h.name} — Odds: {h.odds}x (Win Rate: {h.winRate}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Bet Amount buttons */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-tech">
                <span className="text-zinc-400">Bet Amount (ETH):</span>
                <span className="text-red-400 font-bold">Balance: {wallet.balanceAETH.toFixed(2)} ETH</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1.0, 2.5, 5.0].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`py-1.5 text-xs font-tech font-bold rounded border transition-all cursor-pointer ${
                      betAmount === amt
                        ? 'bg-red-900 border-red-500 text-white shadow-[0_0_10px_rgba(230,25,56,0.4)]'
                        : 'bg-zinc-950 border-red-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {amt} ETH
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Payout Box */}
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1.5 text-xs font-tech">
              <div className="flex justify-between text-zinc-400">
                <span>Selected Rodent:</span>
                <span className="text-white font-bold">{chosenHamster.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payout Multiplier:</span>
                <span className="text-amber-400 font-bold">{chosenHamster.odds}x</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-red-950">
                <span className="text-zinc-300 font-bold">Estimated Payout:</span>
                <span className="font-pixel text-emerald-400 text-glow-red text-xs">
                  {potentialPayout.toFixed(2)} ETH
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceBet}
              disabled={raceState === 'RACING'}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-cyber font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(230,25,56,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              LOCK SMART CONTRACT BET ({betAmount} ETH)
            </button>
          </div>

          {/* Inspected Hamster Detailed Statistics */}
          {inspectedHamster && (
            <div className="p-5 bg-[#090305] border border-red-900/80 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(230,25,56,0.15)]">
              <div className="flex items-center justify-between border-b border-red-950 pb-2">
                <h3 className="font-cyber font-bold text-sm text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-500" /> Rodent Performance Intel
                </h3>
                <span className="text-2xl">{inspectedHamster.avatarIcon}</span>
              </div>

              <div>
                <h4 className="font-pixel text-xs text-red-500 text-glow-red">{inspectedHamster.name}</h4>
                <p className="text-[11px] font-tech text-zinc-400 mt-0.5">{inspectedHamster.bio}</p>
              </div>

              {/* Stats Breakdown Bars */}
              <div className="space-y-2 text-xs font-tech">
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Speed:</span>
                    <span className="font-bold text-red-400">{inspectedHamster.stats.speed} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${inspectedHamster.stats.speed}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Agility:</span>
                    <span className="font-bold text-amber-400">{inspectedHamster.stats.agility} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${inspectedHamster.stats.agility}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Trap Evasion:</span>
                    <span className="font-bold text-emerald-400">{inspectedHamster.stats.trapEvasion} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${inspectedHamster.stats.trapEvasion}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Stamina:</span>
                    <span className="font-bold text-blue-400">{inspectedHamster.stats.stamina} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${inspectedHamster.stats.stamina}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-red-950 text-xs font-tech space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>Special Skill:</span>
                  <span className="text-zinc-200 font-bold">{inspectedHamster.specialSkill}</span>
                </div>
                <div className="flex justify-between">
                  <span>Track Record:</span>
                  <span className="text-zinc-200 font-mono">{inspectedHamster.wins}W - {inspectedHamster.losses}L</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

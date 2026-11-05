import React, { useState, useEffect } from 'react';
import { UserProfile, fetchUserProfile, saveUserProfile } from '../utils/userProfiles';
import { WalletState } from '../types/game';
import { X, UserCheck, Twitter, Sparkles, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { playClickSound, playPowerupSound } from '../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onProfileUpdated?: (profile: UserProfile) => void;
}

const HAMSTER_AVATARS = ['🐹', '⚡', '🏆', '🔥', '🧀', '🚀', '👑', '🩸'];

export default function UserProfileModal({ isOpen, onClose, wallet, onProfileUpdated }: UserProfileModalProps) {
  const [username, setUsername] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('🐹');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!wallet.address || !isOpen) return;

    let isMounted = true;
    const loadProfile = async () => {
      const p = await fetchUserProfile(wallet.address!);
      if (isMounted && p) {
        setExistingProfile(p);
        setUsername(p.username);
        setTwitterHandle(p.twitterHandle);
        setBio(p.bio || '');
        setAvatarIcon(p.avatarIcon || '🐹');
      } else if (isMounted) {
        // Default values
        setUsername(`Runner_${wallet.address!.slice(2, 6)}`);
        setTwitterHandle('');
        setBio('Ethereum Sepolia Squeek Runner');
        setAvatarIcon('🐹');
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [wallet.address, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.address) {
      alert('Please connect your Rabby Wallet first!');
      return;
    }

    playPowerupSound();
    setSaving(true);
    setStatusMsg('Syncing registered profile to Cloud Firestore...');

    const newProfile: UserProfile = {
      walletAddress: wallet.address,
      username: username.trim() || `Runner_${wallet.address.slice(2, 6)}`,
      twitterHandle: twitterHandle.replace(/^@/, '').trim(),
      bio: bio.trim(),
      avatarIcon,
      highScore: existingProfile ? existingProfile.highScore : 0,
      levelsCleared: existingProfile ? existingProfile.levelsCleared : 0,
      totalEthEarned: existingProfile ? existingProfile.totalEthEarned : 0,
    };

    try {
      const saved = await saveUserProfile(newProfile);
      setExistingProfile(saved);
      if (onProfileUpdated) onProfileUpdated(saved);
      setStatusMsg('Profile successfully registered on Cloud Firestore!');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch {
      setStatusMsg('Failed to save profile. Check network connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0407] border border-red-800/80 rounded-2xl p-6 shadow-[0_0_35px_rgba(230,25,56,0.35)] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-red-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-600/60 flex items-center justify-center text-red-500 font-pixel text-2xl">
              {avatarIcon}
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-white flex items-center gap-2">
                Player Profile & Identity
              </h3>
              <p className="text-xs font-tech text-red-400/80">
                Register on-chain wallet & Twitter details for Real-Time Cloud Leaderboard
              </p>
            </div>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs font-tech text-red-200 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Connected Wallet & Daily Streak Info */}
        <div className="grid grid-cols-2 gap-3 font-tech text-xs">
          <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/60 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Daily Streak</span>
              <span className="text-amber-500 animate-bounce">🔥</span>
            </div>
            <div className="font-pixel text-lg text-amber-400 text-glow-red">
              {existingProfile?.currentStreak || 1} Days
            </div>
            <div className="text-[10px] text-zinc-400">
              Consecutive Active Racing
            </div>
          </div>

          <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/60 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Squeek XP</span>
              <span className="text-amber-400">⚡</span>
            </div>
            <div className="font-pixel text-lg text-emerald-400">
              {existingProfile?.squeekXP || 50} XP
            </div>
            <div className="text-[10px] text-zinc-400">
              +75 XP/Day + Streak Bonus
            </div>
          </div>
        </div>

        {/* Connected Wallet Info */}
        <div className="p-3 bg-red-950/30 rounded-xl border border-red-950 text-xs font-tech flex items-center justify-between">
          <span className="text-zinc-400">Connected Wallet:</span>
          <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Not Connected'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs font-tech">
          
          {/* Avatar selection */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-bold">Select Rodent Avatar:</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {HAMSTER_AVATARS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => { playClickSound(); setAvatarIcon(icon); }}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-transform cursor-pointer ${
                    avatarIcon === icon
                      ? 'bg-red-900 border-red-500 shadow-[0_0_10px_rgba(230,25,56,0.6)] scale-110'
                      : 'bg-zinc-950 border-red-950 text-zinc-400 hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-red-500" /> Username / Runner Alias:
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. SatoshiHamster"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 bg-zinc-950 border border-red-900/80 rounded-lg text-white focus:outline-none focus:border-red-500 font-cyber text-xs"
            />
          </div>

          {/* Twitter handle */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-bold flex items-center gap-1">
              <Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter / X Handle:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-500 font-mono">@</span>
              <input
                type="text"
                maxLength={50}
                placeholder="squeek_official"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full p-2.5 pl-8 bg-zinc-950 border border-red-900/80 rounded-lg text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-bold">Bio / Slogan:</label>
            <textarea
              maxLength={200}
              rows={2}
              placeholder="Ethereum Sepolia speedrunner & 10-Hamster Grand Prix bettor."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 bg-zinc-950 border border-red-900/80 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-cyber font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(230,25,56,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Shield className="w-4 h-4 text-emerald-400" />
              )}
              REGISTER PROFILE TO CLOUD FIRESTORE
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

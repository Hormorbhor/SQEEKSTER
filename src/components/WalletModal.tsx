import React, { useState } from 'react';
import { WalletState } from '../types/game';
import { connectWallet, disconnectWallet, ETH_SEPOLIA_CHAIN, detectRabbyWallet } from '../utils/web3';
import { X, Shield, ExternalLink, RefreshCw, CheckCircle2, Sparkles, Coins } from 'lucide-react';
import { playClickSound, playPowerupSound } from '../utils/audio';
import { recordActivity } from '../utils/activityMemory';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
}

export default function WalletModal({ isOpen, onClose, wallet, setWallet }: WalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [faucetClaiming, setFaucetClaiming] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isRabbyDetected = detectRabbyWallet();

  const handleConnectRabby = async () => {
    playClickSound();
    setLoading(true);
    setStatusMsg('Connecting Rabby Wallet on Ethereum Sepolia...');
    try {
      const res = await connectWallet(true);
      setWallet(res);
      setStatusMsg('Successfully connected Rabby Wallet!');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1000);
    } catch {
      setStatusMsg('Rabby connection failed. Created Ethereum Sepolia Dev Wallet.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDevWallet = async () => {
    playClickSound();
    setLoading(true);
    setStatusMsg('Provisioning Ethereum Sepolia Testnet Wallet...');
    try {
      const res = await connectWallet(false);
      setWallet(res);
      setStatusMsg('Connected to Ethereum Sepolia Dev Wallet!');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    playClickSound();
    const res = disconnectWallet();
    setWallet(res);
    setStatusMsg('Disconnected wallet.');
  };

  const handleClaimFaucet = () => {
    if (!wallet.isConnected) return;
    playPowerupSound();
    setFaucetClaiming(true);
    setTimeout(() => {
      const updated: WalletState = {
        ...wallet,
        balanceAETH: wallet.balanceAETH + 5.0,
      };
      setWallet(updated);
      setFaucetClaiming(false);
      setStatusMsg('+5.00 SepoliaETH Testnet tokens added to wallet!');

      recordActivity({
        type: 'FAUCET_CLAIM',
        playerAddress: wallet.address ? wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4) : '0xGuest...User',
        name: wallet.address ? `Holder_${wallet.address.slice(2, 6)}` : 'Squeek_User',
        details: 'Claimed +5.00 SepoliaETH Testnet tokens',
        score: 50,
        earningsETH: 5.0,
        verifiedWallet: wallet.isConnected,
      });

      setTimeout(() => setStatusMsg(null), 2500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0407] border border-red-800/60 rounded-xl p-6 shadow-[0_0_30px_rgba(230,25,56,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-red-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-600/60 flex items-center justify-center text-red-500 font-pixel text-xl">
              ⚡
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-white">Ethereum Sepolia Wallet Gateway</h3>
              <p className="text-xs font-tech text-red-400/80">Rabby Wallet & Chain ID 11155111 Integration</p>
            </div>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message alert */}
        {statusMsg && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-600/50 rounded-lg text-xs font-tech text-red-200 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Wallet Details if Connected */}
        {wallet.isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-950/40 rounded-lg border border-red-900/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-tech">
                <span className="text-zinc-400">Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected ({wallet.isRabby ? 'Rabby Extension' : 'Dev Web3 Provider'})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-tech">
                <span className="text-zinc-400">Account Address</span>
                <span className="font-mono text-red-300 font-semibold">{wallet.address}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-tech">
                <span className="text-zinc-400">Network</span>
                <span className="text-white font-bold">{wallet.chainName} (11155111 / {wallet.chainId})</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-red-900/40">
                <span className="text-xs font-cyber text-zinc-300">Balance</span>
                <span className="font-pixel text-sm text-red-400 text-glow-red">
                  {wallet.balanceAETH.toFixed(2)} ETH
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-tech pt-1">
                <span className="text-zinc-400">ETH-Sepolia Hamster Pass</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Verified NFT
                </span>
              </div>
            </div>

            {/* Faucet button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClaimFaucet}
                disabled={faucetClaiming}
                className="flex-1 py-2.5 px-4 bg-red-900/60 hover:bg-red-800/80 border border-red-600/60 rounded-lg text-xs font-cyber font-bold text-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(230,25,56,0.3)] disabled:opacity-50"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                {faucetClaiming ? 'Claiming ETH...' : 'Faucet: Claim +5.0 ETH'}
              </button>

              <button
                onClick={handleDisconnect}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-tech text-zinc-300 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* Connect Options */
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 font-tech leading-relaxed">
              Connect your wallet to sign in, record maze high scores on <strong className="text-red-400">Ethereum Sepolia (Chain 11155111)</strong>, place SepoliaETH bets on 10-hamster races, and receive automated smart contract payouts.
            </p>

            {/* Rabby Option */}
            <button
              onClick={handleConnectRabby}
              disabled={loading}
              className="w-full p-4 bg-gradient-to-r from-red-950 via-red-900/60 to-red-950 border border-red-600/70 hover:border-red-500 rounded-xl transition-all flex items-center justify-between group cursor-pointer shadow-[0_0_20px_rgba(230,25,56,0.25)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-900/80 border border-red-500/50 flex items-center justify-center text-xl">
                  🐰
                </div>
                <div className="text-left">
                  <div className="font-cyber font-bold text-sm text-white group-hover:text-red-300 flex items-center gap-2">
                    Rabby Wallet
                    {isRabbyDetected && (
                      <span className="text-[10px] bg-emerald-950 border border-emerald-600/60 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                        Installed
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-tech text-zinc-400">
                    Recommended Web3 Rabby Wallet connector
                  </div>
                </div>
              </div>
              {loading ? (
                <RefreshCw className="w-5 h-5 text-red-400 animate-spin" />
              ) : (
                <span className="text-xs font-cyber text-red-400 group-hover:translate-x-1 transition-transform">
                  Connect →
                </span>
              )}
            </button>

            {/* Quick Sepolia Dev Wallet */}
            <button
              onClick={handleConnectDevWallet}
              disabled={loading}
              className="w-full p-3.5 bg-zinc-900/80 border border-zinc-800 hover:border-red-900 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div className="text-left">
                  <div className="font-cyber font-semibold text-xs text-zinc-200 group-hover:text-white">
                    Instant Ethereum Sepolia Test Account
                  </div>
                  <div className="text-[11px] font-tech text-zinc-400">
                    Auto-provisioned sandbox wallet with Sepolia ETH
                  </div>
                </div>
              </div>
              <span className="text-xs font-cyber text-zinc-400 group-hover:text-zinc-200">
                1-Click Join
              </span>
            </button>

            {/* Chain specs card */}
            <div className="p-3 bg-red-950/20 rounded-lg border border-red-950 text-[11px] font-tech text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Target Chain:</span>
                <span className="text-red-400 font-mono">{ETH_SEPOLIA_CHAIN.chainName}</span>
              </div>
              <div className="flex justify-between">
                <span>RPC URL:</span>
                <span className="text-zinc-300 font-mono">{ETH_SEPOLIA_CHAIN.rpcUrls[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Chain ID:</span>
                <span className="text-zinc-300 font-mono">11155111 ({ETH_SEPOLIA_CHAIN.chainId})</span>
              </div>
              <div className="flex justify-between">
                <span>Block Explorer:</span>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 font-mono hover:underline flex items-center gap-1"
                >
                  sepolia.etherscan.io <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

          </div>
        )}

        {/* Footer info link */}
        <div className="mt-5 pt-3 border-t border-red-950 flex items-center justify-between text-[11px] font-tech text-zinc-500">
          <span>Powered by Squeekchain Genesis Protocol</span>
          <a
            href="https://squeekchain.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            squeekchain.com <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}

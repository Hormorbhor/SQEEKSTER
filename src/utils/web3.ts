import { WalletState } from '../types/game';

export const ETH_SEPOLIA_CHAIN = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Ethereum Sepolia',
  nativeCurrency: {
    name: 'Ethereum Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

const STORAGE_WALLET_KEY = 'squeek_wallet_state_v3';

export function getInitialWalletState(): WalletState {
  const saved = localStorage.getItem(STORAGE_WALLET_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return {
    isConnected: false,
    address: null,
    balanceAETH: 0.0,
    chainName: 'Ethereum Sepolia',
    chainId: '0xaa36a7',
    isRabby: false,
    hasHamsterPass: false,
  };
}

export function saveWalletState(state: WalletState) {
  localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(state));
}

// Fetch real SepoliaETH balance on-chain via eth_getBalance
export async function fetchRealSepoliaBalance(address: string): Promise<number> {
  if (!address) return 0;

  // 1. Try injected Web3 provider (Rabby / MetaMask)
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (ethereum && typeof ethereum.request === 'function') {
    try {
      const hexBal = (await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;

      if (hexBal) {
        const wei = BigInt(hexBal);
        const eth = Number(wei) / 1e18;
        return parseFloat(eth.toFixed(4));
      }
    } catch (e) {
      console.warn('Injected eth_getBalance failed, falling back to public RPC', e);
    }
  }

  // 2. Fallback to direct public Sepolia JSON-RPC call
  try {
    const res = await fetch('https://ethereum-sepolia-rpc.publicnode.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });
    const data = await res.json();
    if (data && data.result) {
      const wei = BigInt(data.result);
      const eth = Number(wei) / 1e18;
      return parseFloat(eth.toFixed(4));
    }
  } catch (err) {
    console.warn('Public Sepolia RPC fetch failed', err);
  }

  return 0.0;
}

// Check if Rabby Wallet extension is injected in browser
export function detectRabbyWallet(): boolean {
  if (typeof window === 'undefined') return false;
  const ethereum = (window as unknown as { ethereum?: { isRabby?: boolean } }).ethereum;
  return Boolean(ethereum && ethereum.isRabby);
}

// Connect to Rabby Wallet or Dev wallet and fetch REAL balance
export async function connectWallet(preferRabby: boolean = true): Promise<WalletState> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isRabby?: boolean } }).ethereum;

  if (preferRabby && ethereum && typeof ethereum.request === 'function') {
    try {
      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts && accounts.length > 0) {
        // Try switching to Ethereum Sepolia
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ETH_SEPOLIA_CHAIN.chainId }],
          });
        } catch (switchError: unknown) {
          const errCode = (switchError as { code?: number }).code;
          if (errCode === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [ETH_SEPOLIA_CHAIN],
            });
          }
        }

        const address = accounts[0];
        const isRabby = Boolean(ethereum.isRabby);
        const realBalance = await fetchRealSepoliaBalance(address);

        const state: WalletState = {
          isConnected: true,
          address,
          balanceAETH: realBalance,
          chainName: 'Ethereum Sepolia',
          chainId: ETH_SEPOLIA_CHAIN.chainId,
          isRabby,
          hasHamsterPass: true,
        };
        saveWalletState(state);
        return state;
      }
    } catch (err) {
      console.warn('Rabby wallet connection rejected or failed', err);
    }
  }

  // Sandbox Dev Account
  const mockAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const realBalance = await fetchRealSepoliaBalance(mockAddress);
  const state: WalletState = {
    isConnected: true,
    address: mockAddress,
    balanceAETH: realBalance > 0 ? realBalance : 1.5, // 1.5 ETH sandbox if zero balance
    chainName: 'Ethereum Sepolia',
    chainId: ETH_SEPOLIA_CHAIN.chainId,
    isRabby: detectRabbyWallet(),
    hasHamsterPass: true,
  };
  saveWalletState(state);
  return state;
}

export function disconnectWallet(): WalletState {
  const state: WalletState = {
    isConnected: false,
    address: null,
    balanceAETH: 0,
    chainName: 'Ethereum Sepolia',
    chainId: '0xaa36a7',
    isRabby: false,
    hasHamsterPass: false,
  };
  saveWalletState(state);
  return state;
}

export function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function formatAddress(address: string | null): string {
  if (!address) return 'Not Connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

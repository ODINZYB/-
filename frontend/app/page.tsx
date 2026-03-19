"use client";

import { useState, useEffect, Suspense } from "react";
import { SyncButton } from "@/components/ui/SyncButton";
import { CountUp } from "@/components/ui/CountUp";
import { QuotaDashboard } from "@/components/ui/QuotaDashboard";
import { Leaderboard } from "@/components/ui/Leaderboard";
import { Wallet, Copy, Check, Globe } from "lucide-react";
import { ethers } from "ethers";
import { PEACE_PROTOCOL_ABI, PEACE_PROTOCOL_ADDRESS } from "@/lib/contracts/config";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// 将页面主体包裹在组件中以便使用 useSearchParams
function HomeContent() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://zyb.onrender.com";
  const { language, setLanguage, t } = useLanguage();
  const [balance, setBalance] = useState(12450);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0); // 0 means ready
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>(""); // For user feedback
  const [isCopied, setIsCopied] = useState(false);

  const searchParams = useSearchParams();
  const [referrer, setReferrer] = useState<string>("0x0000000000000000000000000000000000000000");
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]); // Track claimed levels

  useEffect(() => {
    // 获取 URL 中的 ref 参数作为推荐人
    const refParam = searchParams.get("ref");
    if (refParam && ethers.isAddress(refParam)) {
      setReferrer(refParam);
    }
  }, [searchParams]);

  const copyReferralLink = () => {
    if (!walletAddress) {
      alert(t.pleaseConnect);
      return;
    }
    
    // 生成包含自己钱包地址的推荐链接
    const baseUrl = window.location.origin;
    const refLink = `${baseUrl}?ref=${walletAddress}`;
    
    navigator.clipboard.writeText(refLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Add useEffect to fetch real balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || typeof window === 'undefined' || !(window as any).ethereum) return;
      
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        // Ensure you have PEACE_TOKEN_ADDRESS defined in config.ts
        // Uncomment and use if you have the token contract deployed:
        // const tokenContract = new ethers.Contract(PEACE_TOKEN_ADDRESS, PEACE_TOKEN_ABI, provider);
        // const rawBalance = await tokenContract.balanceOf(walletAddress);
        // setBalance(Number(ethers.formatEther(rawBalance)));
        
        // For now, we keep the mock balance but you can swap the logic above when ready
        console.log("Wallet connected, ready to fetch balance for:", walletAddress);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  // Mock community progress data
  const [communityProgress, setCommunityProgress] = useState(125); // 当前社区累计打卡次数 (Mock)

  const levels = [
    { id: 1, threshold: 30, reward: "1 USDT" },
    { id: 2, threshold: 50, reward: "2 USDT" },
    { id: 3, threshold: 100, reward: "5 USDT" },
    { id: 4, threshold: 500, reward: "20 USDT" },
    { id: 5, threshold: 1000, reward: "50 USDT" },
    { id: 6, threshold: 3000, reward: "100 USDT" },
    { id: 7, threshold: 5000, reward: "180 USDT" },
    { id: 8, threshold: 10000, reward: "350 USDT" },
    { id: 9, threshold: 30000, reward: "1,000 USDT" },
    { id: 10, threshold: 50000, reward: "1,800 USDT" },
    { id: 11, threshold: 100000, reward: "3,500 USDT" },
    { id: 12, threshold: 300000, reward: "10,000 USDT" },
    { id: 13, threshold: 500000, reward: "15,000 USDT" },
    { id: 14, threshold: 1000000, reward: "30,000 USDT" },
  ].map((lvl, index, arr) => {
    const prevThreshold = index === 0 ? 0 : arr[index - 1].threshold;
    const isUnlocked = communityProgress >= lvl.threshold;
    
    // Calculate progress percentage for this specific level
    let currentProgress = 0;
    if (isUnlocked) {
      currentProgress = 100;
    } else if (communityProgress > prevThreshold) {
      currentProgress = ((communityProgress - prevThreshold) / (lvl.threshold - prevThreshold)) * 100;
    }

    return {
      ...lvl,
      isUnlocked,
      currentProgress,
      isClaimed: claimedLevels.includes(lvl.id) // Check local state
    };
  });

  const handleClaim = async (levelId: number) => {
    if (!walletAddress) {
      alert(t.pleaseConnect);
      return;
    }

    const level = levels.find(l => l.id === levelId);
    if (!level || !level.isUnlocked || level.isClaimed) return;

    // TODO: Call Smart Contract to claim USDT from Treasury
    // Example: await contract.claimUSDTReward(levelId);
    
    // Mock claim process
    setTxStatus(`${t.claiming} ${level.reward}...`);
    
    setTimeout(() => {
      setTxStatus(`${level.reward}${t.claimedSuccess}`);
      setClaimedLevels(prev => [...prev, levelId]);
      
      setTimeout(() => setTxStatus(""), 3000);
    }, 2000);
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("User denied account access or error occurred:", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert(t.installWallet);
    }
  };

  const handleSync = async () => {
    if (!walletAddress) {
      alert(t.pleaseConnect);
      return;
    }
    
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert(t.noWeb3);
      return;
    }

    setIsSyncing(true);
    setTxStatus(t.awaitingConfirmation);
    
    try {
      // 0. Ensure Network is BSC Mainnet (0x38)
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38',
                chainName: 'BNB Smart Chain Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // 1. Setup Ethers Provider & Signer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // 2. Connect to Contract
      const contract = new ethers.Contract(PEACE_PROTOCOL_ADDRESS, PEACE_PROTOCOL_ABI, signer);
      
      // 3. Get Required Fee
      setTxStatus(t.fetchingFee);
      const fee = await contract.interactionFee();

      // 4. Call interact() - with BNB Value and Referrer
      setTxStatus(t.sendingTx);
      const tx = await contract.interact(referrer, { value: fee });
      
      setTxStatus(t.waitingBlock);
      await tx.wait(); // Wait for transaction to be mined

      // 5. Success UI Updates
      setTxStatus(t.syncSuccess);
      setBalance((prev) => prev + 1000); // Add 1000 PEACE (Optimistic update)
      setCooldownRemaining(12 * 60 * 60); // Reset to 12 hours
      
      // Start countdown
      const interval = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error("Contract interaction failed:", error);
      // Basic error parsing
      if (error?.code === 'ACTION_REJECTED') {
        setTxStatus(t.txRejected);
      } else if (error?.message?.includes("Cool down active")) {
        setTxStatus(t.cooldownActive);
      } else {
        // Show truncated error message for debugging
        const errMsg = error?.shortMessage || error?.message || error?.code || "Unknown Error";
        setTxStatus(`${t.syncFailed} - ${errMsg.substring(0, 40)}`);
      }
    } finally {
      setIsSyncing(false);
      // Clear status message after 5 seconds
      setTimeout(() => setTxStatus(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Subtle modern background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header / Navbar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Peace Protocol</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-2"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-slate-700"
          >
            <Wallet size={16} className={walletAddress ? "text-indigo-400" : "text-slate-400"} />
            {isConnecting ? t.connecting : walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : t.connectWallet}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-12 pb-24 flex flex-col items-center">
        
        {/* Title Section */}
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Airdrop</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Interact with the contract to verify your address, accumulate PEACE tokens, and secure your allocation.
          </p>
        </div>

        {/* Central Card (Uniswap/PancakeSwap style) */}
        <div className="w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-2xl">
          
          {/* Balance Display */}
          <div className="bg-[#0F172A] rounded-2xl p-5 mb-6 border border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Your Balance</span>
              <span className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">BSC Mainnet</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white"><CountUp value={balance} /></span>
              <span className="text-lg text-slate-300 font-medium mb-1">PEACE</span>
            </div>
          </div>

          {/* Referrer Info */}
          {referrer !== "0x0000000000000000000000000000000000000000" && (
            <div className="flex justify-between items-center bg-slate-800/50 rounded-xl p-3 mb-6 border border-slate-700/50">
              <span className="text-sm text-slate-400">Invited by</span>
              <span className="text-sm font-mono text-indigo-300">{referrer.substring(0, 6)}...{referrer.substring(38)}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing || cooldownRemaining > 0 || !walletAddress}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              !walletAddress 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : cooldownRemaining > 0
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : isSyncing
                    ? 'bg-indigo-600/80 text-white cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
            }`}
          >
            {!walletAddress ? (
              "Connect Wallet to Claim"
            ) : isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : cooldownRemaining > 0 ? (
              `Next claim in: ${Math.floor(cooldownRemaining / 3600).toString().padStart(2, '0')}:${Math.floor((cooldownRemaining % 3600) / 60).toString().padStart(2, '0')}:${(cooldownRemaining % 60).toString().padStart(2, '0')}`
            ) : (
              "Interact & Claim"
            )}
          </button>

          {/* Status Message */}
          {txStatus && (
            <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${
              txStatus.includes("Failed") || txStatus.includes("失败") || txStatus.includes("Rejected") || txStatus.includes("拒绝")
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            }`}>
              {txStatus}
            </div>
          )}

          {/* Referral Link Area */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-sm font-medium text-slate-400 mb-3">Your Referral Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 overflow-hidden">
                <span className="text-sm text-slate-300 font-mono truncate block w-full">
                  {walletAddress ? `...?ref=${walletAddress.substring(0,8)}...` : "Connect wallet to get link"}
                </span>
              </div>
              <button 
                onClick={copyReferralLink}
                disabled={!walletAddress}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors"
              >
                {isCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid (Stats) */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* We will replace these with simpler standard UI components in the next step */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6">
             <QuotaDashboard totalSlots={20} activeSlots={14} />
          </div>
          <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6">
             <Leaderboard levels={levels} onClaim={handleClaim} />
          </div>
        </div>

      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-deep-space flex flex-col items-center justify-center text-white/50 font-mono tracking-[0.5em] text-xs"><div className="w-8 h-8 border-t-2 border-premium-gold rounded-full animate-spin mb-4" />INITIALIZING SYSTEM...</div>}>
      <HomeContent />
    </Suspense>
  );
}

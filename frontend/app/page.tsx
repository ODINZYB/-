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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 bg-deep-space selection:bg-mars-red/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-mars-red/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-neon-green/5 rounded-full blur-[180px] opacity-60" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
      </div>

      {/* Top Bar with Wallet Connect & Language Toggle */}
      <div className="absolute top-8 right-12 z-20 flex items-center gap-4">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono text-white/60 hover:text-white transition-all duration-300"
          title="Toggle Language"
        >
          <Globe size={16} className="mb-0.5" />
          <span className="absolute -bottom-4 text-[8px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            {language === 'en' ? 'ZH' : 'EN'}
          </span>
        </button>

        {/* Wallet Connect */}
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="glass-button px-6 py-2.5 rounded-full flex items-center gap-3 text-xs font-mono tracking-[0.2em] text-white/80 hover:text-mars-red transition-all duration-500"
        >
          <Wallet size={16} className={isConnecting ? "animate-pulse text-mars-red" : "text-mars-red/80"} />
          <span className="mt-[2px]">{isConnecting ? t.connecting : walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : t.connectWallet}</span>
        </button>
      </div>

      <main className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-12">
        
        {/* Left Column: Sync & Balance */}
        <div className="flex flex-col items-center lg:items-start space-y-12">
          
          {/* Header */}
          <div className="text-center lg:text-left space-y-4">
            <h1 className="text-5xl lg:text-7xl font-light tracking-[-0.05em] text-white/90">
              PEACE <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-mars-red via-premium-gold to-mars-red bg-[length:200%_auto] animate-[gradient_8s_linear_infinite]">PROTOCOL</span>
            </h1>
            <p className="text-white/40 font-mono text-xs tracking-[0.3em] uppercase">
              {t.subtitle}
            </p>
            {/* Display Referrer if bounded */}
            {referrer !== "0x0000000000000000000000000000000000000000" ? (
              <p className="text-[10px] text-neon-green/60 font-mono mt-4 bg-neon-green/5 inline-block px-4 py-1.5 rounded-full border border-neon-green/10 shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]">
                {t.referredBy} <span className="text-neon-green/80">{referrer.substring(0, 6)}...{referrer.substring(38)}</span>
              </p>
            ) : null}
          </div>

          {/* Sync Button Container */}
          <div className="relative py-8">
            <SyncButton 
              onSync={handleSync} 
              isSyncing={isSyncing} 
              cooldownRemaining={cooldownRemaining} 
            />
            
            {/* Connection Status & TX Status */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 whitespace-nowrap">
              <div className="flex items-center gap-2 bg-deep-space/50 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_#00F0FF]" />
                <span className="text-[9px] font-mono text-white/50 tracking-[0.2em]">
                  {t.systemOnline.split(' ')[0]} <span className="text-neon-green/80">{t.systemOnline.split(' ')[1] || t.systemOnline.replace(t.systemOnline.split(' ')[0], '')}</span>
                </span>
              </div>
              {txStatus ? (
                <span className="text-[10px] font-mono text-mars-red tracking-[0.1em] mt-1 animate-pulse">
                  {txStatus}
                </span>
              ) : null}
            </div>
          </div>

          {/* Balance Display */}
          <div className="glass-panel p-8 flex flex-col items-center lg:items-start min-w-[320px] relative group border-t-0 border-l-0 border-r-0 border-b border-mars-red/20 rounded-none bg-gradient-to-b from-white/[0.02] to-transparent">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
              <div className="w-1 h-1 bg-mars-red rounded-full" />
              {t.totalAssets}
            </span>
            <div className="flex items-baseline gap-3 mb-6">
              <CountUp value={balance} />
              <span className="text-sm font-light tracking-widest text-mars-red/80">PEACE</span>
            </div>
            
            {/* Referral Link Copy Button */}
            <div className="w-full pt-5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-mono tracking-widest">{t.referralLink}</span>
              <button 
                onClick={copyReferralLink}
                className="flex items-center gap-2 text-[10px] tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 rounded transition-all duration-300 text-white/60 hover:text-white"
              >
                {isCopied ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
                {isCopied ? t.copied : t.copy}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Dashboard & Leaderboard */}
        <div className="flex flex-col gap-8 w-full max-w-md mx-auto lg:mx-0">
          
          {/* Quota Dashboard */}
          <QuotaDashboard totalSlots={20} activeSlots={14} />

          {/* Leaderboard */}
          <Leaderboard levels={levels} onClaim={handleClaim} />

        </div>

      </main>

      <footer className="absolute bottom-6 text-center w-full z-10 flex justify-center items-center gap-4">
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/10" />
        <p className="text-[9px] text-white/20 font-mono tracking-[0.4em] uppercase">
          {t.footer}
        </p>
        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/10" />
      </footer>
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

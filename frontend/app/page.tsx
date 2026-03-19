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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0a0a] selection:bg-premium-gold/30">
      
      {/* Premium Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Gold/Orange glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-premium-gold/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#E5C07B]/5 rounded-full blur-[150px]" />
        {/* Modern grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)]"></div>
      </div>

      {/* Modern Top Navigation */}
      <nav className="absolute top-0 w-full z-30 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-premium-gold to-[#8B6914] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            <span className="font-bold text-black text-lg">P</span>
          </div>
          <span className="font-bold text-white/90 tracking-widest hidden md:block">PEACE</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="h-10 px-3 rounded-xl flex items-center justify-center text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
          >
            <Globe size={14} className="mr-2 opacity-70" />
            {language === 'en' ? 'EN' : '中'}
          </button>

          {/* Premium Wallet Connect */}
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="h-10 px-5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300 relative overflow-hidden group"
            style={{
              background: walletAddress ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid rgba(212,175,55,0.2)'
            }}
          >
            <div className="absolute inset-0 bg-premium-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Wallet size={16} className={walletAddress ? "text-premium-gold" : "text-premium-gold/80"} />
            <span className="text-white/90 relative z-10">
              {isConnecting ? t.connecting : walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : t.connectWallet}
            </span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center mt-24 mb-16 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
            <span className="text-xs font-medium text-white/70 tracking-wide">Mainnet Active</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Claim Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-premium-gold via-[#FFF2CD] to-premium-gold bg-[length:200%_auto] animate-[gradient_8s_linear_infinite]">
              Peace Protocol
            </span>
            <br/> Airdrop
          </h1>
          
          <p className="text-base md:text-lg text-white/50 font-light max-w-xl mx-auto leading-relaxed">
            {t.subtitle} Interact with the contract to verify your address and secure your allocation.
          </p>

          {referrer !== "0x0000000000000000000000000000000000000000" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-premium-gold/5 border border-premium-gold/10">
              <span className="text-xs text-white/40">{t.referredBy}</span>
              <span className="text-xs font-mono text-premium-gold">{referrer.substring(0, 6)}...{referrer.substring(38)}</span>
            </div>
          )}
        </div>

        {/* Central Interaction Card (Premium UI) */}
        <div className="w-full max-w-md relative">
          {/* Glowing border effect behind the card */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-premium-gold/30 to-transparent rounded-[2rem] blur-sm opacity-50" />
          
          <div className="relative bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Balance Section */}
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/5">
              <span className="text-sm font-medium text-white/40 mb-2 uppercase tracking-widest">{t.totalAssets}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight"><CountUp value={balance} /></span>
                <span className="text-lg text-premium-gold font-medium">PEACE</span>
              </div>
            </div>

            {/* Sync Action Area */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <SyncButton 
                  onSync={handleSync} 
                  isSyncing={isSyncing} 
                  cooldownRemaining={cooldownRemaining} 
                />
              </div>

              {/* Status Message */}
              <div className="h-6 flex items-center justify-center">
                {txStatus && (
                  <span className={`text-xs font-medium px-3 py-1 rounded-lg ${
                    txStatus.includes("Failed") || txStatus.includes("失败") || txStatus.includes("Rejected") || txStatus.includes("拒绝")
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-premium-gold/10 text-premium-gold border border-premium-gold/20"
                  }`}>
                    {txStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Referral Link */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between bg-black/40 rounded-xl p-1 pl-4 border border-white/5">
                <span className="text-xs text-white/40 font-mono truncate mr-4">
                  {walletAddress ? `...?ref=${walletAddress.substring(0,6)}...` : t.referralLink}
                </span>
                <button 
                  onClick={copyReferralLink}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Dashboard Grid - Two columns on desktop */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-[#111]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <QuotaDashboard totalSlots={20} activeSlots={14} />
          </div>
          <div className="bg-[#111]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <Leaderboard levels={levels} onClaim={handleClaim} />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium text-white tracking-widest uppercase">
          {t.footer}
        </p>
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

"use client";

import { motion } from "framer-motion";
import { Lock, Unlock, Zap, Download } from "lucide-react";
import { clsx } from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";

interface Level {
  id: number;
  threshold: number;
  reward: string;
  isUnlocked: boolean;
  currentProgress: number; // 0 to 100
  isClaimed?: boolean;
}

interface LeaderboardProps {
  levels: Level[];
  onClaim?: (levelId: number) => void;
}

export function Leaderboard({ levels, onClaim }: LeaderboardProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-panel p-6 rounded-3xl w-full max-w-lg space-y-6 max-h-[600px] overflow-y-auto border-t-0 border-l-0 border-r-0 border-b border-white/5">
      <div className="sticky top-0 bg-deep-space/90 backdrop-blur-xl z-20 pb-4 border-b border-white/5 mb-6 -mt-2 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
            <Zap className="w-4 h-4 text-premium-gold" />
          </div>
          <div>
            <h2 className="text-sm font-light text-white tracking-[0.2em]">{t.communityTreasury}</h2>
            <p className="text-[10px] text-white/40 tracking-widest mt-1">{t.milestoneRewards}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative">
        {/* 连接线 */}
        <div className="absolute left-[28px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent z-0" />

        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={clsx(
              "relative z-10 group p-4 rounded-2xl transition-all duration-500",
              level.isUnlocked 
                ? "bg-gradient-to-r from-premium-gold/[0.03] to-transparent border border-premium-gold/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                : "bg-white/[0.01] border border-white/5 hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-center gap-5">
              {/* 状态图标 */}
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500",
                level.isUnlocked 
                  ? "bg-deep-space border-premium-gold/50 text-premium-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                  : "bg-deep-space border-white/5 text-white/20"
              )}>
                {level.isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
              </div>

              {/* 内容 */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className={clsx(
                    "font-light text-xs tracking-[0.2em]",
                    level.isUnlocked ? "text-white/90" : "text-white/30"
                  )}>
                    {t.level} {level.id}
                  </span>
                  <span className={clsx(
                    "text-[10px] font-mono px-2 py-1 rounded-md tracking-widest",
                    level.isUnlocked ? "bg-premium-gold/10 text-premium-gold border border-premium-gold/20" : "bg-white/5 text-white/30"
                  )}>
                    {level.reward}
                  </span>
                </div>
                
                {/* 进度条 */}
                <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level.currentProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={clsx(
                      "h-full rounded-full relative",
                      level.isUnlocked ? "bg-gradient-to-r from-premium-gold/50 to-premium-gold" : "bg-white/20"
                    )}
                  >
                    {level.isUnlocked && (
                       <motion.div
                         className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px]"
                         animate={{ x: [-20, 100] }}
                         transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                       />
                    )}
                  </motion.div>
                </div>
                
                <div className="mt-2 flex justify-between text-[9px] text-white/30 font-mono tracking-widest">
                  <span>{level.currentProgress.toFixed(1)}%</span>
                  <span>{level.threshold.toLocaleString()} {t.minted}</span>
                </div>
              </div>

              {/* Claim Button */}
              {level.isUnlocked && (
                <div className="ml-2 shrink-0 flex flex-col items-center justify-center">
                  <button
                    onClick={() => onClaim && onClaim(level.id)}
                    disabled={level.isClaimed}
                    className={clsx(
                      "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 border",
                      level.isClaimed 
                        ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed" 
                        : "bg-neon-green/5 border-neon-green/30 text-neon-green hover:bg-neon-green/20 hover:scale-110 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                    )}
                    title={level.isClaimed ? t.alreadyClaimed : t.claimReward}
                  >
                    {level.isClaimed ? <Lock size={12} /> : <Download size={12} />}
                  </button>
                  {level.isClaimed && <span className="text-[7px] mt-1.5 text-white/30 tracking-widest">{t.claimed}</span>}
                </div>
              )}
            </div>

            {/* 解锁特效 - 仅在解锁状态显示 */}
            {level.isUnlocked && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-premium-gold/5 blur-[30px] rounded-full" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

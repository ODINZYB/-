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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-slate-800">Reward Milestones</h3>
        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
          Unlock USDT
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {levels.map((level) => (
          <div 
            key={level.id}
            className={`p-4 rounded-xl border transition-all ${
              level.isClaimed 
                ? "bg-slate-50 border-slate-100" 
                : level.isUnlocked 
                  ? "bg-blue-50/50 border-blue-200 hover:border-blue-300" 
                  : "bg-white border-slate-100"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-sm font-medium text-slate-800 block">Level {level.id}</span>
                <span className="text-xs text-slate-500">{level.threshold} Interactions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${level.isUnlocked && !level.isClaimed ? 'text-blue-600' : 'text-slate-400'}`}>
                  {level.reward}
                </span>
                
                {level.isClaimed ? (
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold">
                    Claimed
                  </span>
                ) : (
                  <button
                    onClick={() => onClaim && onClaim(level.id)}
                    disabled={!level.isUnlocked}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      level.isUnlocked 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {t.claimReward || "Claim"}
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar for locked levels */}
            {!level.isUnlocked && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-slate-300 transition-all duration-500"
                  style={{ width: `${level.currentProgress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

interface SyncButtonProps {
  onSync: () => void;
  isSyncing: boolean;
  cooldownRemaining: number; // in seconds
}

export function SyncButton({ onSync, isSyncing, cooldownRemaining }: SyncButtonProps) {
  const [fillPercentage, setFillPercentage] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    if (cooldownRemaining > 0) {
      // 12 hours = 43200 seconds
      const totalCooldown = 12 * 60 * 60;
      const percentage = ((totalCooldown - cooldownRemaining) / totalCooldown) * 100;
      setFillPercentage(percentage);
    } else {
      setFillPercentage(100);
    }
  }, [cooldownRemaining]);

  return (
    <div className="relative group">
      {/* 流光边缘效果 - 仅在可点击时显示 */}
      {cooldownRemaining === 0 && (
        <div className="absolute -inset-1 bg-gradient-to-r from-premium-gold/30 to-neon-green/30 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-500 animate-pulse"></div>
      )}

      <motion.button
        whileHover={cooldownRemaining === 0 ? { scale: 1.02 } : {}}
        whileTap={cooldownRemaining === 0 ? { scale: 0.98 } : {}}
        onClick={cooldownRemaining === 0 ? onSync : undefined}
        className={twMerge(
          "relative w-72 h-72 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-xl transition-all shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]",
          cooldownRemaining > 0 ? "cursor-not-allowed opacity-80" : "cursor-pointer"
        )}
        style={{
          background: "radial-gradient(circle at center, rgba(20,20,20,0.6) 0%, rgba(5,5,5,0.95) 100%)",
        }}
      >
        {/* 外圈装饰 */}
        <div className="absolute inset-2 rounded-full border border-white/[0.03] shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
        <div className="absolute inset-[14px] rounded-full border border-white/[0.02] border-dashed"></div>

        {/* 能量填充动画 (SVG Circle) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* 背景轨 */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="3"
          />
          {/* 进度轨 */}
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={cooldownRemaining > 0 ? "rgba(255,255,255,0.1)" : "url(#goldGradient)"} 
            strokeWidth="3"
            strokeDasharray="289.02" // 2 * PI * 46
            strokeDashoffset={289.02 - (289.02 * fillPercentage) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={cooldownRemaining === 0 ? { filter: "drop-shadow(0 0 4px rgba(229,192,123,0.5))" } : {}}
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#E5C07B" />
            </linearGradient>
          </defs>
        </svg>

        {/* 中心内容 */}
        <div className="z-10 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait" initial={false}>
            {isSyncing ? (
              <motion.div
                key="syncing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 border-[1px] border-white/10 border-t-premium-gold rounded-full animate-spin mb-4" />
                <span className="text-[10px] tracking-[0.3em] text-premium-gold font-light">{t.syncing}</span>
              </motion.div>
            ) : cooldownRemaining > 0 ? (
              <motion.div
                key="cooldown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="text-3xl font-light tracking-widest text-white/60 mb-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {new Date(cooldownRemaining * 1000).toISOString().substr(11, 8)}
                </div>
                <div className="h-[1px] w-8 bg-white/10 mb-2"></div>
                <div className="text-[9px] text-white/30 uppercase tracking-[0.4em]">{t.recharging}</div>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="text-sm font-light tracking-[0.4em] text-premium-gold mb-2 uppercase">
                  {t.initiate}
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-premium-gold/50 to-transparent mb-2"></div>
                <div className="text-[9px] text-white/40 tracking-[0.3em] uppercase">{t.exploration}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}

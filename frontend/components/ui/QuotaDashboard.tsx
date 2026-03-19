"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuotaDashboardProps {
  totalSlots: number;
  activeSlots: number;
}

export function QuotaDashboard({ totalSlots = 20, activeSlots }: QuotaDashboardProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-panel p-6 rounded-3xl w-full max-w-md border-t-0 border-l-0 border-r-0 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-light text-white/40 uppercase tracking-[0.3em]">{t.deviceQuota}</h3>
        <span className="text-[9px] font-mono text-neon-green bg-neon-green/5 border border-neon-green/20 px-3 py-1 rounded-full tracking-widest shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]">
          {activeSlots} / {totalSlots} {t.active}
        </span>
      </div>
      
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={clsx(
              "h-10 rounded-[2px] relative overflow-hidden transition-all duration-500",
              i < activeSlots 
                ? "bg-neon-green/10 border-b-2 border-neon-green shadow-[0_4px_10px_rgba(0,240,255,0.1)]" 
                : "bg-white/[0.02] border-b-2 border-white/10"
            )}
          >
            {i < activeSlots && (
              <motion.div 
                layoutId="active-glow"
                className="absolute inset-0 bg-gradient-to-t from-neon-green/20 to-transparent animate-pulse" 
              />
            )}
            
            {/* 极简刻度线装饰 */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-current opacity-20" />
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-between text-[9px] text-white/30 font-mono tracking-[0.2em] border-t border-white/5 pt-4">
        <span>{t.fingerprint}: <span className="text-white/50">{t.valid}</span></span>
        <span className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
          {t.encrypted}
        </span>
      </div>
    </div>
  );
}

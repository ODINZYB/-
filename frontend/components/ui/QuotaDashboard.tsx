"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuotaDashboardProps {
  totalSlots: number;
  activeSlots: number;
}

export function QuotaDashboard({ totalSlots, activeSlots }: { totalSlots: number, activeSlots: number }) {
  const percentage = (activeSlots / totalSlots) * 100;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Community Quota</h3>
        <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
          {activeSlots} / {totalSlots} Active
        </span>
      </div>
      
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-sm text-slate-400 mt-2">
        Global interaction slots are limited. Claim your spot before the quota is filled.
      </p>
    </div>
  );
}

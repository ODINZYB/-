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
  // We no longer need the complex SVG animation logic since we moved to a standard button in page.tsx
  // This component is currently bypassed in page.tsx as the button is rendered directly there.
  return null;
}

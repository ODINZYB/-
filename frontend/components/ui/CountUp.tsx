"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
}

export function CountUp({ value, duration = 2.5 }: CountUpProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current: number) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className="inline-block tabular-nums font-mono text-5xl font-bold tracking-tight text-white drop-shadow-lg">
      {display}
    </motion.span>
  );
}

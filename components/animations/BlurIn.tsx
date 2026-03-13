'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface BlurInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export default function BlurIn({ children, delay = 0, duration = 0.6 }: BlurInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

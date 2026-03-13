'use client';

import { motion } from 'motion/react';

interface SplitTextProps {
  text: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
}

export default function SplitText({ 
  text, 
  delay = 0, 
  duration = 0.6, 
  stagger = 0.08,
  className = "" 
}: SplitTextProps) {
  const words = text.split(' ');

  return (
    <div className={`flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

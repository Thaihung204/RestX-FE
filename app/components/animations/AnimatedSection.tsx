'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  once?: boolean;
  amount?: number;
}

const getDirectionOffset = (direction: string) => {
  switch (direction) {
    case 'up':
      return { y: 60, x: 0 };
    case 'down':
      return { y: -60, x: 0 };
    case 'left':
      return { y: 0, x: 60 };
    case 'right':
      return { y: 0, x: -60 };
    default:
      return { y: 0, x: 0 };
  }
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  style,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  once = true,
  amount = 0.2,
}) => {
  const offset = getDirectionOffset(direction);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: offset.y,
      x: offset.x,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;


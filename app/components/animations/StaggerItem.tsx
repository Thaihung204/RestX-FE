'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none' | 'scale';
  duration?: number;
}

const getDirectionOffset = (direction: string) => {
  switch (direction) {
    case 'up':
      return { y: 40, x: 0, scale: 1 };
    case 'down':
      return { y: -40, x: 0, scale: 1 };
    case 'left':
      return { y: 0, x: 40, scale: 1 };
    case 'right':
      return { y: 0, x: -40, scale: 1 };
    case 'scale':
      return { y: 0, x: 0, scale: 0.9 };
    default:
      return { y: 0, x: 0, scale: 1 };
  }
};

const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  style,
  direction = 'up',
  duration = 0.5,
}) => {
  const offset = getDirectionOffset(direction);

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: offset.y,
      x: offset.x,
      scale: offset.scale,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div className={className} style={style} variants={itemVariants}>
      {children}
    </motion.div>
  );
};

export default StaggerItem;


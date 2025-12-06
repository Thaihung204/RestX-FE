'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  staggerDelay?: number;
  delayStart?: number;
  once?: boolean;
  amount?: number;
}

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  style,
  staggerDelay = 0.1,
  delayStart = 0,
  once = true,
  amount = 0.2,
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delayStart,
        staggerChildren: staggerDelay,
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
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;


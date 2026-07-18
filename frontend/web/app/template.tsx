'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
      initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        duration: 0.5 
      }}
      className="flex-grow flex flex-col w-full h-full"
    >
      {children}
      </m.div>
    </LazyMotion>
  );
}

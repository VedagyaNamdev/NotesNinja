import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  show: boolean;
  delay?: number; // Minimum time to show the loading screen in ms
}

export default function LoadingScreen({ show, delay = 1000 }: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(show);
  
  // Ensure the loading screen stays visible for at least the delay time
  useEffect(() => {
    if (show) {
      setShouldShow(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setShouldShow(false);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [show, delay]);
  
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 border-4 border-primary rounded-full opacity-30"
              />
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 border-4 border-t-primary border-l-transparent border-r-transparent border-b-transparent rounded-full"
              />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-xl font-medium text-foreground"
            >
              Loading...Please wait
            </motion.h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
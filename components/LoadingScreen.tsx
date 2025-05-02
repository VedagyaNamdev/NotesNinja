import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Lottie with no SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LoadingScreenProps {
  show: boolean;
  delay?: number; // Minimum time to show the loading screen in ms
}

export default function LoadingScreen({ show, delay = 1000 }: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(show);
  const [loadingAnimation, setLoadingAnimation] = useState(null);
  
  // Load the animation data on the client side
  useEffect(() => {
    import('@/public/animations/loading.json').then(module => {
      setLoadingAnimation(module.default);
    });
  }, []);
  
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
            <div className="w-64 h-64">
              {loadingAnimation && (
                <Lottie
                  animationData={loadingAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
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
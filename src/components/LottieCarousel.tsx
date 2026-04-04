import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";

interface LottieCarouselProps {
  animations: any[];
  interval?: number;
  className?: string;
}

const LottieCarousel = ({ animations, interval = 6000, className = "" }: LottieCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (animations.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animations.length);
    }, interval);
    return () => clearInterval(timer);
  }, [animations.length, interval]);

  if (animations.length === 0) return null;
  if (animations.length === 1) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Lottie animationData={animations[0]} loop autoplay style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="flex items-center justify-center w-full h-full"
        >
          <Lottie animationData={animations[currentIndex]} loop autoplay style={{ width: "100%", height: "100%" }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LottieCarousel;

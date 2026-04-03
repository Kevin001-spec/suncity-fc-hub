import Lottie from "lottie-react";
import universalLoading from "@/assets/animations/universalloadingscreen.json";

interface LottieAnimationProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
}

const LottieAnimation = ({ animationData, className = "", loop = true, autoplay = true, style }: LottieAnimationProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`} style={style}>
      <Lottie animationData={animationData} loop={loop} autoplay={autoplay} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default LottieAnimation;

// Full-screen loading screen component
export const LottieLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-32 h-32">
        <Lottie animationData={universalLoading} loop={true} autoplay={true} />
      </div>
    </div>
  );
};

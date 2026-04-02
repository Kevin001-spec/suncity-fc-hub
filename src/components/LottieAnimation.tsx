import Lottie from "lottie-react";

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

// Loading screen component
export const LottieLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-24 h-24">
        <Lottie 
          animationData={require("@/assets/animations/universalloadingscreen.json")} 
          loop={true} 
          autoplay={true} 
        />
      </div>
    </div>
  );
};

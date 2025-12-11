import { useState, useEffect } from "react";

interface LoadingDropletProps {
  onComplete: () => void;
  duration?: number;
}

export const LoadingDroplet = ({ onComplete, duration = 2500 }: LoadingDropletProps) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Calcul de ton diagnostic...");

  useEffect(() => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);
      
      // Change status text at 50%
      if (newProgress >= 50 && newProgress < 100) {
        setStatusText("Préparation de tes résultats...");
      }
      
      if (newProgress < 100) {
        requestAnimationFrame(animate);
      } else {
        // Small delay before completing for smooth transition
        setTimeout(onComplete, 300);
      }
    };
    
    requestAnimationFrame(animate);
  }, [duration, onComplete]);

  // Calculate the clip path for the water fill (from bottom to top)
  const fillHeight = 100 - progress;

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-32 h-40 sm:w-40 sm:h-48">
        {/* SVG Droplet */}
        <svg
          viewBox="0 0 100 140"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 4px 12px hsl(var(--primary) / 0.3))" }}
        >
          <defs>
            {/* Gradient for water fill */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="1" />
            </linearGradient>
            
            {/* Gradient for droplet outline */}
            <linearGradient id="outlineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
            
            {/* Clip path for water level */}
            <clipPath id="waterClip">
              <rect
                x="0"
                y={fillHeight * 1.4}
                width="100"
                height={140 - fillHeight * 1.4}
                className="transition-all duration-75"
              />
            </clipPath>
            
            {/* Droplet shape mask */}
            <mask id="dropletMask">
              <path
                d="M50 8 C50 8 15 55 15 85 C15 110 30 130 50 130 C70 130 85 110 85 85 C85 55 50 8 50 8 Z"
                fill="white"
              />
            </mask>
          </defs>
          
          {/* Background droplet outline */}
          <path
            d="M50 8 C50 8 15 55 15 85 C15 110 30 130 50 130 C70 130 85 110 85 85 C85 55 50 8 50 8 Z"
            fill="none"
            stroke="url(#outlineGradient)"
            strokeWidth="3"
            className="opacity-60"
          />
          
          {/* Water fill with wave effect */}
          <g clipPath="url(#waterClip)" mask="url(#dropletMask)">
            {/* Main water fill */}
            <path
              d="M50 8 C50 8 15 55 15 85 C15 110 30 130 50 130 C70 130 85 110 85 85 C85 55 50 8 50 8 Z"
              fill="url(#waterGradient)"
            />
            
            {/* Animated wave on top of water */}
            <path
              d={`M 0 ${fillHeight * 1.4 + 5} 
                  Q 25 ${fillHeight * 1.4 - 3} 50 ${fillHeight * 1.4 + 5} 
                  Q 75 ${fillHeight * 1.4 + 13} 100 ${fillHeight * 1.4 + 5} 
                  L 100 140 L 0 140 Z`}
              fill="hsl(var(--primary))"
              className="opacity-40"
              style={{
                animation: "wave 1.5s ease-in-out infinite alternate",
              }}
            />
          </g>
          
          {/* Shine effect */}
          <ellipse
            cx="35"
            cy="60"
            rx="8"
            ry="15"
            fill="white"
            opacity="0.3"
            transform="rotate(-15 35 60)"
          />
          <ellipse
            cx="38"
            cy="48"
            rx="4"
            ry="8"
            fill="white"
            opacity="0.4"
            transform="rotate(-15 38 48)"
          />
          
          {/* Bubbles animation */}
          {progress > 20 && (
            <>
              <circle
                cx="40"
                cy={100 - progress * 0.3}
                r="3"
                fill="white"
                opacity="0.5"
                style={{
                  animation: "bubble 2s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              />
              <circle
                cx="55"
                cy={110 - progress * 0.35}
                r="2"
                fill="white"
                opacity="0.4"
                style={{
                  animation: "bubble 2.5s ease-in-out infinite",
                  animationDelay: "0.5s",
                }}
              />
              <circle
                cx="65"
                cy={95 - progress * 0.25}
                r="2.5"
                fill="white"
                opacity="0.45"
                style={{
                  animation: "bubble 1.8s ease-in-out infinite",
                  animationDelay: "1s",
                }}
              />
            </>
          )}
        </svg>
        
        {/* Percentage display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-primary-foreground drop-shadow-md" style={{ 
            textShadow: "0 2px 4px hsl(var(--primary) / 0.5)",
            opacity: progress > 15 ? 1 : 0,
            transition: "opacity 0.3s ease-out"
          }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      {/* Status text */}
      <p className="mt-6 text-lg font-semibold text-foreground animate-pulse">
        {statusText}
      </p>
      
      {/* Progress bar */}
      <div className="mt-4 w-48 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(-5px); }
          100% { transform: translateX(5px); }
        }
        
        @keyframes bubble {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.5;
          }
          50% { 
            transform: translateY(-10px) scale(1.1); 
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

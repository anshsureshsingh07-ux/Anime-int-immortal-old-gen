import { motion } from 'motion/react';

interface SparklineProps {
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ color = '#E50914', width = 96, height = 32 }: SparklineProps) {
  // Set up multiple control frames for stochastic live wiggle wave
  const wavePoints = [
    "M 0 20 Q 15 5 30 22 T 60 8 T 90 18 L 100 12",
    "M 0 12 Q 20 28 45 6 T 75 22 T 90 10 L 100 18",
    "M 0 18 Q 12 12 30 4 T 55 24 T 80 14 L 100 10",
    "M 0 20 Q 15 5 30 22 T 60 8 T 90 18 L 100 12"
  ];

  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ width, height }}>
      {/* Background neon soft blur glow stream */}
      <svg className="absolute inset-0 w-full h-full opacity-20 filter blur-[2px]" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d={wavePoints[0]}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            d: wavePoints
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>

      {/* Primary sharp neural stream line */}
      <svg className="w-full h-full" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d={wavePoints[0]}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            d: wavePoints,
            pathLength: [0.85, 1, 0.9, 0.85],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Dynamic scanning signal ping particle tracking */}
        <motion.circle
          r="2"
          fill="#FFF"
          style={{ filter: `drop-shadow(0 0 2px ${color})` }}
          animate={{
            cx: [0, 20, 50, 80, 100],
            cy: [20, 10, 22, 12, 12],
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </svg>
    </div>
  );
}

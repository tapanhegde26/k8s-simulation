// Animated Connection Line between components

import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  color?: string;
}

export function ConnectionLine({ from, to, isActive, color = '#60a5fa' }: ConnectionLineProps) {
  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      <defs>
        <marker
          id={`arrowhead-${from.x}-${to.x}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isActive ? color : '#475569'}
          />
        </marker>
      </defs>

      {/* Base line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isActive ? color : '#475569'}
        strokeWidth={isActive ? 3 : 1.5}
        strokeOpacity={isActive ? 1 : 0.4}
        markerEnd={`url(#arrowhead-${from.x}-${to.x})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : 'none',
        }}
      />

      {/* Animated packet */}
      {isActive && (
        <motion.circle
          r={6}
          fill={color}
          initial={{ cx: from.x, cy: from.y, opacity: 0 }}
          animate={{
            cx: [from.x, to.x],
            cy: [from.y, to.y],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      )}
    </svg>
  );
}

export default ConnectionLine;

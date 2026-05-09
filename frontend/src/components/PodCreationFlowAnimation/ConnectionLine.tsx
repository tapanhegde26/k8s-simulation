// Animated Connection Line for Pod Creation Flow

import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  color?: string;
  label?: string;
}

export function ConnectionLine({ from, to, isActive, color = '#60a5fa', label }: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      <defs>
        <marker
          id={`arrow-${from.x}-${to.x}-${from.y}-${to.y}`}
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
        <linearGradient
          id={`gradient-${from.x}-${to.x}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="50%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.3} />
        </linearGradient>
      </defs>

      {/* Base line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isActive ? color : '#475569'}
        strokeWidth={isActive ? 3 : 1.5}
        strokeOpacity={isActive ? 1 : 0.3}
        markerEnd={`url(#arrow-${from.x}-${to.x}-${from.y}-${to.y})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
        }}
      />

      {/* Animated packet */}
      {isActive && (
        <>
          <motion.circle
            r={8}
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
              filter: `drop-shadow(0 0 10px ${color})`,
            }}
          />
          {/* Trail effect */}
          <motion.circle
            r={4}
            fill={color}
            initial={{ cx: from.x, cy: from.y, opacity: 0 }}
            animate={{
              cx: [from.x, to.x],
              cy: [from.y, to.y],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.1,
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </>
      )}

      {/* Label on line */}
      {isActive && label && (
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="500"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
          }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

export default ConnectionLine;

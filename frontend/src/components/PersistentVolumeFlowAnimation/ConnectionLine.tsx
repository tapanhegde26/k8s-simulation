// Animated Connection Line for PV/PVC Flow

import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  color?: string;
  label?: string;
  dashed?: boolean;
}

export function ConnectionLine({
  from,
  to,
  isActive,
  color = '#60a5fa',
  label,
  dashed = false,
}: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const markerId = `pv-arrow-${from.x}-${to.x}-${from.y}-${to.y}`;

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={isActive ? color : '#475569'} />
        </marker>
      </defs>

      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isActive ? color : '#475569'}
        strokeWidth={isActive ? 3 : 1.5}
        strokeOpacity={isActive ? 1 : 0.3}
        strokeDasharray={dashed ? '8 4' : undefined}
        markerEnd={`url(#${markerId})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
        }}
      />

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
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
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
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </>
      )}

      {isActive && label && (
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="500"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

export default ConnectionLine;

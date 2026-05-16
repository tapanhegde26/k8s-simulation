// Animated Connection Line for Ingress Traffic Flow

import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  color?: string;
  label?: string;
  packetType?: 'https-request' | 'https-response' | 'http-request' | 'http-response' | 'tls' | 'data';
  packetLabel?: string;
}

const packetColors = {
  'https-request': '#22c55e',
  'https-response': '#10b981',
  'http-request': '#3b82f6',
  'http-response': '#60a5fa',
  'tls': '#f59e0b',
  'data': '#8b5cf6',
};

export function ConnectionLine({ 
  from, 
  to, 
  isActive, 
  color = '#60a5fa', 
  label,
  packetType = 'data',
  packetLabel 
}: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const packetColor = packetColors[packetType] || color;

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      <defs>
        <marker
          id={`arrow-${from.x}-${to.x}-${from.y}-${to.y}`}
          markerWidth="6"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
        >
          <polygon
            points="0 0, 6 2.5, 0 5"
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
        strokeWidth={isActive ? 1.5 : 1}
        strokeOpacity={isActive ? 1 : 0.3}
        markerEnd={`url(#arrow-${from.x}-${to.x}-${from.y}-${to.y})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />

      {/* Animated packet */}
      {isActive && (
        <>
          {/* Main packet */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.rect
              width={packetLabel ? 40 : 10}
              height={14}
              rx={3}
              fill={packetColor}
              initial={{ x: from.x - (packetLabel ? 20 : 5), y: from.y - 7 }}
              animate={{
                x: [from.x - (packetLabel ? 20 : 5), to.x - (packetLabel ? 20 : 5)],
                y: [from.y - 7, to.y - 7],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                filter: `drop-shadow(0 0 4px ${packetColor})`,
              }}
            />
            {packetLabel && (
              <motion.text
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                initial={{ x: from.x, y: from.y }}
                animate={{
                  x: [from.x, to.x],
                  y: [from.y, to.y],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {packetLabel}
              </motion.text>
            )}
          </motion.g>

          {/* Trail effect */}
          <motion.circle
            r={2}
            fill={packetColor}
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
              delay: 0.15,
            }}
            style={{
              filter: `drop-shadow(0 0 3px ${packetColor})`,
            }}
          />
        </>
      )}

      {/* Label on line */}
      {isActive && label && (
        <text
          x={midX}
          y={midY - 15}
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

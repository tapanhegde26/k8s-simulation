// Animated Connection Line for Service Mesh mTLS Flow

import { motion } from 'framer-motion';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  color?: string;
  label?: string;
  trafficType?: 'plaintext' | 'encrypted' | 'cert-request' | 'cert-issue' | 'handshake' | 'mtls';
  packetLabel?: string;
}

const trafficColors = {
  'plaintext': '#64748b',
  'encrypted': '#22c55e',
  'cert-request': '#f59e0b',
  'cert-issue': '#ec4899',
  'handshake': '#8b5cf6',
  'mtls': '#22c55e',
};

export function ConnectionLine({ 
  from, 
  to, 
  isActive, 
  color = '#60a5fa', 
  label,
  trafficType = 'plaintext',
  packetLabel 
}: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const packetColor = trafficColors[trafficType] || color;

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
            fill={isActive ? packetColor : '#475569'}
          />
        </marker>
      </defs>

      {/* Base line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isActive ? packetColor : '#475569'}
        strokeWidth={isActive ? 1.5 : 1}
        strokeOpacity={isActive ? 1 : 0.3}
        strokeDasharray={trafficType === 'handshake' && isActive ? '4,4' : 'none'}
        markerEnd={`url(#arrow-${from.x}-${to.x}-${from.y}-${to.y})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${packetColor})` : 'none',
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

          {/* Lock icon for mTLS traffic */}
          {trafficType === 'mtls' && (
            <motion.text
              fill={packetColor}
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
              initial={{ x: from.x, y: from.y - 18, opacity: 0 }}
              animate={{
                x: [from.x, to.x],
                y: [from.y - 18, to.y - 18],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              🔒
            </motion.text>
          )}

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
          y={midY - 12}
          textAnchor="middle"
          fill="white"
          fontSize="9"
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

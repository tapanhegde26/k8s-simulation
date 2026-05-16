// Geometric Shape Components for K8s Architecture

import { motion } from 'framer-motion';

interface ShapeProps {
  size?: number;
  color: string;
  isActive?: boolean;
  isHighlighted?: boolean;
  label?: string;
  onClick?: () => void;
}

const baseStyles = "cursor-pointer transition-all duration-300";
const glowFilter = (color: string, isActive: boolean) => 
  isActive ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})` : `drop-shadow(0 0 4px ${color}40)`;

export function Hexagon({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    return `${size/2 + (size/2) * Math.cos(angle)},${size/2 + (size/2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/6} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Circle({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <circle
          cx={size/2} cy={size/2} r={size/2 - 2}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/6} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Square({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={size-4} height={size-4} rx={4}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/6} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Diamond({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const half = size / 2;
  const points = `${half},2 ${size-2},${half} ${half},${size-2} 2,${half}`;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/7} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Triangle({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const points = `${size/2},4 ${size-4},${size-4} 4,${size-4}`;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size*0.65} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/7} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Pentagon({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    return `${size/2 + (size/2 - 2) * Math.cos(angle)},${size/2 + (size/2 - 2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/7} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Octagon({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * (Math.PI / 180);
    return `${size/2 + (size/2 - 2) * Math.cos(angle)},${size/2 + (size/2 - 2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={size/7} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

export function Rectangle({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const width = size * 1.5;
  const height = size * 0.7;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.05 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={width-4} height={height-4} rx={6}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {label && (
          <text x={width/2} y={height/2} textAnchor="middle" dominantBaseline="middle" 
                fill="white" fontSize={height/3} fontWeight="bold">
            {label}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

// Shape renderer based on type
export function Shape({ 
  shape, 
  ...props 
}: ShapeProps & { shape: string }) {
  switch (shape) {
    case 'hexagon': return <Hexagon {...props} />;
    case 'circle': return <Circle {...props} />;
    case 'square': return <Square {...props} />;
    case 'diamond': return <Diamond {...props} />;
    case 'triangle': return <Triangle {...props} />;
    case 'pentagon': return <Pentagon {...props} />;
    case 'octagon': return <Octagon {...props} />;
    case 'rectangle': return <Rectangle {...props} />;
    default: return <Circle {...props} />;
  }
}

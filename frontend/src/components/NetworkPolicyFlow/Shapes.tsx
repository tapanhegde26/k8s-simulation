// Geometric Shape Components for Network Policy Flow Animation

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
  isActive ? `drop-shadow(0 0 15px ${color}) drop-shadow(0 0 30px ${color})` : `drop-shadow(0 0 4px ${color}40)`;

export function Hexagon({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    return `${size/2 + (size/2) * Math.cos(angle)},${size/2 + (size/2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
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

export function Shield({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size;
  const height = size * 1.2;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <path
          d={`M${width/2},2 
              L${width-4},${height*0.25} 
              L${width-4},${height*0.55} 
              Q${width-4},${height*0.85} ${width/2},${height-4}
              Q4,${height*0.85} 4,${height*0.55}
              L4,${height*0.25} Z`}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <text x={width/2} y={height*0.45} textAnchor="middle" dominantBaseline="middle" 
              fill="white" fontSize={10} fontWeight="bold">
          {isActive ? '✓' : '🛡'}
        </text>
      </svg>
    </motion.div>
  );
}

export function Firewall({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 1.2;
  const height = size * 0.8;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={width-4} height={height-4} rx={4}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {/* Brick pattern */}
        <line x1={width*0.33} y1={2} x2={width*0.33} y2={height*0.5} stroke="white" strokeWidth={1} opacity={0.3} />
        <line x1={width*0.66} y1={2} x2={width*0.66} y2={height*0.5} stroke="white" strokeWidth={1} opacity={0.3} />
        <line x1={2} y1={height*0.5} x2={width-2} y2={height*0.5} stroke="white" strokeWidth={1} opacity={0.3} />
        <line x1={width*0.2} y1={height*0.5} x2={width*0.2} y2={height-2} stroke="white" strokeWidth={1} opacity={0.3} />
        <line x1={width*0.5} y1={height*0.5} x2={width*0.5} y2={height-2} stroke="white" strokeWidth={1} opacity={0.3} />
        <line x1={width*0.8} y1={height*0.5} x2={width*0.8} y2={height-2} stroke="white" strokeWidth={1} opacity={0.3} />
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
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
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
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
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

export function Circle({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
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
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={size-4} height={size-4} rx={6}
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

export function Rectangle({ size = 60, color, isActive, isHighlighted, label, onClick }: ShapeProps) {
  const width = size * 1.4;
  const height = size * 0.65;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
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

export function Shape({ 
  shape, 
  ...props 
}: ShapeProps & { shape: string }) {
  switch (shape) {
    case 'hexagon': return <Hexagon {...props} />;
    case 'circle': return <Circle {...props} />;
    case 'square': return <Square {...props} />;
    case 'diamond': return <Diamond {...props} />;
    case 'octagon': return <Octagon {...props} />;
    case 'rectangle': return <Rectangle {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'firewall': return <Firewall {...props} />;
    default: return <Circle {...props} />;
  }
}

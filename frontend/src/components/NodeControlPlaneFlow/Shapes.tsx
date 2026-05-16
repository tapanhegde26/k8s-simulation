// Geometric Shape Components for Node-Control Plane Communication Flow

import { motion } from 'framer-motion';

interface ShapeProps {
  size?: number;
  color: string;
  isActive?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const baseStyles = "cursor-pointer transition-all duration-300";
const glowFilter = (color: string, isActive: boolean) => 
  isActive ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})` : `drop-shadow(0 0 4px ${color}40)`;

export function Shield({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 0.85;
  const height = size;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <path
          d={`M${width/2},2 
              L${width-4},${height*0.25} 
              L${width-4},${height*0.55} 
              Q${width-4},${height*0.85} ${width/2},${height-2}
              Q4,${height*0.85} 4,${height*0.55}
              L4,${height*0.25} Z`}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <text
          x={width/2}
          y={height*0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          CA
        </text>
      </svg>
    </motion.div>
  );
}

export function Key({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 1.1;
  const height = size * 0.65;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <circle
          cx={height*0.4} cy={height/2}
          r={height*0.32}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <circle
          cx={height*0.4} cy={height/2}
          r={height*0.1}
          fill="#1e293b"
        />
        <rect
          x={height*0.6} y={height*0.38}
          width={width - height*0.7} height={height*0.24}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <rect x={width*0.72} y={height*0.52} width={3} height={height*0.2} fill={isActive ? color : `${color}cc`} />
        <rect x={width*0.85} y={height*0.52} width={3} height={height*0.15} fill={isActive ? color : `${color}cc`} />
      </svg>
    </motion.div>
  );
}

export function Hexagon({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    return `${size/2 + (size/2 - 2) * Math.cos(angle)},${size/2 + (size/2 - 2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Octagon({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * (Math.PI / 180);
    return `${size/2 + (size/2 - 2) * Math.cos(angle)},${size/2 + (size/2 - 2) * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Square({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={size-4} height={size-4} rx={6}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Diamond({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const half = size / 2;
  const points = `${half},2 ${size-2},${half} ${half},${size-2} 2,${half}`;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={size} height={size} style={{ filter: glowFilter(color, !!isActive) }}>
        <polygon
          points={points}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Cylinder({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 0.85;
  const height = size;
  const ellipseRy = height * 0.12;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <ellipse
          cx={width/2} cy={height - ellipseRy - 2}
          rx={width/2 - 4} ry={ellipseRy}
          fill={isActive ? color : `${color}99`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <rect
          x={4} y={ellipseRy + 2}
          width={width - 8} height={height - 2*ellipseRy - 4}
          fill={isActive ? color : `${color}cc`}
          stroke="none"
        />
        <line
          x1={4} y1={ellipseRy + 2}
          x2={4} y2={height - ellipseRy - 2}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <line
          x1={width - 4} y1={ellipseRy + 2}
          x2={width - 4} y2={height - ellipseRy - 2}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        <ellipse
          cx={width/2} cy={ellipseRy + 2}
          rx={width/2 - 4} ry={ellipseRy}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Rectangle({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 1.2;
  const height = size * 0.6;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.15 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        <rect
          x={2} y={2} width={width-4} height={height-4} rx={6}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
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
    case 'square': return <Square {...props} />;
    case 'diamond': return <Diamond {...props} />;
    case 'octagon': return <Octagon {...props} />;
    case 'rectangle': return <Rectangle {...props} />;
    case 'cylinder': return <Cylinder {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'key': return <Key {...props} />;
    default: return <Hexagon {...props} />;
  }
}

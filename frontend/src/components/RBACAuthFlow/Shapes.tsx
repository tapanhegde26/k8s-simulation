// Geometric Shape Components for RBAC Authorization Flow Animation

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

export function User({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
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
        {/* Head */}
        <circle
          cx={width/2} cy={height*0.25}
          r={height*0.18}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {/* Body */}
        <path
          d={`M${width*0.2},${height*0.95} 
              Q${width*0.2},${height*0.5} ${width/2},${height*0.45}
              Q${width*0.8},${height*0.5} ${width*0.8},${height*0.95}
              Z`}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
      </svg>
    </motion.div>
  );
}

export function Key({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 1.3;
  const height = size * 0.7;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        {/* Key head (circle) */}
        <circle
          cx={height*0.4} cy={height/2}
          r={height*0.35}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {/* Key hole */}
        <circle
          cx={height*0.4} cy={height/2}
          r={height*0.12}
          fill="#1e293b"
        />
        {/* Key shaft */}
        <rect
          x={height*0.65} y={height*0.35}
          width={width - height*0.75} height={height*0.3}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {/* Key teeth */}
        <rect x={width*0.7} y={height*0.5} width={4} height={height*0.25} fill={isActive ? color : `${color}cc`} />
        <rect x={width*0.82} y={height*0.5} width={4} height={height*0.2} fill={isActive ? color : `${color}cc`} />
      </svg>
    </motion.div>
  );
}

export function Lock({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 0.9;
  const height = size * 1.1;

  return (
    <motion.div 
      className={baseStyles}
      onClick={onClick}
      animate={{ scale: isActive ? 1.2 : isHighlighted ? 1.08 : 1 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg width={width} height={height} style={{ filter: glowFilter(color, !!isActive) }}>
        {/* Shackle */}
        <path
          d={`M${width*0.25},${height*0.4} 
              L${width*0.25},${height*0.25}
              A${width*0.25},${width*0.25} 0 0,1 ${width*0.75},${height*0.25}
              L${width*0.75},${height*0.4}`}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 5 : 4}
          strokeLinecap="round"
        />
        {/* Body */}
        <rect
          x={width*0.1} y={height*0.4}
          width={width*0.8} height={height*0.55}
          rx={4}
          fill={isActive ? color : `${color}cc`}
          stroke={color}
          strokeWidth={isActive ? 3 : 2}
        />
        {/* Keyhole */}
        <circle cx={width/2} cy={height*0.58} r={6} fill="#1e293b" />
        <rect x={width/2 - 3} y={height*0.58} width={6} height={height*0.18} fill="#1e293b" />
      </svg>
    </motion.div>
  );
}

export function Hexagon({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
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
      </svg>
    </motion.div>
  );
}

export function Rectangle({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
  const width = size * 1.4;
  const height = size * 0.6;

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
      </svg>
    </motion.div>
  );
}

export function Circle({ size = 60, color, isActive, isHighlighted, onClick }: ShapeProps) {
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
    case 'diamond': return <Diamond {...props} />;
    case 'octagon': return <Octagon {...props} />;
    case 'rectangle': return <Rectangle {...props} />;
    case 'user': return <User {...props} />;
    case 'key': return <Key {...props} />;
    case 'lock': return <Lock {...props} />;
    default: return <Circle {...props} />;
  }
}

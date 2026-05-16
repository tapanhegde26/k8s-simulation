// Pod Creation Flow Animation - Main Component
// 2D animated visualization of the complete pod creation process

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ChevronRight, 
  Info,
  CheckCircle
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { podCreationComponents, podCreationSteps, getComponentById } from './flowData';
import type { PodCreationComponentId } from './types';

export function PodCreationFlowAnimation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<PodCreationComponentId | null>(null);
  const [podCreated, setPodCreated] = useState(false);

  const steps = podCreationSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<PodCreationComponentId>();
  const activeConnections: { from: PodCreationComponentId; to: PodCreationComponentId }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as PodCreationComponentId);
    activeComponents.add(currentStep.to as PodCreationComponentId);
    activeConnections.push({
      from: currentStep.from as PodCreationComponentId,
      to: currentStep.to as PodCreationComponentId,
    });
  }

  // Check if pod is created (last step)
  useEffect(() => {
    if (currentStep?.to === 'pod') {
      setPodCreated(true);
    }
  }, [currentStep]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev >= steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const reset = useCallback(() => {
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setPodCreated(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setPodCreated(false);
    } else if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setPodCreated(false);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentStepIndex, steps.length]);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
    setIsPlaying(false);
    if (index < steps.length - 1) {
      setPodCreated(false);
    }
  }, [steps.length]);

  useEffect(() => {
    if (!isPlaying || currentStepIndex >= steps.length - 1) return;

    const step = steps[currentStepIndex];
    const timeout = setTimeout(() => {
      nextStep();
    }, step?.duration ? step.duration / speed : 1500 / speed);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStepIndex, steps, speed, nextStep]);

  const getComponentPosition = (id: PodCreationComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    // Adjust for shape center
    const offsetX = comp.shape === 'rectangle' ? 42 : 30;
    const offsetY = comp.shape === 'rectangle' ? 20 : 30;
    return { x: comp.position.x + offsetX, y: comp.position.y + offsetY };
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Pod Creation Flow Animation</h2>
            <p className="text-sm text-slate-400 mt-1">
              Detailed step-by-step visualization of how a pod gets created in Kubernetes
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12">
                {currentStepIndex >= 0 ? `${currentStepIndex + 1}/${steps.length}` : '0/20'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagram Area */}
        <div className="flex-1 relative overflow-auto">
          <div className="absolute inset-0 p-4" style={{ minWidth: '1050px', minHeight: '550px' }}>
            
            {/* Zone: Client */}
            <div 
              className="absolute rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30"
              style={{ left: '20px', top: '150px', width: '180px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-slate-500 text-xs font-medium">
                Client
              </span>
            </div>

            {/* Zone: API Layer */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '220px', top: '40px', width: '250px', height: '280px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-blue-400 text-sm font-semibold">
                API Layer
              </span>
            </div>

            {/* Zone: Control Plane */}
            <div 
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '280px', top: '280px', width: '320px', height: '200px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-purple-400 text-sm font-semibold">
                Control Plane (Scheduling)
              </span>
            </div>

            {/* Zone: etcd */}
            <div 
              className="absolute rounded-xl border-2 border-cyan-500/40 bg-cyan-950/20"
              style={{ left: '490px', top: '150px', width: '100px', height: '100px' }}
            >
              <span className="absolute -top-3 left-2 px-2 bg-slate-900 text-cyan-400 text-xs font-semibold">
                Storage
              </span>
            </div>

            {/* Zone: Worker Node */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '620px', top: '60px', width: '380px', height: '380px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-green-400 text-sm font-semibold">
                Worker Node
              </span>
            </div>

            {/* Zone: External (Registry) */}
            <div 
              className="absolute rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-950/10"
              style={{ left: '800px', top: '410px', width: '140px', height: '100px' }}
            >
              <span className="absolute -top-3 left-2 px-2 bg-slate-900 text-orange-400 text-xs font-medium">
                External
              </span>
            </div>

            {/* Connection Lines */}
            {activeConnections.map((conn, i) => (
              <ConnectionLine
                key={`${conn.from}-${conn.to}-${i}`}
                from={getComponentPosition(conn.from)}
                to={getComponentPosition(conn.to)}
                isActive={true}
                color={getComponentById(conn.from)?.color || '#60a5fa'}
              />
            ))}

            {/* Components */}
            {podCreationComponents.map(comp => {
              const isPodAndCreated = comp.id === 'pod' && podCreated;
              
              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isPodAndCreated ? [1, 1.4, 1] : 1,
                  }}
                  transition={{ 
                    duration: isPodAndCreated ? 0.6 : 0.3,
                    scale: isPodAndCreated ? { repeat: 2, duration: 0.4 } : undefined
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Shape
                      shape={comp.shape}
                      color={comp.color}
                      size={55}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id || isPodAndCreated}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[80px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                  </div>
                  
                  {/* Pod creation success indicator */}
                  {isPodAndCreated && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/50">
                        <CheckCircle size={16} />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Flying Pod Animation */}
            <AnimatePresence>
              {currentStep?.to === 'pod' && currentStep?.from === 'container' && (
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{ 
                    left: getComponentPosition('container').x - 20,
                    top: getComponentPosition('container').y - 20,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    left: getComponentPosition('pod').x - 20,
                    top: getComponentPosition('pod').y - 20,
                    scale: [0, 1.5, 1],
                    opacity: [0, 1, 1]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg shadow-lg shadow-green-500/50 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Pod</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current Step Display - Top Right */}
            <div className="absolute top-4 right-4 w-72">
              <AnimatePresence mode="wait">
                {currentStep ? (
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 border border-slate-600 shadow-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                    </div>
                    <div className="text-white font-medium text-sm mb-2">{currentStep.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{currentStep.description}</p>
                    
                    {/* Step Details */}
                    {currentStep.details && currentStep.details.length > 0 && (
                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="text-xs text-slate-500 mb-1">Details:</div>
                        <ul className="space-y-1">
                          {currentStep.details.map((detail, i) => (
                            <motion.li 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="text-xs text-slate-300 flex items-start gap-1"
                            >
                              <span className="text-blue-400 mt-0.5">•</span>
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600"
                  >
                    <div className="text-slate-400 text-sm">
                      Press <span className="text-blue-400 font-medium">Play</span> to start the pod creation flow
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      20 detailed steps showing the complete journey from kubectl to running pod
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Component Info Popup - Bottom Left */}
            <AnimatePresence>
              {selectedComponent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 w-64"
                >
                  <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase">Component Info</span>
                      </div>
                      <button 
                        onClick={() => setSelectedComponent(null)}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    {(() => {
                      const comp = getComponentById(selectedComponent);
                      if (!comp) return null;
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: comp.color }}
                            />
                            <span className="text-white font-medium text-sm">{comp.name}</span>
                          </div>
                          <p className="text-xs text-slate-300">{comp.description}</p>
                          <div className="mt-2 text-xs text-slate-500">
                            Zone: <span className="text-slate-400 capitalize">{comp.zone.replace('-', ' ')}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completion Message - Center */}
            <AnimatePresence>
              {podCreated && currentStepIndex >= steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-6 text-center shadow-2xl">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-green-400 mb-1">Pod Created Successfully!</h3>
                    <p className="text-sm text-slate-300">
                      All 20 steps completed
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            
            <button
              onClick={reset}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={nextStep}
              disabled={currentStepIndex >= steps.length - 1}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="Next Step"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Jump to Step Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Jump to:</span>
              <select
                value={currentStepIndex}
                onChange={(e) => goToStep(Number(e.target.value))}
                className="bg-slate-700 text-white text-sm rounded px-3 py-1.5 border-none max-w-[200px]"
              >
                <option value={-1}>Select step...</option>
                {steps.map((step, index) => (
                  <option key={step.id} value={index}>
                    {index + 1}. {step.label.replace(/^\d+\.\s*/, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <FastForward size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Speed:</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-slate-700 text-white text-sm rounded px-3 py-1.5 border-none"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
              </select>
            </div>

            <div className="text-sm text-slate-400">
              Step {Math.max(0, currentStepIndex + 1)} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-500 rounded" />
          <span className="text-slate-400">Client</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-slate-400">API Layer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded" />
          <span className="text-slate-400">Control Plane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded" />
          <span className="text-slate-400">Storage (etcd)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-slate-400">Worker Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-slate-400">External</span>
        </div>
      </div>
    </div>
  );
}

export default PodCreationFlowAnimation;

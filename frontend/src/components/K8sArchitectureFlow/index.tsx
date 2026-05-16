// K8s Architecture Flow - Main Component

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, FastForward, ChevronRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { components, flows, getComponentById } from './flowData';
import type { FlowType, ComponentId } from './types';

export function K8sArchitectureFlow() {
  const [currentFlow, setCurrentFlow] = useState<FlowType>('pod-creation');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [podCreated, setPodCreated] = useState(false);
  const [pvcBound, setPvcBound] = useState(false);

  const flow = flows.find(f => f.id === currentFlow)!;
  const currentStep = currentStepIndex >= 0 ? flow.steps[currentStepIndex] : null;

  const activeComponents = new Set<ComponentId>();
  const activeConnections: { from: ComponentId; to: ComponentId }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from);
    activeComponents.add(currentStep.to);
    activeConnections.push({
      from: currentStep.from,
      to: currentStep.to,
    });
  }

  useEffect(() => {
    if (currentStep?.to === 'pod') {
      setPodCreated(true);
    }
    if (currentFlow === 'persistent-volume' && currentStep?.id === 'step5') {
      setPvcBound(true);
    }
  }, [currentStep, currentFlow]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev >= flow.steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [flow.steps.length]);

  const reset = useCallback(() => {
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setPodCreated(false);
    setPvcBound(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentStepIndex >= flow.steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setPodCreated(false);
      setPvcBound(false);
    } else if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setPodCreated(false);
      setPvcBound(false);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentStepIndex, flow.steps.length]);

  useEffect(() => {
    if (!isPlaying || currentStepIndex >= flow.steps.length - 1) return;

    const step = flow.steps[currentStepIndex];
    const timeout = setTimeout(() => {
      nextStep();
    }, step?.duration ? step.duration / speed : 1500 / speed);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStepIndex, flow.steps, speed, nextStep]);

  useEffect(() => {
    reset();
  }, [currentFlow, reset]);

  const getComponentPosition = (id: ComponentId) => {
    const comp = getComponentById(id);
    return comp ? { x: comp.position.x + 30, y: comp.position.y + 30 } : { x: 0, y: 0 };
  };

  const visibleComponents = components.filter(comp => {
    if (currentFlow === 'pod-creation') {
      return !['deployment', 'replicaset', 'service', 'ingress', 'kube-proxy', 'pv', 'pvc', 'storage-backend'].includes(comp.id);
    }
    if (currentFlow === 'deployment') {
      return !['ingress', 'service', 'kube-proxy', 'pv', 'pvc', 'storage-backend'].includes(comp.id);
    }
    if (currentFlow === 'service-request') {
      return ['ingress', 'kube-proxy', 'service', 'pod'].includes(comp.id);
    }
    if (currentFlow === 'persistent-volume') {
      return [
        'kubectl',
        'api-server',
        'etcd',
        'controller-manager',
        'pv',
        'pvc',
        'storage-backend',
        'kubelet',
        'pod',
      ].includes(comp.id);
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Kubernetes Architecture Flow</h2>
            <p className="text-sm text-slate-400 mt-1">
              Interactive visualization of how K8s components work together
            </p>
          </div>
          
          {/* Flow Selector */}
          <div className="flex gap-2 items-center">
            {flows.map(f => (
              <button
                key={f.id}
                onClick={() => setCurrentFlow(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentFlow === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f.name}
              </button>
            ))}
            
            {/* Toggle Side Panel */}
            <button
              onClick={() => setShowSidePanel(!showSidePanel)}
              className={`ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showSidePanel
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title="Toggle details panel"
            >
              <Info size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagram Area */}
        <div className="flex-1 relative overflow-auto">
          {/* SVG Canvas */}
          <motion.div
            className="absolute inset-0 p-6"
            style={{
              minWidth: '1000px',
              minHeight: currentFlow === 'persistent-volume' ? '520px' : '480px',
            }}
          >
            {/* External Area */}
            <div 
              className="absolute rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30"
              style={{ left: '20px', top: '60px', width: '140px', height: '360px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-slate-500 text-xs font-medium">
                External
              </span>
            </div>

            {/* Master Node - Clear boundary on left side */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/50 bg-blue-950/20"
              style={{ left: '180px', top: '20px', width: '380px', height: '420px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-blue-400 text-sm font-semibold">
                Master Node (Control Plane)
              </span>
            </div>

            {/* Worker Node - Clear boundary on right side with gap */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/50 bg-green-950/20"
              style={{ left: '600px', top: '20px', width: '380px', height: '420px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-green-400 text-sm font-semibold">
                Worker Node
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
            {visibleComponents.map(comp => {
              const isPodAndCreated = comp.id === 'pod' && podCreated;
              const isStorageBound =
                (comp.id === 'pv' || comp.id === 'pvc') && pvcBound;
              
              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isPodAndCreated || isStorageBound ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ 
                    duration: isPodAndCreated || isStorageBound ? 0.5 : 0.3,
                    scale: isPodAndCreated || isStorageBound ? { repeat: 2, duration: 0.3 } : undefined
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Shape
                      shape={comp.shape}
                      color={comp.color}
                      size={60}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id || isPodAndCreated || isStorageBound}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[90px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                  </div>
                  
                  {isStorageBound && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-500/50">
                        B
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Pod creation success indicator */}
                  {isPodAndCreated && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-green-500/50">
                        ✓
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            <AnimatePresence>
              {currentFlow === 'persistent-volume' && currentStep?.id === 'step3' && (
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{
                    left: getComponentPosition('storage-backend').x - 15,
                    top: getComponentPosition('storage-backend').y - 15,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    left: getComponentPosition('pv').x - 15,
                    top: getComponentPosition('pv').y - 15,
                    scale: [0, 1.4, 1],
                    opacity: [0, 1, 1],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                  <div className="w-8 h-8 bg-amber-500 rounded-md shadow-lg shadow-amber-500/50" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pod Creation Animation - Shows a mini pod flying to the pod location */}
            <AnimatePresence>
              {currentStep?.to === 'pod' && currentStep?.from === 'container-runtime' && (
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{ 
                    left: getComponentPosition('container-runtime').x - 15,
                    top: getComponentPosition('container-runtime').y - 15,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    left: getComponentPosition('pod').x - 15,
                    top: getComponentPosition('pod').y - 15,
                    scale: [0, 1.5, 1],
                    opacity: [0, 1, 1]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg shadow-lg shadow-green-500/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                </motion.div>
              )}
              {currentFlow === 'persistent-volume' &&
                currentStep?.to === 'pod' &&
                currentStep?.from === 'pv' && (
                  <motion.div
                    className="absolute pointer-events-none"
                    initial={{
                      left: getComponentPosition('pv').x - 15,
                      top: getComponentPosition('pv').y - 15,
                      scale: 0,
                      opacity: 0,
                    }}
                    animate={{
                      left: getComponentPosition('pod').x - 15,
                      top: getComponentPosition('pod').y - 15,
                      scale: [0, 1.4, 1],
                      opacity: [0, 1, 1],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <motion.div className="px-1.5 py-0.5 bg-teal-500 rounded text-white text-[10px] font-bold shadow-lg">
                      /data
                    </motion.div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Step Display - Fixed top right corner */}
            <div className="absolute top-8 right-8 w-64">
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
                      <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {flow.steps.length}
                      </span>
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{currentStep.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{currentStep.description}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600"
                  >
                    <div className="text-slate-400 text-sm">
                      Press <span className="text-blue-400 font-medium">Play</span> to start
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Side Panel - Optional */}
        <AnimatePresence>
          {showSidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-700 bg-slate-800/50 flex flex-col overflow-hidden"
            >
              {/* Collapsible Steps Timeline */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-slate-400 uppercase">
                    All Steps ({flow.steps.length})
                  </h3>
                  {showSteps ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                
                <AnimatePresence>
                  {showSteps && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-auto px-4 pb-4"
                    >
                      <div className="space-y-2">
                        {flow.steps.map((step, index) => (
                          <button
                            key={step.id}
                            onClick={() => {
                              setCurrentStepIndex(index);
                              setIsPlaying(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg transition-all text-xs ${
                              index === currentStepIndex
                                ? 'bg-blue-600/20 border border-blue-500'
                                : index < currentStepIndex
                                ? 'bg-slate-700/30 border border-slate-600'
                                : 'bg-slate-800/50 border border-transparent hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                index === currentStepIndex
                                  ? 'bg-blue-600 text-white'
                                  : index < currentStepIndex
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {index < currentStepIndex ? '✓' : index + 1}
                              </span>
                              <span className={`${
                                index === currentStepIndex ? 'text-white' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Component Info */}
              {selectedComponent && (
                <div className="p-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-400 uppercase">
                      Component Info
                    </h3>
                  </div>
                  {(() => {
                    const comp = getComponentById(selectedComponent);
                    if (!comp) return null;
                    return (
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: comp.color }}
                          />
                          <span className="text-white font-medium">{comp.name}</span>
                        </div>
                        <p className="text-sm text-slate-300">{comp.description}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
              disabled={currentStepIndex >= flow.steps.length - 1}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="Next Step"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
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
              </select>
            </div>

            <div className="text-sm text-slate-400">
              Step {Math.max(0, currentStepIndex + 1)} of {flow.steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-slate-400">Control Plane (Master)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-slate-400">Worker Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-500 rounded" />
          <span className="text-slate-400">External</span>
        </div>
        {currentFlow === 'persistent-volume' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded" />
            <span className="text-slate-400">PV / PVC</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default K8sArchitectureFlow;

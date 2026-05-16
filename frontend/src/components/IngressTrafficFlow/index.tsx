// Ingress Traffic Flow Animation - Main Component
// 2D animated visualization of how external traffic reaches pods via Ingress

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ChevronRight, 
  Info,
  CheckCircle,
  Globe,
  Shield,
  ArrowRightLeft
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { 
  ingressComponents, 
  ingressSteps, 
  getComponentById,
  ingressRules,
  tlsConfig,
  ingressYaml
} from './flowData';
import type { IngressComponentId } from './types';

export function IngressTrafficFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<IngressComponentId | null>(null);
  const [showYaml, setShowYaml] = useState(false);

  const steps = ingressSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<IngressComponentId>();
  const activeConnections: { 
    from: IngressComponentId; 
    to: IngressComponentId;
    packetType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as IngressComponentId);
    activeComponents.add(currentStep.to as IngressComponentId);
    activeConnections.push({
      from: currentStep.from as IngressComponentId,
      to: currentStep.to as IngressComponentId,
      packetType: currentStep.packetType,
      packetLabel: currentStep.packetLabel,
    });
  }

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
  }, []);

  const togglePlay = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentStepIndex, steps.length]);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || currentStepIndex >= steps.length - 1) return;

    const step = steps[currentStepIndex];
    const timeout = setTimeout(() => {
      nextStep();
    }, step?.duration ? step.duration / speed : 1500 / speed);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStepIndex, steps, speed, nextStep]);

  const getComponentPosition = (id: IngressComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    const offsetX = comp.shape === 'rectangle' ? 42 : comp.shape === 'cloud' ? 45 : 30;
    const offsetY = comp.shape === 'rectangle' ? 20 : 30;
    return { x: comp.position.x + offsetX, y: comp.position.y + offsetY };
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isComplete = currentStepIndex >= steps.length - 1;

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="text-amber-400" size={24} />
              Ingress Traffic Flow
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              How external HTTPS traffic reaches your pods through Ingress Controller
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-green-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12">
                {currentStepIndex >= 0 ? `${currentStepIndex + 1}/${steps.length}` : '0/12'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagram Area */}
        <div className="flex-1 relative overflow-auto">
          <div className="absolute inset-0 p-4" style={{ minWidth: '900px', minHeight: '320px' }}>
            
            {/* Zone: External/Internet */}
            <div 
              className="absolute rounded-xl border-2 border-dashed border-slate-500/40 bg-slate-800/20"
              style={{ left: '20px', top: '30px', width: '130px', height: '220px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-slate-400 text-xs font-semibold">
                External
              </span>
            </div>

            {/* Zone: Cloud Provider */}
            <div 
              className="absolute rounded-xl border-2 border-amber-500/40 bg-amber-950/20"
              style={{ left: '160px', top: '80px', width: '120px', height: '120px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-amber-400 text-xs font-semibold">
                Cloud LB
              </span>
            </div>

            {/* Zone: Cluster Edge (Nodes) */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '290px', top: '30px', width: '130px', height: '200px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-green-400 text-xs font-semibold">
                K8s Nodes
              </span>
            </div>

            {/* Zone: Ingress Layer */}
            <div 
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '430px', top: '30px', width: '140px', height: '220px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-purple-400 text-xs font-semibold">
                Ingress
              </span>
            </div>

            {/* Zone: Services */}
            <div 
              className="absolute rounded-xl border-2 border-indigo-500/40 bg-indigo-950/20"
              style={{ left: '580px', top: '30px', width: '130px', height: '220px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-indigo-400 text-xs font-semibold">
                Services
              </span>
            </div>

            {/* Zone: Workloads */}
            <div 
              className="absolute rounded-xl border-2 border-emerald-500/40 bg-emerald-950/20"
              style={{ left: '720px', top: '10px', width: '120px', height: '250px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-emerald-400 text-xs font-semibold">
                Pods
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
                packetType={conn.packetType as any}
                packetLabel={conn.packetLabel}
              />
            ))}

            {/* Components */}
            {ingressComponents.map(comp => {
              const isPodActive = activeComponents.has(comp.id) && comp.zone === 'workloads';
              
              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isPodActive ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ 
                    duration: isPodActive ? 0.5 : 0.3,
                    scale: isPodActive ? { repeat: 2, duration: 0.3 } : undefined
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Shape
                      shape={comp.shape}
                      color={comp.color}
                      size={50}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[70px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                  </div>
                  
                  {/* Success indicator for final step */}
                  {isPodActive && isComplete && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/50">
                        <CheckCircle size={12} />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Current Step Display - moved to bottom left */}
            <div className="absolute bottom-2 left-2 w-72 z-20">
              <AnimatePresence mode="wait">
                {currentStep ? (
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        currentStep.packetType?.includes('https') ? 'bg-green-600' :
                        currentStep.packetType?.includes('http') ? 'bg-blue-600' :
                        'bg-purple-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.packetType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.packetType.includes('https') ? 'bg-green-500/20 text-green-300' :
                          currentStep.packetType.includes('http') ? 'bg-blue-500/20 text-blue-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {currentStep.packetType.replace('-', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{currentStep.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{currentStep.description}</p>
                    
                    {/* Step Details */}
                    {currentStep.details && currentStep.details.length > 0 && (
                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <ul className="space-y-1">
                          {currentStep.details.map((detail, i) => (
                            <motion.li 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="text-xs text-slate-300 flex items-start gap-1"
                            >
                              <span className="text-amber-400 mt-0.5">•</span>
                              <span className="font-mono text-[10px]">{detail}</span>
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
                    className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600"
                  >
                    <div className="text-slate-400 text-sm">
                      Press <span className="text-amber-400 font-medium">Play</span> to start
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      12 steps: External → Cloud LB → Ingress → Service → Pod
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Component Info Popup - moved to top left */}
            <AnimatePresence>
              {selectedComponent && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-2 left-2 w-64 z-20"
                >
                  <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Info size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase">Info</span>
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
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: comp.color }}
                            />
                            <span className="text-white font-medium text-sm">{comp.name}</span>
                          </div>
                          <p className="text-xs text-slate-300">{comp.description}</p>
                          {(comp.ipAddress || comp.hostname) && (
                            <div className="mt-2 text-xs font-mono">
                              {comp.hostname && (
                                <div><span className="text-slate-500">Host: </span><span className="text-amber-400">{comp.hostname}</span></div>
                              )}
                              {comp.ipAddress && (
                                <div><span className="text-slate-500">IP: </span><span className="text-cyan-400">{comp.ipAddress}</span>{comp.port && <span className="text-slate-500">:{comp.port}</span>}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completion Message */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-4 text-center shadow-2xl">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-green-400 mb-1">Request Complete!</h3>
                    <p className="text-xs text-slate-300">
                      Response delivered to client
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-60 border-l border-slate-700 bg-slate-800/30 p-3 overflow-auto">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <Globe size={14} />
            Ingress Rules
          </h3>
          
          {/* Ingress Rules */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <div className="text-xs text-slate-400 mb-2">Host: <span className="text-amber-300">myapp.example.com</span></div>
            {ingressRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 text-xs mb-1 font-mono">
                <span className="text-purple-400">{rule.path}</span>
                <span className="text-slate-500">→</span>
                <span className="text-blue-400">{rule.serviceName}:{rule.servicePort}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <Shield size={14} />
            TLS Config
          </h3>
          
          {/* TLS Info */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <div className="text-xs space-y-1">
              <div><span className="text-slate-500">Secret: </span><span className="text-green-400 font-mono">{tlsConfig.secretName}</span></div>
              <div><span className="text-slate-500">Issuer: </span><span className="text-amber-400">{tlsConfig.issuer}</span></div>
              <div><span className="text-slate-500">Hosts: </span><span className="text-cyan-400 font-mono">{tlsConfig.hosts.join(', ')}</span></div>
            </div>
          </div>

          {/* Toggle YAML */}
          <button
            onClick={() => setShowYaml(!showYaml)}
            className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-1.5 mb-2 transition-colors"
          >
            {showYaml ? 'Hide' : 'Show'} Ingress YAML
          </button>

          {/* YAML Display */}
          <AnimatePresence>
            {showYaml && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <pre className="bg-slate-900 rounded-lg p-2 text-[9px] text-slate-300 font-mono overflow-x-auto">
                  {ingressYaml}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traffic Flow Legend */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 mt-3">
            Traffic Types
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-400">HTTPS (encrypted)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-slate-400">HTTP (internal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-slate-400">Control data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-500 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            
            <button
              onClick={reset}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={nextStep}
              disabled={currentStepIndex >= steps.length - 1}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="Next Step"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Jump to Step */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Jump:</span>
              <select
                value={currentStepIndex}
                onChange={(e) => goToStep(Number(e.target.value))}
                className="bg-slate-700 text-white text-xs rounded px-2 py-1 border-none max-w-[150px]"
              >
                <option value={-1}>Select...</option>
                {steps.map((step, index) => (
                  <option key={step.id} value={index}>
                    {index + 1}. {step.label.replace(/^\d+\.\s*/, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <FastForward size={14} className="text-slate-400" />
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-slate-700 text-white text-xs rounded px-2 py-1 border-none"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              {Math.max(0, currentStepIndex + 1)}/{steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 pb-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-slate-500 rounded" />
          <span className="text-slate-400">External</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded" />
          <span className="text-slate-400">Cloud LB</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded" />
          <span className="text-slate-400">Nodes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded" />
          <span className="text-slate-400">Ingress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-indigo-500 rounded" />
          <span className="text-slate-400">Services</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded" />
          <span className="text-slate-400">Pods</span>
        </div>
      </div>
    </div>
  );
}

export default IngressTrafficFlow;

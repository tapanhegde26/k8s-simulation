// Pod-to-Pod Communication Flow Animation - Main Component
// 2D animated visualization of how pods communicate using CNI networking

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
  Network,
  Layers
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { 
  podToPodComponents, 
  podToPodSteps, 
  getComponentById,
  networkNamespaces,
  vxlanInfo,
  cniInfo
} from './flowData';
import type { PodToPodComponentId } from './types';

export function PodToPodFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<PodToPodComponentId | null>(null);
  const [showVxlan, setShowVxlan] = useState(false);

  const steps = podToPodSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<PodToPodComponentId>();
  const activeConnections: { 
    from: PodToPodComponentId; 
    to: PodToPodComponentId;
    packetType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as PodToPodComponentId);
    activeComponents.add(currentStep.to as PodToPodComponentId);
    activeConnections.push({
      from: currentStep.from as PodToPodComponentId,
      to: currentStep.to as PodToPodComponentId,
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

  const getComponentPosition = (id: PodToPodComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    let offsetX = 30;
    let offsetY = 30;
    if (comp.shape === 'rectangle') {
      offsetX = 42;
      offsetY = 20;
    } else if (comp.shape === 'cylinder') {
      offsetX = 48;
      offsetY = 36;
    } else if (comp.shape === 'pipe') {
      offsetX = 24;
      offsetY = 42;
    }
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
              <Network className="text-pink-400" size={24} />
              Pod-to-Pod Communication
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              CNI deep dive: How pods on different nodes communicate via overlay network
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-pink-500 to-green-500 rounded-full"
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
            
            {/* Zone: Pod A (Source) */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '20px', top: '50px', width: '100px', height: '180px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-blue-400 text-xs font-semibold">
                Pod A
              </span>
            </div>

            {/* Zone: Node 1 */}
            <div 
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '130px', top: '50px', width: '280px', height: '200px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-purple-400 text-xs font-semibold">
                Worker Node 1 (192.168.1.10)
              </span>
            </div>

            {/* Zone: Overlay Network */}
            <div 
              className="absolute rounded-xl border-2 border-pink-500/40 bg-pink-950/20"
              style={{ left: '420px', top: '50px', width: '90px', height: '200px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-pink-400 text-xs font-semibold">
                Overlay
              </span>
            </div>

            {/* Zone: Node 2 */}
            <div 
              className="absolute rounded-xl border-2 border-teal-500/40 bg-teal-950/20"
              style={{ left: '520px', top: '50px', width: '240px', height: '200px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-teal-400 text-xs font-semibold">
                Worker Node 2 (192.168.1.11)
              </span>
            </div>

            {/* Zone: Pod B (Destination) */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '770px', top: '50px', width: '100px', height: '180px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-green-400 text-xs font-semibold">
                Pod B
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
            {podToPodComponents.map(comp => {
              const isSourceOrDest = (comp.id === 'pod-a' || comp.id === 'pod-b') && activeComponents.has(comp.id);
              
              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isSourceOrDest ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ 
                    duration: isSourceOrDest ? 0.5 : 0.3,
                    scale: isSourceOrDest ? { repeat: 2, duration: 0.3 } : undefined
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
                    {comp.ipAddress && (
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {comp.ipAddress}
                      </span>
                    )}
                  </div>
                  
                  {/* Success indicator for final step */}
                  {isSourceOrDest && isComplete && (
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
                        currentStep.packetType === 'encapsulated' ? 'bg-pink-600' :
                        currentStep.packetType === 'tcp-syn' ? 'bg-blue-600' :
                        currentStep.packetType === 'tcp-ack' ? 'bg-green-600' :
                        'bg-purple-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.packetType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.packetType === 'encapsulated' ? 'bg-pink-500/20 text-pink-300' :
                          currentStep.packetType === 'tcp-syn' ? 'bg-blue-500/20 text-blue-300' :
                          currentStep.packetType === 'tcp-ack' ? 'bg-green-500/20 text-green-300' :
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
                              <span className="text-pink-400 mt-0.5">•</span>
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
                      Press <span className="text-pink-400 font-medium">Play</span> to start
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      12 steps: Pod A → veth → Bridge → VXLAN → Bridge → veth → Pod B
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
                          {comp.ipAddress && (
                            <div className="mt-2 text-xs font-mono">
                              <span className="text-slate-500">IP: </span>
                              <span className="text-cyan-400">{comp.ipAddress}</span>
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
                    <h3 className="text-base font-bold text-green-400 mb-1">Connection Established!</h3>
                    <p className="text-xs text-slate-300">
                      TCP handshake complete via VXLAN overlay
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
            <Layers size={14} />
            CNI Configuration
          </h3>
          
          {/* CNI Info */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <div className="text-xs space-y-1">
              <div><span className="text-slate-500">Plugin: </span><span className="text-pink-400">{cniInfo.plugin}</span></div>
              <div><span className="text-slate-500">Pod CIDR: </span><span className="text-cyan-400 font-mono">{cniInfo.podCIDR}</span></div>
            </div>
            <div className="mt-2 border-t border-slate-600 pt-2">
              <div className="text-xs text-slate-400 mb-1">Node CIDRs:</div>
              {cniInfo.nodeCIDRs.map((node, i) => (
                <div key={i} className="text-xs font-mono mb-1">
                  <span className="text-purple-400">{node.node}</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-cyan-400">{node.cidr}</span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <Network size={14} />
            VXLAN Overlay
          </h3>
          
          {/* VXLAN Info */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <div className="text-xs space-y-1">
              <div><span className="text-slate-500">VNI: </span><span className="text-pink-400 font-mono">{vxlanInfo.vni}</span></div>
              <div><span className="text-slate-500">UDP Port: </span><span className="text-amber-400 font-mono">{vxlanInfo.port}</span></div>
              <div><span className="text-slate-500">MTU: </span><span className="text-green-400 font-mono">{vxlanInfo.mtu}</span></div>
              <div><span className="text-slate-500">Overhead: </span><span className="text-slate-300">{vxlanInfo.encapOverhead}</span></div>
            </div>
          </div>

          {/* Toggle Network Namespaces */}
          <button
            onClick={() => setShowVxlan(!showVxlan)}
            className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-1.5 mb-2 transition-colors"
          >
            {showVxlan ? 'Hide' : 'Show'} Network Namespaces
          </button>

          {/* Network Namespaces Display */}
          <AnimatePresence>
            {showVxlan && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900 rounded-lg p-2 text-[10px] font-mono space-y-3">
                  <div>
                    <div className="text-blue-400 mb-1">Pod A Network Namespace:</div>
                    <div className="text-slate-400">Interfaces:</div>
                    {networkNamespaces.podA.interfaces.map((iface, i) => (
                      <div key={i} className="text-cyan-300 ml-2">{iface}</div>
                    ))}
                    <div className="text-slate-400 mt-1">Routes:</div>
                    {networkNamespaces.podA.routes.map((route, i) => (
                      <div key={i} className="text-green-300 ml-2">{route}</div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="text-green-400 mb-1">Pod B Network Namespace:</div>
                    <div className="text-slate-400">Interfaces:</div>
                    {networkNamespaces.podB.interfaces.map((iface, i) => (
                      <div key={i} className="text-cyan-300 ml-2">{iface}</div>
                    ))}
                    <div className="text-slate-400 mt-1">Routes:</div>
                    {networkNamespaces.podB.routes.map((route, i) => (
                      <div key={i} className="text-green-300 ml-2">{route}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packet Types Legend */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 mt-3">
            Packet Types
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-slate-400">TCP SYN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-400">TCP SYN-ACK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded" />
              <span className="text-slate-400">VXLAN Encapsulated</span>
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
              className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center justify-center transition-colors"
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
          <div className="w-2 h-2 bg-blue-500 rounded" />
          <span className="text-slate-400">Pod A</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded" />
          <span className="text-slate-400">Node 1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-pink-500 rounded" />
          <span className="text-slate-400">Overlay</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-teal-500 rounded" />
          <span className="text-slate-400">Node 2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded" />
          <span className="text-slate-400">Pod B</span>
        </div>
      </div>
    </div>
  );
}

export default PodToPodFlow;

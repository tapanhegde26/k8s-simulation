// Service Mesh mTLS Flow Animation - Main Component
// 2D animated visualization of mutual TLS in Istio/Linkerd service mesh

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
  Shield,
  Lock,
  FileCode
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { 
  mtlsComponents, 
  mtlsSteps, 
  getComponentById,
  clientCertInfo,
  serverCertInfo,
  mtlsModes,
  peerAuthYaml
} from './flowData';
import type { MTLSComponentId } from './types';

export function ServiceMeshMTLSFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<MTLSComponentId | null>(null);
  const [showYaml, setShowYaml] = useState(false);

  const steps = mtlsSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<MTLSComponentId>();
  const activeConnections: { 
    from: MTLSComponentId; 
    to: MTLSComponentId;
    trafficType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as MTLSComponentId);
    activeComponents.add(currentStep.to as MTLSComponentId);
    activeConnections.push({
      from: currentStep.from as MTLSComponentId,
      to: currentStep.to as MTLSComponentId,
      trafficType: currentStep.trafficType,
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

  const getComponentPosition = (id: MTLSComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    let offsetX = 25;
    let offsetY = 25;
    if (comp.shape === 'shield') {
      offsetX = 27;
      offsetY = 30;
    } else if (comp.shape === 'key') {
      offsetX = 36;
      offsetY = 21;
    } else if (comp.shape === 'lock') {
      offsetX = 24;
      offsetY = 30;
    } else if (comp.shape === 'octagon') {
      offsetX = 25;
      offsetY = 25;
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
              <Shield className="text-green-400" size={24} />
              Service Mesh mTLS Flow
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Mutual TLS with Istio/Linkerd - Zero-trust service-to-service encryption
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-green-500 to-teal-500 rounded-full"
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
          <div className="absolute inset-0 p-4" style={{ minWidth: '620px', minHeight: '260px' }}>
            
            {/* Zone: Client Pod */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '20px', top: '50px', width: '170px', height: '165px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-blue-400 text-xs font-semibold">
                Client Pod
              </span>
            </div>

            {/* Zone: Control Plane */}
            <div 
              className="absolute rounded-xl border-2 border-amber-500/40 bg-amber-950/20"
              style={{ left: '200px', top: '50px', width: '190px', height: '80px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-amber-400 text-xs font-semibold">
                Istio Control Plane
              </span>
            </div>

            {/* Zone: PKI */}
            <div 
              className="absolute rounded-xl border-2 border-red-500/40 bg-red-950/20"
              style={{ left: '200px', top: '135px', width: '190px', height: '80px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-red-400 text-xs font-semibold">
                PKI / Certificate Authority
              </span>
            </div>

            {/* Zone: Server Pod */}
            <div 
              className="absolute rounded-xl border-2 border-teal-500/40 bg-teal-950/20"
              style={{ left: '400px', top: '50px', width: '190px', height: '165px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-teal-400 text-xs font-semibold">
                Server Pod
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
                trafficType={conn.trafficType as any}
                packetLabel={conn.packetLabel}
              />
            ))}

            {/* Components */}
            {mtlsComponents.map(comp => {
              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: activeComponents.has(comp.id) ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col items-center">
                    <Shape
                      shape={comp.shape}
                      color={comp.color}
                      size={42}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[60px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* Current Step Display - bottom left */}
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
                        currentStep.trafficType === 'mtls' ? 'bg-green-600' :
                        currentStep.trafficType === 'handshake' ? 'bg-purple-600' :
                        currentStep.trafficType === 'cert-issue' ? 'bg-pink-600' :
                        currentStep.trafficType === 'cert-request' ? 'bg-amber-600' :
                        'bg-slate-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.trafficType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.trafficType === 'mtls' ? 'bg-green-500/20 text-green-300' :
                          currentStep.trafficType === 'handshake' ? 'bg-purple-500/20 text-purple-300' :
                          currentStep.trafficType === 'cert-issue' ? 'bg-pink-500/20 text-pink-300' :
                          currentStep.trafficType === 'cert-request' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {currentStep.trafficType.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{currentStep.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{currentStep.description}</p>
                    
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
                              <span className={`mt-0.5 ${
                                currentStep.trafficType === 'mtls' ? 'text-green-400' :
                                currentStep.trafficType === 'handshake' ? 'text-purple-400' :
                                'text-amber-400'
                              }`}>•</span>
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
                      Press <span className="text-green-400 font-medium">Play</span> to start
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      12 steps: Cert Issue → Handshake → mTLS Communication
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Component Info Popup - top left */}
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
                    <h3 className="text-base font-bold text-green-400 mb-1">mTLS Complete!</h3>
                    <p className="text-xs text-slate-300">
                      Zero-trust encryption established
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
            <Lock size={14} />
            Certificate Info
          </h3>
          
          {/* Client Cert */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-2">
            <div className="text-xs text-blue-400 font-semibold mb-1">Client Workload</div>
            <div className="text-[10px] font-mono space-y-0.5">
              <div><span className="text-slate-500">CN: </span><span className="text-cyan-400">{clientCertInfo.subject}</span></div>
              <div><span className="text-slate-500">Issuer: </span><span className="text-amber-400">{clientCertInfo.issuer}</span></div>
              <div><span className="text-slate-500">TTL: </span><span className="text-green-400">{clientCertInfo.validity}</span></div>
              <div className="text-purple-400 break-all text-[9px]">{clientCertInfo.spiffeId}</div>
            </div>
          </div>

          {/* Server Cert */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <div className="text-xs text-teal-400 font-semibold mb-1">Server Workload</div>
            <div className="text-[10px] font-mono space-y-0.5">
              <div><span className="text-slate-500">CN: </span><span className="text-cyan-400">{serverCertInfo.subject}</span></div>
              <div><span className="text-slate-500">Issuer: </span><span className="text-amber-400">{serverCertInfo.issuer}</span></div>
              <div><span className="text-slate-500">TTL: </span><span className="text-green-400">{serverCertInfo.validity}</span></div>
              <div className="text-purple-400 break-all text-[9px]">{serverCertInfo.spiffeId}</div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <Shield size={14} />
            mTLS Modes
          </h3>
          
          {/* mTLS Modes */}
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            {mtlsModes.map((mode, i) => (
              <div key={i} className="text-[10px] mb-1">
                <span className={`font-semibold ${
                  mode.name === 'STRICT' ? 'text-green-400' :
                  mode.name === 'PERMISSIVE' ? 'text-amber-400' :
                  'text-red-400'
                }`}>{mode.name}</span>
                <span className="text-slate-400"> - {mode.description}</span>
              </div>
            ))}
          </div>

          {/* Toggle YAML */}
          <button
            onClick={() => setShowYaml(!showYaml)}
            className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-1.5 mb-2 transition-colors flex items-center justify-center gap-1"
          >
            <FileCode size={12} />
            {showYaml ? 'Hide' : 'Show'} Policy YAML
          </button>

          <AnimatePresence>
            {showYaml && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <pre className="bg-slate-900 rounded-lg p-2 text-[8px] text-slate-300 font-mono overflow-x-auto">
                  {peerAuthYaml}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traffic Types Legend */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 mt-3">
            Traffic Types
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded" />
              <span className="text-slate-400">Plaintext (in-pod)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-slate-400">Cert Request</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded" />
              <span className="text-slate-400">Cert Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-slate-400">TLS Handshake</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-400">mTLS Encrypted</span>
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
              className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors"
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
          <span className="text-slate-400">Client Pod</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded" />
          <span className="text-slate-400">Control Plane</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded" />
          <span className="text-slate-400">PKI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-teal-500 rounded" />
          <span className="text-slate-400">Server Pod</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-purple-400 font-semibold">Istio</span>
          <span className="text-slate-500">/</span>
          <span className="text-cyan-400 font-semibold">Linkerd</span>
        </div>
      </div>
    </div>
  );
}

export default ServiceMeshMTLSFlow;

// Network Policy Enforcement Flow Animation - Main Component
// 2D animated visualization of how NetworkPolicies control pod-to-pod traffic

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
  ShieldCheck,
  ShieldX,
  FileCode
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { 
  networkPolicyComponents, 
  networkPolicySteps, 
  getComponentById,
  policyRules,
  networkPolicyYaml
} from './flowData';
import type { NetworkPolicyComponentId } from './types';

export function NetworkPolicyFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<NetworkPolicyComponentId | null>(null);
  const [showYaml, setShowYaml] = useState(false);

  const steps = networkPolicySteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<NetworkPolicyComponentId>();
  const activeConnections: { 
    from: NetworkPolicyComponentId; 
    to: NetworkPolicyComponentId;
    trafficType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as NetworkPolicyComponentId);
    activeComponents.add(currentStep.to as NetworkPolicyComponentId);
    activeConnections.push({
      from: currentStep.from as NetworkPolicyComponentId,
      to: currentStep.to as NetworkPolicyComponentId,
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

  const getComponentPosition = (id: NetworkPolicyComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    let offsetX = 30;
    let offsetY = 30;
    if (comp.shape === 'shield') {
      offsetX = 30;
      offsetY = 36;
    } else if (comp.shape === 'firewall') {
      offsetX = 36;
      offsetY = 24;
    } else if (comp.shape === 'octagon') {
      offsetX = 30;
      offsetY = 30;
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
              <ShieldCheck className="text-amber-400" size={24} />
              Network Policy Enforcement
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              How NetworkPolicies control pod-to-pod traffic using label selectors
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-green-500 to-red-500 rounded-full"
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
          <div className="absolute inset-0 p-4" style={{ minWidth: '620px', minHeight: '320px' }}>
            
            {/* Zone: Frontend Tier */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '20px', top: '50px', width: '90px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-blue-400 text-xs font-semibold">
                Frontend
              </span>
            </div>

            {/* Zone: Backend Tier */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '120px', top: '50px', width: '160px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-green-400 text-xs font-semibold">
                Backend
              </span>
            </div>

            {/* Zone: Database Tier */}
            <div 
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '290px', top: '50px', width: '160px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-purple-400 text-xs font-semibold">
                Database
              </span>
            </div>

            {/* Zone: Attacker */}
            <div 
              className="absolute rounded-xl border-2 border-red-500/40 bg-red-950/20"
              style={{ left: '460px', top: '50px', width: '90px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-red-400 text-xs font-semibold">
                Untrusted
              </span>
            </div>

            {/* Zone: Control Plane */}
            <div 
              className="absolute rounded-xl border-2 border-pink-500/40 bg-pink-950/20"
              style={{ left: '160px', top: '190px', width: '430px', height: '75px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-pink-400 text-xs font-semibold">
                Policy Enforcement Layer
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
            {networkPolicyComponents.map(comp => {
              const isDenied = currentStep?.trafficType === 'denied' && 
                (comp.id === currentStep.from || comp.id === currentStep.to);
              
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
                      size={50}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[80px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                    {comp.ipAddress && (
                      <span className="text-[9px] text-cyan-400 font-mono">
                        {comp.ipAddress}
                      </span>
                    )}
                  </div>
                  
                  {/* Denied indicator */}
                  {isDenied && comp.id === 'pod-attacker' && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/50">
                        <ShieldX size={12} />
                      </div>
                    </motion.div>
                  )}
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
                        currentStep.trafficType === 'denied' ? 'bg-red-600' :
                        currentStep.trafficType === 'allowed' ? 'bg-green-600' :
                        currentStep.trafficType === 'policy-sync' ? 'bg-purple-600' :
                        'bg-amber-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.trafficType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.trafficType === 'denied' ? 'bg-red-500/20 text-red-300' :
                          currentStep.trafficType === 'allowed' ? 'bg-green-500/20 text-green-300' :
                          currentStep.trafficType === 'policy-sync' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-amber-500/20 text-amber-300'
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
                                currentStep.trafficType === 'denied' ? 'text-red-400' :
                                currentStep.trafficType === 'allowed' ? 'text-green-400' :
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
                      Press <span className="text-amber-400 font-medium">Play</span> to start
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      12 steps: Policy sync → Allowed traffic → Denied traffic
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
                          {comp.labels && (
                            <div className="mt-2 text-xs font-mono">
                              <span className="text-slate-500">Labels: </span>
                              {Object.entries(comp.labels).map(([k, v]) => (
                                <span key={k} className="text-cyan-400 mr-2">{k}={v}</span>
                              ))}
                            </div>
                          )}
                          {comp.ipAddress && (
                            <div className="text-xs font-mono">
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
                    <h3 className="text-base font-bold text-green-400 mb-1">Zero Trust Enforced!</h3>
                    <p className="text-xs text-slate-300">
                      Legitimate traffic allowed, attacker blocked
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
            <ShieldCheck size={14} />
            Network Policies
          </h3>
          
          {/* Policy Rules */}
          {policyRules.map((policy, i) => (
            <div key={i} className="bg-slate-700/50 rounded-lg p-2 mb-2">
              <div className="text-xs text-amber-400 font-semibold mb-1">{policy.name}</div>
              <div className="text-[10px] font-mono space-y-1">
                <div>
                  <span className="text-slate-500">podSelector: </span>
                  <span className="text-cyan-400">{policy.podSelector}</span>
                </div>
                <div className="text-slate-500">ingress:</div>
                {policy.ingress.map((rule, j) => (
                  <div key={j} className="ml-2">
                    <span className="text-green-400">from: {rule.from}</span>
                    <br />
                    <span className="text-purple-400">ports: {rule.ports.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Toggle YAML */}
          <button
            onClick={() => setShowYaml(!showYaml)}
            className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-1.5 mb-2 transition-colors flex items-center justify-center gap-1"
          >
            <FileCode size={12} />
            {showYaml ? 'Hide' : 'Show'} YAML
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
                  {networkPolicyYaml}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traffic Legend */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 mt-3">
            Traffic Types
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-400">Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-slate-400">Denied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-slate-400">Policy Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-slate-400">Evaluation</span>
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
          <span className="text-slate-400">Frontend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded" />
          <span className="text-slate-400">Backend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded" />
          <span className="text-slate-400">Database</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded" />
          <span className="text-slate-400">Attacker</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded" />
          <span className="text-slate-400">NetworkPolicy</span>
        </div>
      </div>
    </div>
  );
}

export default NetworkPolicyFlow;

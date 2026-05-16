// RBAC Authorization Flow Animation - Main Component
// 2D animated visualization of how RBAC validates API requests

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
  KeyRound,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { 
  rbacComponents, 
  rbacSteps, 
  getComponentById,
  sampleRoles,
  rbacYaml
} from './flowData';
import type { RBACComponentId } from './types';

export function RBACAuthFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<RBACComponentId | null>(null);
  const [showYaml, setShowYaml] = useState(false);

  const steps = rbacSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<RBACComponentId>();
  const activeConnections: { 
    from: RBACComponentId; 
    to: RBACComponentId;
    requestType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as RBACComponentId);
    activeComponents.add(currentStep.to as RBACComponentId);
    activeConnections.push({
      from: currentStep.from as RBACComponentId,
      to: currentStep.to as RBACComponentId,
      requestType: currentStep.requestType,
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

  const getComponentPosition = (id: RBACComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    let offsetX = 30;
    let offsetY = 30;
    if (comp.shape === 'user') {
      offsetX = 30;
      offsetY = 36;
    } else if (comp.shape === 'key') {
      offsetX = 39;
      offsetY = 21;
    } else if (comp.shape === 'lock') {
      offsetX = 27;
      offsetY = 33;
    } else if (comp.shape === 'rectangle') {
      offsetX = 42;
      offsetY = 18;
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
              <KeyRound className="text-purple-400" size={24} />
              RBAC Authorization Flow
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              How Kubernetes validates API requests: Authentication → Authorization → Admission
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-green-500 rounded-full"
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
          <div className="absolute inset-0 p-4" style={{ minWidth: '600px', minHeight: '320px' }}>
            
            {/* Zone: Client */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '20px', top: '40px', width: '160px', height: '170px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-blue-400 text-xs font-semibold">
                Client
              </span>
            </div>

            {/* Zone: API Layer */}
            <div 
              className="absolute rounded-xl border-2 border-amber-500/40 bg-amber-950/20"
              style={{ left: '190px', top: '40px', width: '280px', height: '170px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-amber-400 text-xs font-semibold">
                API Server Layer
              </span>
            </div>

            {/* Zone: Storage */}
            <div 
              className="absolute rounded-xl border-2 border-slate-500/40 bg-slate-800/20"
              style={{ left: '480px', top: '70px', width: '90px', height: '110px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-slate-400 text-xs font-semibold">
                Storage
              </span>
            </div>

            {/* Zone: RBAC Layer */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '190px', top: '215px', width: '360px', height: '80px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-green-400 text-xs font-semibold">
                RBAC Objects
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
                requestType={conn.requestType as any}
                packetLabel={conn.packetLabel}
              />
            ))}

            {/* Components */}
            {rbacComponents.map(comp => {
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
                        currentStep.requestType === 'denied' ? 'bg-red-600' :
                        currentStep.requestType === 'allowed' ? 'bg-green-600' :
                        currentStep.requestType === 'auth' ? 'bg-purple-600' :
                        'bg-amber-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.requestType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.requestType === 'denied' ? 'bg-red-500/20 text-red-300' :
                          currentStep.requestType === 'allowed' ? 'bg-green-500/20 text-green-300' :
                          currentStep.requestType === 'auth' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {currentStep.requestType.toUpperCase()}
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
                                currentStep.requestType === 'denied' ? 'text-red-400' :
                                currentStep.requestType === 'allowed' ? 'text-green-400' :
                                'text-purple-400'
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
                      Press <span className="text-purple-400 font-medium">Play</span> to start
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      12 steps: User → API Server → Auth → RBAC → Admission → etcd
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
                    <h3 className="text-base font-bold text-green-400 mb-1">Request Authorized!</h3>
                    <p className="text-xs text-slate-300">
                      kubectl get pods completed successfully
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
            RBAC Roles
          </h3>
          
          {/* Sample Roles */}
          {sampleRoles.map((role, i) => (
            <div key={i} className="bg-slate-700/50 rounded-lg p-2 mb-2">
              <div className="text-xs text-green-400 font-semibold mb-1">{role.name}</div>
              <div className="text-[10px] text-slate-500 mb-1">ns: {role.namespace}</div>
              {role.rules.map((rule, j) => (
                <div key={j} className="text-[10px] font-mono space-y-0.5">
                  <div>
                    <span className="text-slate-500">resources: </span>
                    <span className="text-cyan-400">{rule.resources.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">verbs: </span>
                    <span className="text-purple-400">{rule.verbs.join(', ')}</span>
                  </div>
                </div>
              ))}
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
                  {rbacYaml}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Request Flow Legend */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2 mt-3">
            Request Types
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-slate-400">Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-slate-400">Lookup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-400">Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-slate-400">Denied</span>
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
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-colors"
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
          <span className="text-slate-400">Client</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded" />
          <span className="text-slate-400">API Server</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-pink-500 rounded" />
          <span className="text-slate-400">Authenticator</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-teal-500 rounded" />
          <span className="text-slate-400">Authorizer</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded" />
          <span className="text-slate-400">RBAC Objects</span>
        </div>
      </div>
    </div>
  );
}

export default RBACAuthFlow;

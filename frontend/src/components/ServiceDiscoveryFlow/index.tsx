// Service Discovery Flow Animation - Main Component
// 2D animated visualization of Kubernetes service discovery and DNS resolution

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
  Database,
  Network
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { DNSQueryBubble, IPTablesRuleDisplay } from './PacketAnimation';
import { 
  serviceDiscoveryComponents, 
  serviceDiscoverySteps, 
  getComponentById,
  dnsExplanation,
  iptablesRules 
} from './flowData';
import type { ServiceDiscoveryComponentId } from './types';

export function ServiceDiscoveryFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<ServiceDiscoveryComponentId | null>(null);
  const [showDNSInfo, setShowDNSInfo] = useState(false);
  const [showIPTablesInfo, setShowIPTablesInfo] = useState(false);

  const steps = serviceDiscoverySteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<ServiceDiscoveryComponentId>();
  const activeConnections: { 
    from: ServiceDiscoveryComponentId; 
    to: ServiceDiscoveryComponentId;
    packetType?: string;
    packetLabel?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from as ServiceDiscoveryComponentId);
    activeComponents.add(currentStep.to as ServiceDiscoveryComponentId);
    activeConnections.push({
      from: currentStep.from as ServiceDiscoveryComponentId,
      to: currentStep.to as ServiceDiscoveryComponentId,
      packetType: currentStep.packetType,
      packetLabel: currentStep.packetLabel,
    });
  }

  // Show DNS info during DNS steps
  useEffect(() => {
    if (currentStep?.packetType === 'dns-query' || currentStep?.packetType === 'dns-response') {
      setShowDNSInfo(true);
    } else {
      setShowDNSInfo(false);
    }
    
    if (currentStep?.to === 'iptables' || currentStep?.from === 'iptables') {
      setShowIPTablesInfo(true);
    } else {
      setShowIPTablesInfo(false);
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
    setShowDNSInfo(false);
    setShowIPTablesInfo(false);
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

  const getComponentPosition = (id: ServiceDiscoveryComponentId) => {
    const comp = getComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    const offsetX = comp.shape === 'rectangle' ? 42 : 30;
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
              <Network className="text-purple-400" size={24} />
              Service Discovery & DNS Flow
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              How pods discover and connect to services using CoreDNS and kube-proxy
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full"
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
          <div className="absolute inset-0 p-4" style={{ minWidth: '900px', minHeight: '480px' }}>
            
            {/* Zone: Application */}
            <div 
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '20px', top: '160px', width: '130px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-blue-400 text-xs font-semibold">
                Application
              </span>
            </div>

            {/* Zone: DNS Layer */}
            <div 
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '170px', top: '20px', width: '140px', height: '120px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-purple-400 text-xs font-semibold">
                DNS Layer
              </span>
            </div>

            {/* Zone: Control Plane */}
            <div 
              className="absolute rounded-xl border-2 border-cyan-500/40 bg-cyan-950/20"
              style={{ left: '360px', top: '20px', width: '260px', height: '180px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-cyan-400 text-xs font-semibold">
                Control Plane
              </span>
            </div>

            {/* Zone: Networking */}
            <div 
              className="absolute rounded-xl border-2 border-orange-500/40 bg-orange-950/20"
              style={{ left: '170px', top: '160px', width: '300px', height: '250px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-orange-400 text-xs font-semibold">
                Networking Layer
              </span>
            </div>

            {/* Zone: Workloads */}
            <div 
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '520px', top: '270px', width: '300px', height: '140px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-green-400 text-xs font-semibold">
                Backend Pods
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
            {serviceDiscoveryComponents.map(comp => {
              const isBackendPod = ['pod-1', 'pod-2', 'pod-3'].includes(comp.id);
              const isPodActive = activeComponents.has(comp.id) && isBackendPod;
              
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
                      size={55}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={selectedComponent === comp.id}
                      onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    />
                    <span className={`mt-1 text-xs font-medium text-center max-w-[80px] leading-tight ${
                      activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                    }`}>
                      {comp.name}
                    </span>
                    {/* IP Address label */}
                    {comp.ipAddress && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {comp.ipAddress}
                      </span>
                    )}
                  </div>
                  
                  {/* Success indicator for final step */}
                  {isPodActive && isComplete && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/50">
                        <CheckCircle size={14} />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* DNS Query Bubble */}
            <DNSQueryBubble
              isVisible={showDNSInfo && currentStep?.packetType === 'dns-query'}
              type="query"
              query="my-service.default.svc.cluster.local"
              position={{ x: 140, y: 120 }}
            />
            <DNSQueryBubble
              isVisible={showDNSInfo && currentStep?.packetType === 'dns-response'}
              type="response"
              response="10.96.100.50"
              position={{ x: 140, y: 120 }}
            />

            {/* iptables Rule Display */}
            <IPTablesRuleDisplay
              isVisible={showIPTablesInfo && currentStepIndex === 8}
              chain={iptablesRules[0].chain}
              rule={iptablesRules[0].rule}
              description={iptablesRules[0].description}
              position={{ x: 420, y: 400 }}
            />

            {/* Current Step Display */}
            <div className="absolute top-4 right-4 w-80">
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
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        currentStep.packetType === 'dns-query' ? 'bg-purple-600' :
                        currentStep.packetType === 'dns-response' ? 'bg-green-600' :
                        currentStep.packetType === 'http-request' ? 'bg-blue-600' :
                        currentStep.packetType === 'http-response' ? 'bg-emerald-600' :
                        'bg-orange-600'
                      }`}>
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        of {steps.length}
                      </span>
                      {currentStep.packetType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          currentStep.packetType === 'dns-query' ? 'bg-purple-500/20 text-purple-300' :
                          currentStep.packetType === 'dns-response' ? 'bg-green-500/20 text-green-300' :
                          currentStep.packetType === 'http-request' ? 'bg-blue-500/20 text-blue-300' :
                          currentStep.packetType === 'http-response' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {currentStep.packetType.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-medium text-sm mb-2">{currentStep.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{currentStep.description}</p>
                    
                    {/* Step Details */}
                    {currentStep.details && currentStep.details.length > 0 && (
                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="text-xs text-slate-500 mb-1">Technical Details:</div>
                        <ul className="space-y-1">
                          {currentStep.details.map((detail, i) => (
                            <motion.li 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="text-xs text-slate-300 flex items-start gap-1"
                            >
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span className="font-mono text-[11px]">{detail}</span>
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
                      Press <span className="text-purple-400 font-medium">Play</span> to start the service discovery flow
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      12 steps showing how pods discover and connect to services
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Component Info Popup */}
            <AnimatePresence>
              {selectedComponent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 w-72"
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
                          {comp.ipAddress && (
                            <div className="mt-2 text-xs">
                              <span className="text-slate-500">IP: </span>
                              <span className="text-cyan-400 font-mono">{comp.ipAddress}</span>
                              {comp.port && <span className="text-slate-500">:{comp.port}</span>}
                            </div>
                          )}
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

            {/* Completion Message */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-6 text-center shadow-2xl">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-green-400 mb-1">Service Discovery Complete!</h3>
                    <p className="text-sm text-slate-300">
                      Request successfully routed to backend pod
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DNS Info Sidebar */}
        <div className="w-64 border-l border-slate-700 bg-slate-800/30 p-4 overflow-auto">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Globe size={14} />
            DNS Resolution
          </h3>
          
          {/* FQDN Breakdown */}
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-slate-400 mb-2">Fully Qualified Domain Name:</div>
            <div className="font-mono text-xs text-purple-300 break-all">
              {dnsExplanation.fqdn}
            </div>
            <div className="mt-2 space-y-1">
              {dnsExplanation.parts.map((part, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-cyan-400 font-mono">{part.part}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">{part.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Short Names */}
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-slate-400 mb-2">Short Names (also work):</div>
            {dnsExplanation.shortNames.map((name, i) => (
              <div key={i} className="text-xs font-mono text-green-300 mb-1">
                {name}
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 mt-6 flex items-center gap-2">
            <Database size={14} />
            iptables Rules
          </h3>
          
          {/* iptables Rules */}
          <div className="space-y-2">
            {iptablesRules.map((rule, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-xs text-red-400 font-semibold">{rule.chain}</div>
                <div className="text-[10px] font-mono text-slate-300 mt-1 break-all">
                  {rule.rule}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 italic">
                  {rule.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-colors"
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
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
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
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-slate-400">Application</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded" />
          <span className="text-slate-400">DNS (CoreDNS)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded" />
          <span className="text-slate-400">Control Plane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-slate-400">Networking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-slate-400">Backend Pods</span>
        </div>
      </div>
    </div>
  );
}

export default ServiceDiscoveryFlow;

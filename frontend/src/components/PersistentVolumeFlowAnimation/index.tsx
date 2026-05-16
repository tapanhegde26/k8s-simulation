// Persistent Volume / PVC Flow Animation - Main Component

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
  HardDrive,
} from 'lucide-react';
import { Shape } from './Shapes';
import { ConnectionLine } from './ConnectionLine';
import { pvFlowComponents, pvFlowSteps, getPvComponentById } from './flowData';
import type { PvFlowComponentId } from './types';

export function PersistentVolumeFlowAnimation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<PvFlowComponentId | null>(null);
  const [flowComplete, setFlowComplete] = useState(false);
  const [pvcBound, setPvcBound] = useState(false);
  const [volumeMounted, setVolumeMounted] = useState(false);

  const steps = pvFlowSteps;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const activeComponents = new Set<PvFlowComponentId>();
  const activeConnections: {
    from: PvFlowComponentId;
    to: PvFlowComponentId;
    dashed?: boolean;
    label?: string;
  }[] = [];

  if (currentStep) {
    activeComponents.add(currentStep.from);
    activeComponents.add(currentStep.to);
    activeConnections.push({
      from: currentStep.from,
      to: currentStep.to,
      dashed: currentStep.id === 'step7',
      label: currentStep.id === 'step7' ? 'claimRef' : undefined,
    });
  }

  useEffect(() => {
    if (currentStep?.id === 'step7') {
      setPvcBound(true);
    }
    if (currentStep?.id === 'step14') {
      setVolumeMounted(true);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStepIndex >= steps.length - 1 && currentStepIndex >= 0) {
      setFlowComplete(true);
    }
  }, [currentStepIndex, steps.length]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
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
    setFlowComplete(false);
    setPvcBound(false);
    setVolumeMounted(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setFlowComplete(false);
      setPvcBound(false);
      setVolumeMounted(false);
    } else if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setFlowComplete(false);
      setPvcBound(false);
      setVolumeMounted(false);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStepIndex, steps.length]);

  const goToStep = useCallback(
    (index: number) => {
      setCurrentStepIndex(index);
      setIsPlaying(false);
      setPvcBound(index >= steps.findIndex((s) => s.id === 'step7'));
      setVolumeMounted(index >= steps.length - 1);
      setFlowComplete(index >= steps.length - 1);
    },
    [steps]
  );

  useEffect(() => {
    if (!isPlaying || currentStepIndex >= steps.length - 1) return;

    const step = steps[currentStepIndex];
    const timeout = setTimeout(() => {
      nextStep();
    }, step?.duration ? step.duration / speed : 1500 / speed);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStepIndex, steps, speed, nextStep]);

  const getComponentPosition = (id: PvFlowComponentId) => {
    const comp = getPvComponentById(id);
    if (!comp) return { x: 0, y: 0 };
    const offsetX = comp.shape === 'rectangle' ? 42 : 30;
    const offsetY = comp.shape === 'rectangle' ? 20 : 30;
    return { x: comp.position.x + offsetX, y: comp.position.y + offsetY };
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const getStatusLabel = (id: PvFlowComponentId) => {
    if (id === 'pv') {
      if (pvcBound) return 'Bound';
      if (currentStepIndex >= steps.findIndex((s) => s.id === 'step4')) return 'Available';
      return null;
    }
    if (id === 'pvc') {
      if (pvcBound) return 'Bound';
      if (currentStepIndex >= 1) return 'Pending';
      return null;
    }
    return null;
  };

  return (
    <motion.div
      className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <motion.div
          className="flex items-center justify-between flex-wrap gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-teal-400" />
              <h2 className="text-xl font-bold text-white">PV / PVC Flow Animation</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Provision storage, bind claims, and mount volumes into running pods
            </p>
          </motion.div>

          <motion.div className="flex gap-2 items-center">
            <motion.div
              className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              <span className="text-xs text-slate-400 w-14">
                {currentStepIndex >= 0 ? `${currentStepIndex + 1}/${steps.length}` : `0/${steps.length}`}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-auto">
          <div className="absolute inset-0 p-4" style={{ minWidth: '1050px', minHeight: '550px' }}>
            <div
              className="absolute rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30"
              style={{ left: '20px', top: '150px', width: '180px', height: '130px' }}
            >
              <span className="absolute -top-3 left-3 px-2 bg-slate-900 text-slate-500 text-xs font-medium">
                Client
              </span>
            </div>

            <div
              className="absolute rounded-xl border-2 border-blue-500/40 bg-blue-950/20"
              style={{ left: '220px', top: '40px', width: '380px', height: '200px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-blue-400 text-sm font-semibold">
                API Layer
              </span>
            </div>

            <motion.div
              className="absolute rounded-xl border-2 border-purple-500/40 bg-purple-950/20"
              style={{ left: '280px', top: '300px', width: '280px', height: '120px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-purple-400 text-sm font-semibold">
                Control Plane
              </span>
            </motion.div>

            <motion.div
              className="absolute rounded-xl border-2 border-teal-500/40 bg-teal-950/20"
              style={{ left: '220px', top: '380px', width: '320px', height: '120px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-teal-400 text-sm font-semibold">
                Storage (PV / PVC)
              </span>
            </motion.div>

            <div
              className="absolute rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-950/10"
              style={{ left: '20px', top: '360px', width: '140px', height: '100px' }}
            >
              <span className="absolute -top-3 left-2 px-2 bg-slate-900 text-orange-400 text-xs font-medium">
                External Storage
              </span>
            </div>

            <div
              className="absolute rounded-xl border-2 border-green-500/40 bg-green-950/20"
              style={{ left: '560px', top: '40px', width: '420px', height: '400px' }}
            >
              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-green-400 text-sm font-semibold">
                Worker Node
              </span>
            </div>

            {activeConnections.map((conn, i) => (
              <ConnectionLine
                key={`${conn.from}-${conn.to}-${i}`}
                from={getComponentPosition(conn.from)}
                to={getComponentPosition(conn.to)}
                isActive={true}
                color={getPvComponentById(conn.from)?.color || '#60a5fa'}
                dashed={conn.dashed}
                label={conn.label}
              />
            ))}

            {pvFlowComponents.map((comp, index) => {
              const isPvOrPvcBound =
                (comp.id === 'pv' || comp.id === 'pvc') && pvcBound;
              const isContainerMounted = comp.id === 'container' && volumeMounted;
              const statusLabel = getStatusLabel(comp.id);

              return (
                <motion.div
                  key={comp.id}
                  className="absolute"
                  style={{ left: comp.position.x, top: comp.position.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isPvOrPvcBound || isContainerMounted ? [1, 1.25, 1] : 1,
                  }}
                  transition={{
                    duration: isPvOrPvcBound || isContainerMounted ? 0.5 : 0.3,
                    delay: index * 0.03,
                    scale:
                      isPvOrPvcBound || isContainerMounted
                        ? { repeat: 1, duration: 0.35 }
                        : undefined,
                  }}
                >
                  <motion.div
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Shape
                      shape={comp.shape}
                      color={comp.color}
                      size={55}
                      isActive={activeComponents.has(comp.id)}
                      isHighlighted={
                        selectedComponent === comp.id ||
                        isPvOrPvcBound ||
                        isContainerMounted
                      }
                      onClick={() =>
                        setSelectedComponent(selectedComponent === comp.id ? null : comp.id)
                      }
                    />
                    <span
                      className={`mt-1 text-xs font-medium text-center max-w-[90px] leading-tight ${
                        activeComponents.has(comp.id) ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {comp.name}
                    </span>
                    {statusLabel && (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${
                          statusLabel === 'Bound'
                            ? 'bg-green-500/30 text-green-300'
                            : statusLabel === 'Pending'
                              ? 'bg-amber-500/30 text-amber-300'
                              : 'bg-slate-600/50 text-slate-300'
                        }`}
                      >
                        {statusLabel}
                      </motion.span>
                    )}
                  </motion.div>

                  {isPvOrPvcBound && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/50"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: 2, duration: 0.4 }}
                      >
                        <CheckCircle size={16} />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            <AnimatePresence>
              {currentStep?.id === 'step4' && (
                <motion.div
                  className="absolute pointer-events-none z-20"
                  initial={{
                    left: getComponentPosition('storage-backend').x - 16,
                    top: getComponentPosition('storage-backend').y - 16,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    left: getComponentPosition('pv').x - 16,
                    top: getComponentPosition('pv').y - 16,
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                >
                  <div className="w-8 h-8 bg-amber-500 rounded-md shadow-lg shadow-amber-500/50 flex items-center justify-center">
                    <HardDrive size={16} className="text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {currentStep?.id === 'step14' && (
                <motion.div
                  className="absolute pointer-events-none z-20"
                  initial={{
                    left: getComponentPosition('volume-manager').x - 16,
                    top: getComponentPosition('volume-manager').y - 16,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    left: getComponentPosition('container').x - 16,
                    top: getComponentPosition('container').y - 16,
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                  <motion.div
                    className="px-2 py-1 bg-blue-500 rounded text-white text-xs font-bold shadow-lg shadow-blue-500/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: 2, duration: 0.5 }}
                  >
                    /data
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    <motion.div
                      className="flex items-center gap-2 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 }}
                    >
                      <span className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                        {currentStepIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">of {steps.length}</span>
                    </motion.div>
                    <motion.div className="text-white font-medium text-sm mb-2">{currentStep.label}</motion.div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {currentStep.description}
                    </p>
                    {currentStep.details && currentStep.details.length > 0 && (
                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <motion.div
                          className="text-xs text-slate-500 mb-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Details:
                        </motion.div>
                        <ul className="space-y-1">
                          {currentStep.details.map((detail, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="text-xs text-slate-300 flex items-start gap-1"
                            >
                              <span className="text-teal-400 mt-0.5">•</span>
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
                    <motion.div
                      className="text-slate-400 text-sm"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      Press <span className="text-teal-400 font-medium">Play</span> to start the PV /
                      PVC flow
                    </motion.div>
                    <motion.div
                      className="text-xs text-slate-500 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {steps.length} steps from provision and binding to volume mount
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {selectedComponent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 w-64"
                >
                  <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600 shadow-xl">
                    <motion.div
                      className="flex items-center justify-between mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Info size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase">
                          Component Info
                        </span>
                      </motion.div>
                      <button
                        onClick={() => setSelectedComponent(null)}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </motion.div>
                    {(() => {
                      const comp = getPvComponentById(selectedComponent);
                      if (!comp) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <motion.div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: comp.color }}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.4 }}
                            />
                            <span className="text-white font-medium text-sm">{comp.name}</span>
                          </div>
                          <p className="text-xs text-slate-300">{comp.description}</p>
                          <div className="mt-2 text-xs text-slate-500">
                            Zone:{' '}
                            <span className="text-slate-400 capitalize">
                              {comp.zone.replace('-', ' ')}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {flowComplete && currentStepIndex >= steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <motion.div
                    className="bg-teal-500/20 backdrop-blur-sm border border-teal-500/50 rounded-xl p-6 text-center shadow-2xl"
                    animate={{ boxShadow: ['0 0 20px rgba(20,184,166,0.2)', '0 0 40px rgba(20,184,166,0.35)', '0 0 20px rgba(20,184,166,0.2)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-teal-400 mb-1">Volume Mounted!</h3>
                    <p className="text-sm text-slate-300">All {steps.length} steps completed</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center transition-colors"
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

          <motion.div
            className="flex items-center gap-4 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-sm text-slate-400">Jump to:</span>
              <select
                value={currentStepIndex}
                onChange={(e) => goToStep(Number(e.target.value))}
                className="bg-slate-700 text-white text-sm rounded px-3 py-1.5 border-none max-w-[220px]"
              >
                <option value={-1}>Select step...</option>
                {steps.map((step, index) => (
                  <option key={step.id} value={index}>
                    {index + 1}. {step.label.replace(/^\d+\.\s*/, '')}
                  </option>
                ))}
              </select>
            </motion.div>
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
          </motion.div>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 bg-teal-500 rounded"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-slate-400">PV / PVC</span>
        </div>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-slate-400">External Storage</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <motion.div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-slate-400">Worker Node</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PersistentVolumeFlowAnimation;

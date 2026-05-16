import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useK8sStore } from '../store/k8sStore';
import {
  Terminal,
  Shield,
  CheckCircle,
  Database,
  Eye,
  Filter,
  Star,
  Link,
  Radio,
  Box,
  Download,
  PlusCircle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { PodCreationStep } from '../types/kubernetes';

const STEP_INFO: Record<PodCreationStep, { icon: JSX.Element; title: string; description: string; component: string }> = {
  'kubectl-request': {
    icon: <Terminal className="w-5 h-5" />,
    title: 'kubectl Request',
    description: 'User sends kubectl create pod command to the API server',
    component: 'Client',
  },
  'api-server-auth': {
    icon: <Shield className="w-5 h-5" />,
    title: 'Authentication & Authorization',
    description: 'API Server validates credentials and checks RBAC permissions',
    component: 'API Server',
  },
  'api-server-validation': {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Admission Control',
    description: 'Validates pod spec against admission controllers and mutating webhooks',
    component: 'API Server',
  },
  'etcd-persist': {
    icon: <Database className="w-5 h-5" />,
    title: 'Persist to etcd',
    description: 'Pod object is stored in etcd with status "Pending"',
    component: 'etcd',
  },
  'scheduler-watch': {
    icon: <Eye className="w-5 h-5" />,
    title: 'Scheduler Watch',
    description: 'Scheduler detects new pod without nodeName via watch API',
    component: 'Scheduler',
  },
  'scheduler-filter': {
    icon: <Filter className="w-5 h-5" />,
    title: 'Node Filtering',
    description: 'Filters nodes based on taints, tolerations, node selectors, and resource requirements',
    component: 'Scheduler',
  },
  'scheduler-score': {
    icon: <Star className="w-5 h-5" />,
    title: 'Node Scoring',
    description: 'Scores feasible nodes based on priorities (resource balance, affinity, etc.)',
    component: 'Scheduler',
  },
  'scheduler-bind': {
    icon: <Link className="w-5 h-5" />,
    title: 'Bind to Node',
    description: 'Creates binding object to assign pod to the highest-scored node',
    component: 'Scheduler',
  },
  'kubelet-watch': {
    icon: <Radio className="w-5 h-5" />,
    title: 'Kubelet Watch',
    description: 'Kubelet on target node detects new pod assignment',
    component: 'Kubelet',
  },
  'kubelet-cri': {
    icon: <Box className="w-5 h-5" />,
    title: 'CRI Invocation',
    description: 'Kubelet calls Container Runtime Interface to create pod sandbox',
    component: 'Kubelet',
  },
  'container-pull': {
    icon: <Download className="w-5 h-5" />,
    title: 'Image Pull',
    description: 'Container runtime pulls the container image from registry',
    component: 'Container Runtime',
  },
  'container-create': {
    icon: <PlusCircle className="w-5 h-5" />,
    title: 'Container Create',
    description: 'Container is created with specified configuration',
    component: 'Container Runtime',
  },
  'container-start': {
    icon: <Play className="w-5 h-5" />,
    title: 'Container Start',
    description: 'Container process is started, probes begin',
    component: 'Container Runtime',
  },
  'pod-running': {
    icon: <Zap className="w-5 h-5" />,
    title: 'Pod Running',
    description: 'Pod is now in Running state and ready to serve traffic',
    component: 'Pod',
  },
};

const STEPS_ORDER: PodCreationStep[] = [
  'kubectl-request',
  'api-server-auth',
  'api-server-validation',
  'etcd-persist',
  'scheduler-watch',
  'scheduler-filter',
  'scheduler-score',
  'scheduler-bind',
  'kubelet-watch',
  'kubelet-cri',
  'container-pull',
  'container-create',
  'container-start',
  'pod-running',
];

export function PodCreationFlow() {
  const {
    podCreationFlow,
    startPodCreationFlow,
    advancePodCreationStep,
    resetPodCreationFlow,
    setPodCreationSpeed,
  } = useK8sStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { currentStep, completedSteps, isRunning, speed, pod, selectedNode, events } = podCreationFlow;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        advancePodCreationStep();
      }, 2000 / speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed, advancePodCreationStep]);

  const handleStart = () => {
    startPodCreationFlow({
      name: 'nginx-demo',
      namespace: 'default',
      containers: [{
        name: 'nginx',
        image: 'nginx:latest',
        resources: {
          requests: { cpu: 100, memory: 128 },
          limits: { cpu: 200, memory: 256 },
        },
        ports: [80],
      }],
    });
  };

  const progress = ((completedSteps.length) / STEPS_ORDER.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pod Creation Flow</h2>
          <p className="text-slate-400 mt-1">
            Watch how a pod gets created from kubectl to running state
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Speed Control */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <span className="text-sm text-slate-400">Speed:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setPodCreationSpeed(Number(e.target.value))}
              className="w-20 accent-k8s-blue"
            />
            <span className="text-sm font-medium w-6">{speed}x</span>
          </div>
          
          {!isRunning && completedSteps.length === 0 && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Play size={18} />
              Start Simulation
            </button>
          )}
          
          {(isRunning || completedSteps.length > 0) && (
            <button
              onClick={resetPodCreationFlow}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-k8s-blue to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Flow Visualization */}
      <div className="glass rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Steps Timeline */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {STEPS_ORDER.map((step, index) => {
              const info = STEP_INFO[step];
              const isCompleted = completedSteps.includes(step);
              const isCurrent = currentStep === step && isRunning;
              const isPending = !isCompleted && !isCurrent;

              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-lg border transition-all
                    ${isCurrent ? 'bg-k8s-blue/20 border-k8s-blue step-active' : ''}
                    ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}
                    ${isPending ? 'bg-slate-800/50 border-slate-700 opacity-50' : ''}
                  `}
                >
                  {/* Step Number */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCurrent ? 'bg-k8s-blue text-white' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isPending ? 'bg-slate-700 text-slate-400' : ''}
                  `}>
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        ${isCurrent ? 'text-k8s-blue' : ''}
                        ${isCompleted ? 'text-green-400' : ''}
                        ${isPending ? 'text-slate-500' : ''}
                      `}>
                        {info.icon}
                      </span>
                      <h4 className="font-medium">{info.title}</h4>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                        {info.component}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{info.description}</p>
                  </div>

                  {/* Connection Line */}
                  {index < STEPS_ORDER.length - 1 && (
                    <div className={`
                      absolute left-7 top-14 w-0.5 h-6
                      ${isCompleted ? 'bg-green-500' : 'bg-slate-700'}
                    `} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Right Panel - Current Step Details & Events */}
          <div className="space-y-4">
            {/* Current Step Detail */}
            <AnimatePresence mode="wait">
              {isRunning && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 rounded-lg p-6 border border-k8s-blue/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-k8s-blue/20 rounded-lg text-k8s-blue">
                      {STEP_INFO[currentStep].icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{STEP_INFO[currentStep].title}</h3>
                      <span className="text-sm text-slate-400">{STEP_INFO[currentStep].component}</span>
                    </div>
                  </div>
                  <p className="text-slate-300 mb-4">{STEP_INFO[currentStep].description}</p>
                  
                  {/* Animated indicator */}
                  <div className="flex items-center gap-2 text-k8s-blue">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap size={16} />
                    </motion.div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pod Info */}
            {pod && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Box size={18} className="text-green-400" />
                  Pod Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-mono">{pod.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Namespace:</span>
                    <span className="font-mono">{pod.namespace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Image:</span>
                    <span className="font-mono">{pod.containers[0]?.image}</span>
                  </div>
                  {selectedNode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Node:</span>
                      <span className="font-mono text-green-400">{selectedNode.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-3">Events</h4>
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No events yet. Start the simulation to see events.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-k8s-blue pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          {event.reason}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{event.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completion Message */}
            {!isRunning && completedSteps.length === STEPS_ORDER.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center"
              >
                <Zap className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Pod Created Successfully!</h3>
                <p className="text-slate-300">
                  The pod is now running on {selectedNode?.name || 'the cluster'}.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

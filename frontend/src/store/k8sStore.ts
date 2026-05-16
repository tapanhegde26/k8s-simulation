import { create } from 'zustand';
import {
  ClusterState,
  Pod,
  Deployment,
  Service,
  Ingress,
  ConfigMap,
  Secret,
  HPA,
  Node,
  K8sEvent,
  PodCreationFlowState,
  PodCreationStep,
  Container,
} from '../types/kubernetes';

const generateId = () => Math.random().toString(36).substring(2, 11);

const POD_CREATION_STEPS: PodCreationStep[] = [
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

const initialControlPlane = [
  { name: 'kube-apiserver', status: 'Running' as const, description: 'Kubernetes API Server - Frontend for the control plane' },
  { name: 'etcd', status: 'Running' as const, description: 'Consistent and highly-available key-value store' },
  { name: 'kube-scheduler', status: 'Running' as const, description: 'Watches for newly created Pods and assigns them to nodes' },
  { name: 'kube-controller-manager', status: 'Running' as const, description: 'Runs controller processes (Node, Replication, Endpoints, etc.)' },
  { name: 'cloud-controller-manager', status: 'Running' as const, description: 'Embeds cloud-specific control logic' },
];

const createInitialNodes = (): Node[] => [
  {
    id: 'master-1',
    name: 'master-node-1',
    role: 'master',
    status: 'Ready',
    capacity: { cpu: 4000, memory: 8192 },
    allocatable: { cpu: 3500, memory: 7168 },
    allocated: { cpu: 500, memory: 512 },
    pods: [],
    conditions: [
      { type: 'Ready', status: true },
      { type: 'MemoryPressure', status: false },
      { type: 'DiskPressure', status: false },
      { type: 'PIDPressure', status: false },
    ],
  },
  {
    id: 'worker-1',
    name: 'worker-node-1',
    role: 'worker',
    status: 'Ready',
    capacity: { cpu: 4000, memory: 8192 },
    allocatable: { cpu: 3800, memory: 7680 },
    allocated: { cpu: 0, memory: 0 },
    pods: [],
    conditions: [
      { type: 'Ready', status: true },
      { type: 'MemoryPressure', status: false },
      { type: 'DiskPressure', status: false },
      { type: 'PIDPressure', status: false },
    ],
  },
  {
    id: 'worker-2',
    name: 'worker-node-2',
    role: 'worker',
    status: 'Ready',
    capacity: { cpu: 4000, memory: 8192 },
    allocatable: { cpu: 3800, memory: 7680 },
    allocated: { cpu: 0, memory: 0 },
    pods: [],
    conditions: [
      { type: 'Ready', status: true },
      { type: 'MemoryPressure', status: false },
      { type: 'DiskPressure', status: false },
      { type: 'PIDPressure', status: false },
    ],
  },
];

interface K8sStore extends ClusterState {
  events: K8sEvent[];
  podCreationFlow: PodCreationFlowState;
  
  // Actions
  addEvent: (event: Omit<K8sEvent, 'id' | 'timestamp'>) => void;
  
  // Pod operations
  createPod: (pod: Omit<Pod, 'id' | 'createdAt' | 'conditions' | 'phase' | 'restartCount'>) => Pod;
  updatePodPhase: (podId: string, phase: Pod['phase']) => void;
  deletePod: (podId: string) => void;
  
  // Deployment operations
  createDeployment: (deployment: Omit<Deployment, 'id' | 'createdAt' | 'status' | 'replicas'>) => void;
  scaleDeployment: (deploymentId: string, replicas: number) => void;
  deleteDeployment: (deploymentId: string) => void;
  
  // Service operations
  createService: (service: Omit<Service, 'id' | 'clusterIP'>) => void;
  deleteService: (serviceId: string) => void;
  
  // Ingress operations
  createIngress: (ingress: Omit<Ingress, 'id'>) => void;
  deleteIngress: (ingressId: string) => void;
  
  // ConfigMap operations
  createConfigMap: (configMap: Omit<ConfigMap, 'id'>) => void;
  deleteConfigMap: (configMapId: string) => void;
  
  // Secret operations
  createSecret: (secret: Omit<Secret, 'id'>) => void;
  deleteSecret: (secretId: string) => void;
  
  // HPA operations
  createHPA: (hpa: Omit<HPA, 'id' | 'currentReplicas' | 'desiredReplicas'>) => void;
  updateHPAMetrics: (hpaId: string, currentValue: number) => void;
  deleteHPA: (hpaId: string) => void;
  
  // Node operations
  addNode: () => void;
  removeNode: (nodeId: string) => void;
  updateNodeStatus: (nodeId: string, status: Node['status']) => void;
  
  // Pod Creation Flow
  startPodCreationFlow: (podSpec: { name: string; namespace: string; containers: Container[] }) => void;
  advancePodCreationStep: () => void;
  resetPodCreationFlow: () => void;
  setPodCreationSpeed: (speed: number) => void;
  
  // Cluster Autoscaler
  toggleClusterAutoscaler: (enabled: boolean) => void;
  setAutoscalerConfig: (config: { minNodes?: number; maxNodes?: number }) => void;
  
  // Reset
  resetCluster: () => void;
}

const initialState: ClusterState = {
  pods: [],
  deployments: [],
  services: [],
  ingresses: [],
  ingressControllers: [{
    id: 'nginx-ingress',
    name: 'nginx-ingress-controller',
    type: 'nginx',
    replicas: 2,
    externalIP: '192.168.1.100',
  }],
  configMaps: [],
  secrets: [],
  hpas: [],
  nodes: createInitialNodes(),
  controlPlane: initialControlPlane,
  clusterAutoscaler: {
    enabled: true,
    minNodes: 2,
    maxNodes: 10,
    scaleDownDelay: 300,
  },
};

const initialPodCreationFlow: PodCreationFlowState = {
  currentStep: 'kubectl-request',
  completedSteps: [],
  pod: null,
  selectedNode: null,
  events: [],
  isRunning: false,
  speed: 5,
};

export const useK8sStore = create<K8sStore>((set, get) => ({
  ...initialState,
  events: [],
  podCreationFlow: initialPodCreationFlow,

  addEvent: (event) => {
    const newEvent: K8sEvent = {
      ...event,
      id: generateId(),
      timestamp: Date.now(),
    };
    set((state) => ({
      events: [newEvent, ...state.events].slice(0, 100),
    }));
  },

  createPod: (podSpec) => {
    const pod: Pod = {
      ...podSpec,
      id: generateId(),
      phase: 'Pending',
      createdAt: Date.now(),
      conditions: [],
      restartCount: 0,
    };
    
    set((state) => ({
      pods: [...state.pods, pod],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `Pod ${pod.name} created`,
      involvedObject: { kind: 'Pod', name: pod.name, namespace: pod.namespace },
    });
    
    return pod;
  },

  updatePodPhase: (podId, phase) => {
    set((state) => ({
      pods: state.pods.map((p) =>
        p.id === podId ? { ...p, phase } : p
      ),
    }));
  },

  deletePod: (podId) => {
    const pod = get().pods.find((p) => p.id === podId);
    if (!pod) return;
    
    set((state) => ({
      pods: state.pods.filter((p) => p.id !== podId),
      nodes: state.nodes.map((n) => ({
        ...n,
        pods: n.pods.filter((id) => id !== podId),
        allocated: {
          cpu: n.allocated.cpu - (pod.containers.reduce((sum, c) => sum + c.resources.requests.cpu, 0)),
          memory: n.allocated.memory - (pod.containers.reduce((sum, c) => sum + c.resources.requests.memory, 0)),
        },
      })),
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Deleted',
      message: `Pod ${pod.name} deleted`,
      involvedObject: { kind: 'Pod', name: pod.name, namespace: pod.namespace },
    });
  },

  createDeployment: (deploymentSpec) => {
    const deployment: Deployment = {
      ...deploymentSpec,
      id: generateId(),
      createdAt: Date.now(),
      status: 'Progressing',
      replicas: 0,
    };
    
    set((state) => ({
      deployments: [...state.deployments, deployment],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `Deployment ${deployment.name} created`,
      involvedObject: { kind: 'Deployment', name: deployment.name, namespace: deployment.namespace },
    });
    
    // Create pods for the deployment
    for (let i = 0; i < deploymentSpec.desiredReplicas; i++) {
      setTimeout(() => {
        const pod = get().createPod({
          name: `${deployment.name}-${generateId().slice(0, 5)}`,
          namespace: deployment.namespace,
          labels: deployment.template.labels,
          containers: deployment.template.containers,
        });
        
        // Simulate pod becoming ready
        setTimeout(() => {
          get().updatePodPhase(pod.id, 'ContainerCreating');
          setTimeout(() => {
            get().updatePodPhase(pod.id, 'Running');
            set((state) => ({
              deployments: state.deployments.map((d) =>
                d.id === deployment.id
                  ? { ...d, replicas: d.replicas + 1, status: d.replicas + 1 >= d.desiredReplicas ? 'Available' : 'Progressing' }
                  : d
              ),
            }));
          }, 1000);
        }, 500);
      }, i * 300);
    }
  },

  scaleDeployment: (deploymentId, replicas) => {
    const deployment = get().deployments.find((d) => d.id === deploymentId);
    if (!deployment) return;
    
    const currentReplicas = deployment.replicas;
    const diff = replicas - currentReplicas;
    
    set((state) => ({
      deployments: state.deployments.map((d) =>
        d.id === deploymentId ? { ...d, desiredReplicas: replicas, status: 'Progressing' } : d
      ),
    }));
    
    if (diff > 0) {
      // Scale up
      for (let i = 0; i < diff; i++) {
        setTimeout(() => {
          const pod = get().createPod({
            name: `${deployment.name}-${generateId().slice(0, 5)}`,
            namespace: deployment.namespace,
            labels: deployment.template.labels,
            containers: deployment.template.containers,
          });
          
          setTimeout(() => {
            get().updatePodPhase(pod.id, 'Running');
            set((state) => ({
              deployments: state.deployments.map((d) =>
                d.id === deploymentId
                  ? { ...d, replicas: d.replicas + 1, status: d.replicas + 1 >= replicas ? 'Available' : 'Progressing' }
                  : d
              ),
            }));
          }, 1000);
        }, i * 300);
      }
    } else if (diff < 0) {
      // Scale down
      const podsToDelete = get().pods
        .filter((p) => Object.entries(deployment.selector).every(([k, v]) => p.labels[k] === v))
        .slice(0, Math.abs(diff));
      
      podsToDelete.forEach((pod, i) => {
        setTimeout(() => {
          get().updatePodPhase(pod.id, 'Terminating');
          setTimeout(() => {
            get().deletePod(pod.id);
            set((state) => ({
              deployments: state.deployments.map((d) =>
                d.id === deploymentId
                  ? { ...d, replicas: Math.max(0, d.replicas - 1), status: 'Available' }
                  : d
              ),
            }));
          }, 500);
        }, i * 200);
      });
    }
  },

  deleteDeployment: (deploymentId) => {
    const deployment = get().deployments.find((d) => d.id === deploymentId);
    if (!deployment) return;
    
    // Delete all pods belonging to this deployment
    const podsToDelete = get().pods.filter((p) =>
      Object.entries(deployment.selector).every(([k, v]) => p.labels[k] === v)
    );
    
    podsToDelete.forEach((pod) => get().deletePod(pod.id));
    
    set((state) => ({
      deployments: state.deployments.filter((d) => d.id !== deploymentId),
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Deleted',
      message: `Deployment ${deployment.name} deleted`,
      involvedObject: { kind: 'Deployment', name: deployment.name, namespace: deployment.namespace },
    });
  },

  createService: (serviceSpec) => {
    const service: Service = {
      ...serviceSpec,
      id: generateId(),
      clusterIP: `10.96.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      nodePort: serviceSpec.type === 'NodePort' ? 30000 + Math.floor(Math.random() * 2767) : undefined,
      loadBalancerIP: serviceSpec.type === 'LoadBalancer' ? `192.168.1.${Math.floor(Math.random() * 255)}` : undefined,
    };
    
    set((state) => ({
      services: [...state.services, service],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `Service ${service.name} created`,
      involvedObject: { kind: 'Service', name: service.name, namespace: service.namespace },
    });
  },

  deleteService: (serviceId) => {
    const service = get().services.find((s) => s.id === serviceId);
    if (!service) return;
    
    set((state) => ({
      services: state.services.filter((s) => s.id !== serviceId),
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Deleted',
      message: `Service ${service.name} deleted`,
      involvedObject: { kind: 'Service', name: service.name, namespace: service.namespace },
    });
  },

  createIngress: (ingressSpec) => {
    const ingress: Ingress = {
      ...ingressSpec,
      id: generateId(),
    };
    
    set((state) => ({
      ingresses: [...state.ingresses, ingress],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `Ingress ${ingress.name} created`,
      involvedObject: { kind: 'Ingress', name: ingress.name, namespace: ingress.namespace },
    });
  },

  deleteIngress: (ingressId) => {
    const ingress = get().ingresses.find((i) => i.id === ingressId);
    if (!ingress) return;
    
    set((state) => ({
      ingresses: state.ingresses.filter((i) => i.id !== ingressId),
    }));
  },

  createConfigMap: (configMapSpec) => {
    const configMap: ConfigMap = {
      ...configMapSpec,
      id: generateId(),
    };
    
    set((state) => ({
      configMaps: [...state.configMaps, configMap],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `ConfigMap ${configMap.name} created`,
      involvedObject: { kind: 'ConfigMap', name: configMap.name, namespace: configMap.namespace },
    });
  },

  deleteConfigMap: (configMapId) => {
    set((state) => ({
      configMaps: state.configMaps.filter((c) => c.id !== configMapId),
    }));
  },

  createSecret: (secretSpec) => {
    const secret: Secret = {
      ...secretSpec,
      id: generateId(),
    };
    
    set((state) => ({
      secrets: [...state.secrets, secret],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `Secret ${secret.name} created`,
      involvedObject: { kind: 'Secret', name: secret.name, namespace: secret.namespace },
    });
  },

  deleteSecret: (secretId) => {
    set((state) => ({
      secrets: state.secrets.filter((s) => s.id !== secretId),
    }));
  },

  createHPA: (hpaSpec) => {
    const hpa: HPA = {
      ...hpaSpec,
      id: generateId(),
      currentReplicas: 1,
      desiredReplicas: hpaSpec.minReplicas,
    };
    
    set((state) => ({
      hpas: [...state.hpas, hpa],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'Created',
      message: `HPA ${hpa.name} created`,
      involvedObject: { kind: 'HorizontalPodAutoscaler', name: hpa.name, namespace: hpa.namespace },
    });
  },

  updateHPAMetrics: (hpaId, currentValue) => {
    const hpa = get().hpas.find((h) => h.id === hpaId);
    if (!hpa) return;
    
    const targetValue = hpa.metrics[0]?.targetValue || 50;
    const ratio = currentValue / targetValue;
    let desiredReplicas = Math.ceil(hpa.currentReplicas * ratio);
    desiredReplicas = Math.max(hpa.minReplicas, Math.min(hpa.maxReplicas, desiredReplicas));
    
    set((state) => ({
      hpas: state.hpas.map((h) =>
        h.id === hpaId
          ? {
              ...h,
              metrics: h.metrics.map((m, i) => (i === 0 ? { ...m, currentValue } : m)),
              desiredReplicas,
            }
          : h
      ),
    }));
    
    // Scale the deployment if needed
    const deployment = get().deployments.find((d) => d.name === hpa.targetRef.name);
    if (deployment && desiredReplicas !== deployment.desiredReplicas) {
      get().scaleDeployment(deployment.id, desiredReplicas);
    }
  },

  deleteHPA: (hpaId) => {
    set((state) => ({
      hpas: state.hpas.filter((h) => h.id !== hpaId),
    }));
  },

  addNode: () => {
    const workerCount = get().nodes.filter((n) => n.role === 'worker').length;
    const newNode: Node = {
      id: generateId(),
      name: `worker-node-${workerCount + 1}`,
      role: 'worker',
      status: 'Ready',
      capacity: { cpu: 4000, memory: 8192 },
      allocatable: { cpu: 3800, memory: 7680 },
      allocated: { cpu: 0, memory: 0 },
      pods: [],
      conditions: [
        { type: 'Ready', status: true },
        { type: 'MemoryPressure', status: false },
        { type: 'DiskPressure', status: false },
        { type: 'PIDPressure', status: false },
      ],
    };
    
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      message: `Node ${newNode.name} joined the cluster`,
      involvedObject: { kind: 'Node', name: newNode.name },
    });
  },

  removeNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || node.role === 'master') return;
    
    // Evict pods from the node
    node.pods.forEach((podId) => {
      get().deletePod(podId);
    });
    
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
    }));
    
    get().addEvent({
      type: 'Normal',
      reason: 'NodeRemoved',
      message: `Node ${node.name} removed from the cluster`,
      involvedObject: { kind: 'Node', name: node.name },
    });
  },

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              status,
              conditions: n.conditions.map((c) =>
                c.type === 'Ready' ? { ...c, status: status === 'Ready' } : c
              ),
            }
          : n
      ),
    }));
  },

  startPodCreationFlow: (podSpec) => {
    const pod: Pod = {
      id: generateId(),
      name: podSpec.name,
      namespace: podSpec.namespace,
      labels: { app: podSpec.name },
      containers: podSpec.containers,
      phase: 'Pending',
      createdAt: Date.now(),
      conditions: [],
      restartCount: 0,
    };
    
    set({
      podCreationFlow: {
        currentStep: 'kubectl-request',
        completedSteps: [],
        pod,
        selectedNode: null,
        events: [],
        isRunning: true,
        speed: get().podCreationFlow.speed,
      },
    });
  },

  advancePodCreationStep: () => {
    const { podCreationFlow, nodes } = get();
    const currentIndex = POD_CREATION_STEPS.indexOf(podCreationFlow.currentStep);
    
    if (currentIndex >= POD_CREATION_STEPS.length - 1) {
      // Flow complete
      if (podCreationFlow.pod) {
        set((state) => ({
          pods: [...state.pods, { ...podCreationFlow.pod!, phase: 'Running' }],
          podCreationFlow: {
            ...state.podCreationFlow,
            isRunning: false,
            completedSteps: [...state.podCreationFlow.completedSteps, 'pod-running'],
          },
        }));
      }
      return;
    }
    
    const nextStep = POD_CREATION_STEPS[currentIndex + 1];
    let selectedNode = podCreationFlow.selectedNode;
    
    // Select node during scheduler-bind step
    if (nextStep === 'scheduler-bind' && !selectedNode) {
      const workerNodes = nodes.filter((n) => n.role === 'worker' && n.status === 'Ready');
      selectedNode = workerNodes[Math.floor(Math.random() * workerNodes.length)] || null;
    }
    
    const newEvent: K8sEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'Normal',
      reason: getStepReason(nextStep),
      message: getStepMessage(nextStep, podCreationFlow.pod?.name || '', selectedNode?.name),
      involvedObject: {
        kind: 'Pod',
        name: podCreationFlow.pod?.name || '',
        namespace: podCreationFlow.pod?.namespace,
      },
    };
    
    set((state) => ({
      podCreationFlow: {
        ...state.podCreationFlow,
        currentStep: nextStep,
        completedSteps: [...state.podCreationFlow.completedSteps, state.podCreationFlow.currentStep],
        selectedNode,
        events: [newEvent, ...state.podCreationFlow.events],
      },
    }));
  },

  resetPodCreationFlow: () => {
    set({ podCreationFlow: initialPodCreationFlow });
  },

  setPodCreationSpeed: (speed) => {
    set((state) => ({
      podCreationFlow: { ...state.podCreationFlow, speed },
    }));
  },

  toggleClusterAutoscaler: (enabled) => {
    set((state) => ({
      clusterAutoscaler: { ...state.clusterAutoscaler, enabled },
    }));
  },

  setAutoscalerConfig: (config) => {
    set((state) => ({
      clusterAutoscaler: { ...state.clusterAutoscaler, ...config },
    }));
  },

  resetCluster: () => {
    set({
      ...initialState,
      nodes: createInitialNodes(),
      events: [],
      podCreationFlow: initialPodCreationFlow,
    });
  },
}));

function getStepReason(step: PodCreationStep): string {
  const reasons: Record<PodCreationStep, string> = {
    'kubectl-request': 'RequestReceived',
    'api-server-auth': 'Authenticated',
    'api-server-validation': 'Validated',
    'etcd-persist': 'Persisted',
    'scheduler-watch': 'SchedulerNotified',
    'scheduler-filter': 'NodesFiltered',
    'scheduler-score': 'NodesScored',
    'scheduler-bind': 'Scheduled',
    'kubelet-watch': 'KubeletNotified',
    'kubelet-cri': 'CRIInvoked',
    'container-pull': 'Pulling',
    'container-create': 'Created',
    'container-start': 'Started',
    'pod-running': 'Running',
  };
  return reasons[step];
}

function getStepMessage(step: PodCreationStep, podName: string, nodeName?: string): string {
  const messages: Record<PodCreationStep, string> = {
    'kubectl-request': `kubectl create pod request received for ${podName}`,
    'api-server-auth': `Request authenticated and authorized`,
    'api-server-validation': `Pod spec validated successfully`,
    'etcd-persist': `Pod ${podName} persisted to etcd`,
    'scheduler-watch': `Scheduler detected new unscheduled pod ${podName}`,
    'scheduler-filter': `Filtered nodes based on resource requirements and constraints`,
    'scheduler-score': `Scored feasible nodes based on scheduling priorities`,
    'scheduler-bind': `Pod ${podName} bound to node ${nodeName || 'unknown'}`,
    'kubelet-watch': `Kubelet on ${nodeName || 'node'} detected new pod assignment`,
    'kubelet-cri': `Container Runtime Interface invoked`,
    'container-pull': `Pulling container image`,
    'container-create': `Container created successfully`,
    'container-start': `Container started`,
    'pod-running': `Pod ${podName} is now Running`,
  };
  return messages[step];
}

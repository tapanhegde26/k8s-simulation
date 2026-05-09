// Kubernetes Resource Types

export type PodPhase = 'Pending' | 'ContainerCreating' | 'Running' | 'Succeeded' | 'Failed' | 'Terminating';
export type DeploymentStatus = 'Progressing' | 'Available' | 'Failed';
export type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer';

export interface ResourceRequirements {
  cpu: number; // millicores
  memory: number; // MB
}

export interface Container {
  name: string;
  image: string;
  resources: {
    requests: ResourceRequirements;
    limits: ResourceRequirements;
  };
  ports?: number[];
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  labels: Record<string, string>;
  containers: Container[];
  phase: PodPhase;
  nodeName?: string;
  createdAt: number;
  conditions: PodCondition[];
  restartCount: number;
}

export interface PodCondition {
  type: 'PodScheduled' | 'ContainersReady' | 'Initialized' | 'Ready';
  status: boolean;
  timestamp: number;
}

export interface Deployment {
  id: string;
  name: string;
  namespace: string;
  replicas: number;
  desiredReplicas: number;
  selector: Record<string, string>;
  template: {
    labels: Record<string, string>;
    containers: Container[];
  };
  status: DeploymentStatus;
  createdAt: number;
}

export interface Service {
  id: string;
  name: string;
  namespace: string;
  type: ServiceType;
  selector: Record<string, string>;
  ports: ServicePort[];
  clusterIP?: string;
  nodePort?: number;
  loadBalancerIP?: string;
}

export interface ServicePort {
  name?: string;
  port: number;
  targetPort: number;
  protocol: 'TCP' | 'UDP';
}

export interface Ingress {
  id: string;
  name: string;
  namespace: string;
  rules: IngressRule[];
  tls?: boolean;
}

export interface IngressRule {
  host: string;
  paths: {
    path: string;
    pathType: 'Prefix' | 'Exact';
    backend: {
      serviceName: string;
      servicePort: number;
    };
  }[];
}

export interface IngressController {
  id: string;
  name: string;
  type: 'nginx' | 'traefik' | 'haproxy';
  replicas: number;
  externalIP?: string;
}

export interface ConfigMap {
  id: string;
  name: string;
  namespace: string;
  data: Record<string, string>;
}

export interface Secret {
  id: string;
  name: string;
  namespace: string;
  type: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson';
  data: Record<string, string>; // base64 encoded in real k8s
}

export interface HPA {
  id: string;
  name: string;
  namespace: string;
  targetRef: {
    kind: 'Deployment';
    name: string;
  };
  minReplicas: number;
  maxReplicas: number;
  metrics: HPAMetric[];
  currentReplicas: number;
  desiredReplicas: number;
}

export interface HPAMetric {
  type: 'cpu' | 'memory' | 'custom';
  targetValue: number; // percentage for cpu/memory
  currentValue?: number;
}

// Cluster Architecture Types

export interface Node {
  id: string;
  name: string;
  role: 'master' | 'worker';
  status: 'Ready' | 'NotReady';
  capacity: ResourceRequirements;
  allocatable: ResourceRequirements;
  allocated: ResourceRequirements;
  pods: string[]; // pod IDs
  conditions: NodeCondition[];
}

export interface NodeCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure';
  status: boolean;
}

// Control Plane Components
export interface ControlPlaneComponent {
  name: string;
  status: 'Running' | 'Pending' | 'Failed';
  description: string;
}

export interface ClusterState {
  // Resources
  pods: Pod[];
  deployments: Deployment[];
  services: Service[];
  ingresses: Ingress[];
  ingressControllers: IngressController[];
  configMaps: ConfigMap[];
  secrets: Secret[];
  hpas: HPA[];
  
  // Cluster
  nodes: Node[];
  controlPlane: ControlPlaneComponent[];
  
  // Autoscaler
  clusterAutoscaler: {
    enabled: boolean;
    minNodes: number;
    maxNodes: number;
    scaleDownDelay: number;
  };
}

// Event Types for Simulation
export interface K8sEvent {
  id: string;
  timestamp: number;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  involvedObject: {
    kind: string;
    name: string;
    namespace?: string;
  };
}

// Pod Creation Flow Steps
export type PodCreationStep = 
  | 'kubectl-request'
  | 'api-server-auth'
  | 'api-server-validation'
  | 'etcd-persist'
  | 'scheduler-watch'
  | 'scheduler-filter'
  | 'scheduler-score'
  | 'scheduler-bind'
  | 'kubelet-watch'
  | 'kubelet-cri'
  | 'container-pull'
  | 'container-create'
  | 'container-start'
  | 'pod-running';

export interface PodCreationFlowState {
  currentStep: PodCreationStep;
  completedSteps: PodCreationStep[];
  pod: Pod | null;
  selectedNode: Node | null;
  events: K8sEvent[];
  isRunning: boolean;
  speed: number; // 1-10
}

// Types for K8s Architecture Flow Animation

export type FlowType = 'pod-creation' | 'deployment' | 'service-request' | 'persistent-volume';

export type ComponentId = 
  | 'kubectl'
  | 'api-server'
  | 'etcd'
  | 'scheduler'
  | 'controller-manager'
  | 'kubelet'
  | 'container-runtime'
  | 'pod'
  | 'kube-proxy'
  | 'ingress'
  | 'service'
  | 'replicaset'
  | 'deployment'
  | 'pv'
  | 'pvc'
  | 'storage-backend';

export interface K8sComponent {
  id: ComponentId;
  name: string;
  description: string;
  shape: 'hexagon' | 'circle' | 'square' | 'diamond' | 'triangle' | 'pentagon' | 'octagon' | 'rectangle';
  color: string;
  position: { x: number; y: number };
  node: 'external' | 'master' | 'worker';
}

export interface FlowStep {
  id: string;
  from: ComponentId;
  to: ComponentId;
  label: string;
  description: string;
  duration: number;
}

export interface Flow {
  id: FlowType;
  name: string;
  description: string;
  steps: FlowStep[];
}

export interface AnimationState {
  currentFlow: FlowType;
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  activeComponent: ComponentId | null;
  activeConnection: { from: ComponentId; to: ComponentId } | null;
}

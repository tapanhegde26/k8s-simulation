// Types for Pod Creation Flow Animation

export type PodCreationComponentId = 
  | 'user'
  | 'kubectl'
  | 'api-server'
  | 'auth-module'
  | 'admission-controller'
  | 'etcd'
  | 'scheduler'
  | 'node-filter'
  | 'node-scorer'
  | 'kubelet'
  | 'cri'
  | 'container-runtime'
  | 'image-registry'
  | 'pod'
  | 'pod-sandbox'
  | 'container';

export interface PodCreationComponent {
  id: PodCreationComponentId;
  name: string;
  description: string;
  shape: 'hexagon' | 'circle' | 'square' | 'diamond' | 'triangle' | 'pentagon' | 'octagon' | 'rectangle' | 'star';
  color: string;
  position: { x: number; y: number };
  zone: 'client' | 'api-layer' | 'control-plane' | 'worker-node' | 'external';
}

export interface PodCreationStep {
  id: string;
  from: PodCreationComponentId;
  to: PodCreationComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
}

export interface PodCreationFlow {
  id: string;
  name: string;
  description: string;
  steps: PodCreationStep[];
}

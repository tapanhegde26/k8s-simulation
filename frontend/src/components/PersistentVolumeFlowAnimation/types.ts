// Types for Persistent Volume / PVC Flow Animation

export type PvFlowComponentId =
  | 'user'
  | 'kubectl'
  | 'api-server'
  | 'etcd'
  | 'pv-controller'
  | 'storage-backend'
  | 'pv'
  | 'pvc'
  | 'pod-spec'
  | 'kubelet'
  | 'volume-manager'
  | 'container';

export interface PvFlowComponent {
  id: PvFlowComponentId;
  name: string;
  description: string;
  shape: 'hexagon' | 'circle' | 'square' | 'diamond' | 'triangle' | 'pentagon' | 'octagon' | 'rectangle' | 'star';
  color: string;
  position: { x: number; y: number };
  zone: 'client' | 'api-layer' | 'control-plane' | 'storage' | 'worker-node' | 'external';
}

export interface PvFlowStep {
  id: string;
  from: PvFlowComponentId;
  to: PvFlowComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
}

export interface PvFlow {
  id: string;
  name: string;
  description: string;
  steps: PvFlowStep[];
}

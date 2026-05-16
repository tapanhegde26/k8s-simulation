// Types for Node to Control Plane Communication Flow Animation

export type NodeCPComponentId =
  | 'kubelet'
  | 'kube-proxy'
  | 'pod'
  | 'service-account'
  | 'api-server'
  | 'etcd'
  | 'controller-manager'
  | 'scheduler'
  | 'konnectivity-server'
  | 'konnectivity-agent'
  | 'root-ca';

export type ZoneType = 
  | 'worker-node'
  | 'control-plane'
  | 'pki'
  | 'konnectivity';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'octagon' 
  | 'rectangle' 
  | 'cylinder'
  | 'shield'
  | 'key'
  | 'lock';

export interface NodeCPComponent {
  id: NodeCPComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
}

export interface NodeCPStep {
  id: string;
  from: NodeCPComponentId;
  to: NodeCPComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  commType?: 'node-to-cp' | 'cp-to-node' | 'internal' | 'secure' | 'tunnel';
  packetLabel?: string;
}

export interface CommunicationPath {
  name: string;
  direction: string;
  security: string;
  purpose: string;
}

// Types for Secrets Management Flow Animation

export type SecretsComponentId =
  | 'user'
  | 'kubectl'
  | 'api-server'
  | 'etcd'
  | 'kms-provider'
  | 'encryption-config'
  | 'kubelet'
  | 'pod'
  | 'secret-volume'
  | 'container';

export type ZoneType = 
  | 'client'
  | 'control-plane'
  | 'encryption'
  | 'worker-node'
  | 'pod-zone';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'octagon' 
  | 'rectangle' 
  | 'cylinder'
  | 'user'
  | 'key'
  | 'lock';

export interface SecretsComponent {
  id: SecretsComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
}

export interface SecretsStep {
  id: string;
  from: SecretsComponentId;
  to: SecretsComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  secretType?: 'plaintext' | 'encrypted' | 'mounted' | 'decrypted' | 'create' | 'fetch';
  packetLabel?: string;
}

export interface SecretData {
  name: string;
  namespace: string;
  type: string;
  keys: string[];
}

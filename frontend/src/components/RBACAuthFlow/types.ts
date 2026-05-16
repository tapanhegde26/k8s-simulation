// Types for RBAC Authorization Flow Animation

export type RBACComponentId =
  | 'user'
  | 'service-account'
  | 'kubectl'
  | 'api-server'
  | 'authenticator'
  | 'authorizer'
  | 'role'
  | 'cluster-role'
  | 'role-binding'
  | 'cluster-role-binding'
  | 'admission-controller'
  | 'etcd';

export type ZoneType = 
  | 'client'
  | 'api-layer'
  | 'rbac-layer'
  | 'storage';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'triangle' 
  | 'pentagon' 
  | 'octagon' 
  | 'rectangle' 
  | 'user'
  | 'key'
  | 'lock';

export interface RBACComponent {
  id: RBACComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
}

export interface RBACStep {
  id: string;
  from: RBACComponentId;
  to: RBACComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  requestType?: 'auth' | 'allowed' | 'denied' | 'lookup' | 'write';
  packetLabel?: string;
}

export interface RBACRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
}

export interface Role {
  name: string;
  namespace?: string;
  rules: RBACRule[];
}

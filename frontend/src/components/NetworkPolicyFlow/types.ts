// Types for Network Policy Enforcement Flow Animation

export type NetworkPolicyComponentId =
  | 'pod-frontend'
  | 'pod-backend'
  | 'pod-database'
  | 'pod-attacker'
  | 'netpol-backend'
  | 'netpol-database'
  | 'cni-plugin'
  | 'iptables-node1'
  | 'iptables-node2'
  | 'policy-controller';

export type ZoneType = 
  | 'frontend-tier'
  | 'backend-tier'
  | 'database-tier'
  | 'attacker-zone'
  | 'control-plane';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'triangle' 
  | 'pentagon' 
  | 'octagon' 
  | 'rectangle' 
  | 'shield'
  | 'firewall';

export interface NetworkPolicyComponent {
  id: NetworkPolicyComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
  labels?: Record<string, string>;
  ipAddress?: string;
}

export interface NetworkPolicyStep {
  id: string;
  from: NetworkPolicyComponentId;
  to: NetworkPolicyComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  trafficType?: 'allowed' | 'denied' | 'policy-sync' | 'evaluation';
  packetLabel?: string;
}

export interface PolicyRule {
  name: string;
  podSelector: string;
  ingress: {
    from: string;
    ports: string[];
  }[];
  egress?: {
    to: string;
    ports: string[];
  }[];
}

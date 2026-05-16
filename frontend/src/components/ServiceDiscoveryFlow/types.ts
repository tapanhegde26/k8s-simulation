// Types for Service Discovery & DNS Resolution Flow Animation

export type ServiceDiscoveryComponentId =
  | 'client-pod'
  | 'coredns'
  | 'api-server'
  | 'etcd'
  | 'endpoints'
  | 'kube-proxy'
  | 'iptables'
  | 'service'
  | 'pod-1'
  | 'pod-2'
  | 'pod-3';

export type ZoneType = 
  | 'application' 
  | 'dns-layer' 
  | 'control-plane' 
  | 'networking' 
  | 'workloads';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'triangle' 
  | 'pentagon' 
  | 'octagon' 
  | 'rectangle' 
  | 'star';

export interface ServiceDiscoveryComponent {
  id: ServiceDiscoveryComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
  ipAddress?: string;
  port?: number;
}

export interface ServiceDiscoveryStep {
  id: string;
  from: ServiceDiscoveryComponentId;
  to: ServiceDiscoveryComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  packetType?: 'dns-query' | 'dns-response' | 'http-request' | 'http-response' | 'data';
  packetLabel?: string;
}

export interface ServiceDiscoveryFlow {
  id: string;
  name: string;
  description: string;
  steps: ServiceDiscoveryStep[];
}

export interface DNSQueryInfo {
  query: string;
  type: 'A' | 'AAAA' | 'SRV' | 'CNAME';
  response?: string;
}

export interface IPTablesRule {
  chain: string;
  target: string;
  source: string;
  destination: string;
  comment: string;
}

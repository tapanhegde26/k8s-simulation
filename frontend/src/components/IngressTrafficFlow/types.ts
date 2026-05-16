// Types for Ingress Traffic Flow Animation

export type IngressComponentId =
  | 'internet'
  | 'client'
  | 'cloud-lb'
  | 'node-1'
  | 'node-2'
  | 'ingress-controller'
  | 'ingress-rules'
  | 'service-a'
  | 'service-b'
  | 'pod-a1'
  | 'pod-a2'
  | 'pod-b1';

export type ZoneType = 
  | 'external' 
  | 'cloud-provider' 
  | 'cluster-edge'
  | 'ingress-layer'
  | 'services'
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
  | 'star'
  | 'cloud';

export interface IngressComponent {
  id: IngressComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
  ipAddress?: string;
  port?: number;
  hostname?: string;
}

export interface IngressStep {
  id: string;
  from: IngressComponentId;
  to: IngressComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  packetType?: 'https-request' | 'https-response' | 'http-request' | 'http-response' | 'tls' | 'data';
  packetLabel?: string;
}

export interface IngressFlow {
  id: string;
  name: string;
  description: string;
  steps: IngressStep[];
}

export interface IngressRule {
  host: string;
  path: string;
  serviceName: string;
  servicePort: number;
}

export interface TLSInfo {
  secretName: string;
  hosts: string[];
  certificate: string;
}

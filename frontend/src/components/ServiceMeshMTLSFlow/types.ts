// Types for Service Mesh mTLS Flow Animation

export type MTLSComponentId =
  | 'client-app'
  | 'client-proxy'
  | 'istiod'
  | 'citadel'
  | 'server-proxy'
  | 'server-app'
  | 'root-ca'
  | 'workload-cert-client'
  | 'workload-cert-server';

export type ZoneType = 
  | 'client-pod'
  | 'control-plane'
  | 'server-pod'
  | 'pki';

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

export interface MTLSComponent {
  id: MTLSComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
}

export interface MTLSStep {
  id: string;
  from: MTLSComponentId;
  to: MTLSComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  trafficType?: 'plaintext' | 'encrypted' | 'cert-request' | 'cert-issue' | 'handshake' | 'mtls';
  packetLabel?: string;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validity: string;
  spiffeId: string;
}

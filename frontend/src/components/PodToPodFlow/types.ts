// Types for Pod-to-Pod Communication Flow Animation

export type PodToPodComponentId =
  | 'pod-a'
  | 'pod-a-netns'
  | 'veth-a'
  | 'bridge-1'
  | 'node-1-eth'
  | 'overlay-network'
  | 'node-2-eth'
  | 'bridge-2'
  | 'veth-b'
  | 'pod-b-netns'
  | 'pod-b'
  | 'cni-plugin';

export type ZoneType = 
  | 'node-1' 
  | 'node-2' 
  | 'overlay'
  | 'pod-a-zone'
  | 'pod-b-zone';

export type ShapeType = 
  | 'hexagon' 
  | 'circle' 
  | 'square' 
  | 'diamond' 
  | 'triangle' 
  | 'pentagon' 
  | 'octagon' 
  | 'rectangle' 
  | 'cylinder'
  | 'pipe';

export interface PodToPodComponent {
  id: PodToPodComponentId;
  name: string;
  description: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  zone: ZoneType;
  ipAddress?: string;
  macAddress?: string;
}

export interface PodToPodStep {
  id: string;
  from: PodToPodComponentId;
  to: PodToPodComponentId;
  label: string;
  description: string;
  duration: number;
  details?: string[];
  packetType?: 'tcp-syn' | 'tcp-ack' | 'http-request' | 'http-response' | 'arp' | 'encapsulated' | 'data';
  packetLabel?: string;
}

export interface NetworkNamespace {
  name: string;
  interfaces: string[];
  routes: string[];
}

export interface VXLANHeader {
  vni: number;
  srcIP: string;
  dstIP: string;
  innerSrcMAC: string;
  innerDstMAC: string;
}

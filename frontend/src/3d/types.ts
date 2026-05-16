// 3D Visualization Types

import type { ApiCluster, ApiPod, ApiDeployment, ApiService, ApiNode, ApiClusterEvent } from '../services/api.types';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Node3D {
  id: string;
  name: string;
  role: 'master' | 'worker';
  status: 'Ready' | 'NotReady';
  allocatedCpu: number;
  allocatableCpu: number;
  allocatedMemory: number;
  allocatableMemory: number;
  podCount: number;
  position: [number, number, number];
}

export interface Pod3D {
  id: string;
  name: string;
  namespace: string;
  phase: string;
  cpuRequest: number;
  memoryRequest: number;
  containerCount: number;
  nodeName?: string;
  position: [number, number, number];
  labels: Record<string, string>;
}

export interface Service3D {
  id: string;
  name: string;
  namespace: string;
  type: string;
  clusterIP?: string;
  selector: Record<string, string>;
  position: [number, number, number];
  connectedPodIds: string[];
}

export interface ControlPlaneComponent3D {
  name: string;
  status: string;
  health: string;
  description: string;
  position: [number, number, number];
}

export interface Animation {
  id: string;
  type: 'pod-creation' | 'pod-deletion' | 'scaling' | 'node-add' | 'node-remove' | 'service-connect';
  data: Record<string, unknown>;
  priority: number;
  duration: number;
  startTime?: number;
}

export interface SceneData {
  cluster: ApiCluster | null;
  nodes: Node3D[];
  pods: Pod3D[];
  services: Service3D[];
  controlPlane: ControlPlaneComponent3D[];
}

export interface KubernetesSceneProps {
  cluster: ApiCluster | null;
  pods: ApiPod[];
  deployments: ApiDeployment[];
  services: ApiService[];
  nodes: ApiNode[];
  events: ApiClusterEvent[];
  onSelectObject?: (type: string, id: string, name: string) => void;
}

export interface SelectedObject {
  type: 'node' | 'pod' | 'service' | 'control-plane';
  id: string;
  name: string;
}

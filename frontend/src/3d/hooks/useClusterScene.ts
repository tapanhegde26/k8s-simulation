// Hook to bridge cluster data to 3D scene

import { useMemo } from 'react';
import type { ApiCluster, ApiPod, ApiService, ApiNode, ApiControlPlaneComponent } from '../../services/api.types';
import type { Node3D, Pod3D, Service3D, ControlPlaneComponent3D, SceneData } from '../types';
import { layout } from '../constants';

function calculateNodePosition(index: number, total: number, role: 'master' | 'worker'): [number, number, number] {
  if (role === 'master') {
    return [0, 0, 0];
  }
  
  const workerIndex = index;
  const angle = (workerIndex / Math.max(total - 1, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 8;
  
  return [
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius,
  ];
}

function calculatePodPosition(
  podIndex: number,
  _totalPodsInNode: number,
  nodePosition: [number, number, number]
): [number, number, number] {
  const podsPerRow = 3;
  const row = Math.floor(podIndex / podsPerRow);
  const col = podIndex % podsPerRow;
  
  const offsetX = (col - 1) * layout.podSpacing;
  const offsetY = 0.8 + row * layout.podSpacing;
  const offsetZ = 0;
  
  return [
    nodePosition[0] + offsetX,
    nodePosition[1] + offsetY,
    nodePosition[2] + offsetZ,
  ];
}

function calculateServicePosition(index: number, total: number): [number, number, number] {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 12;
  
  return [
    Math.cos(angle) * radius,
    3,
    Math.sin(angle) * radius,
  ];
}

function calculateControlPlanePosition(name: string): [number, number, number] {
  const positions: Record<string, [number, number, number]> = {
    'kube-apiserver': [0, 2, -12],
    'etcd': [0, 3, -14],
    'kube-scheduler': [-2, 2, -13],
    'kube-controller-manager': [2, 2, -13],
    'cloud-controller-manager': [0, 1.5, -11],
  };
  
  return positions[name] || [0, 2, -12];
}

export function convertNodeTo3D(
  apiNode: ApiNode,
  index: number,
  totalNodes: number,
  podCounts: Map<string, number>
): Node3D {
  const isReady = apiNode.status.conditions.some(
    (c) => c.type === 'Ready' && c.status === 'True'
  );
  
  const workerCount = totalNodes - 1;
  const position = calculateNodePosition(
    apiNode.role === 'master' ? 0 : index,
    workerCount,
    apiNode.role as 'master' | 'worker'
  );
  
  return {
    id: apiNode.metadata.uid || apiNode.metadata.name,
    name: apiNode.metadata.name,
    role: apiNode.role as 'master' | 'worker',
    status: isReady ? 'Ready' : 'NotReady',
    allocatedCpu: apiNode.status.allocated.cpu_millicores,
    allocatableCpu: apiNode.status.allocatable.cpu_millicores,
    allocatedMemory: apiNode.status.allocated.memory_mb,
    allocatableMemory: apiNode.status.allocatable.memory_mb,
    podCount: podCounts.get(apiNode.metadata.name) || 0,
    position,
  };
}

export function convertPodTo3D(
  apiPod: ApiPod,
  nodes3D: Node3D[],
  podIndexInNode: number
): Pod3D {
  const nodeName = apiPod.status.node_name;
  const node = nodes3D.find((n) => n.name === nodeName);
  const nodePosition: [number, number, number] = node?.position || [0, 0, 0];
  
  const position = calculatePodPosition(podIndexInNode, 10, nodePosition);
  
  const totalCpu = apiPod.spec.containers.reduce(
    (sum, c) => sum + c.resources.requests.cpu_millicores,
    0
  );
  const totalMemory = apiPod.spec.containers.reduce(
    (sum, c) => sum + c.resources.requests.memory_mb,
    0
  );
  
  return {
    id: apiPod.metadata.uid || apiPod.metadata.name,
    name: apiPod.metadata.name,
    namespace: apiPod.metadata.namespace,
    phase: apiPod.status.phase,
    cpuRequest: totalCpu,
    memoryRequest: totalMemory,
    containerCount: apiPod.spec.containers.length,
    nodeName,
    position,
    labels: apiPod.metadata.labels,
  };
}

export function convertServiceTo3D(
  apiService: ApiService,
  index: number,
  totalServices: number,
  pods3D: Pod3D[]
): Service3D {
  const position = calculateServicePosition(index, totalServices);
  
  const connectedPodIds = pods3D
    .filter((pod) => {
      const selector = apiService.spec.selector;
      return Object.entries(selector).every(
        ([key, value]) => pod.labels[key] === value
      );
    })
    .map((pod) => pod.id);
  
  return {
    id: apiService.metadata.uid || apiService.metadata.name,
    name: apiService.metadata.name,
    namespace: apiService.metadata.namespace,
    type: apiService.spec.type,
    clusterIP: apiService.spec.cluster_ip,
    selector: apiService.spec.selector,
    position,
    connectedPodIds,
  };
}

export function convertControlPlaneTo3D(
  component: ApiControlPlaneComponent
): ControlPlaneComponent3D {
  return {
    name: component.name,
    status: component.status,
    health: component.health,
    description: component.description,
    position: calculateControlPlanePosition(component.name),
  };
}

export function useClusterScene(
  cluster: ApiCluster | null,
  pods: ApiPod[],
  services: ApiService[]
): SceneData {
  return useMemo(() => {
    if (!cluster) {
      return {
        cluster: null,
        nodes: [],
        pods: [],
        services: [],
        controlPlane: [],
      };
    }
    
    const podCountsByNode = new Map<string, number>();
    pods.forEach((pod) => {
      const nodeName = pod.status.node_name;
      if (nodeName) {
        podCountsByNode.set(nodeName, (podCountsByNode.get(nodeName) || 0) + 1);
      }
    });
    
    const nodes3D = cluster.nodes.map((node, index) =>
      convertNodeTo3D(node, index, cluster.nodes.length, podCountsByNode)
    );
    
    const podIndexByNode = new Map<string, number>();
    const pods3D = pods.map((pod) => {
      const nodeName = pod.status.node_name || '';
      const currentIndex = podIndexByNode.get(nodeName) || 0;
      podIndexByNode.set(nodeName, currentIndex + 1);
      return convertPodTo3D(pod, nodes3D, currentIndex);
    });
    
    const services3D = services.map((service, index) =>
      convertServiceTo3D(service, index, services.length, pods3D)
    );
    
    const controlPlane3D = cluster.control_plane.map(convertControlPlaneTo3D);
    
    return {
      cluster,
      nodes: nodes3D,
      pods: pods3D,
      services: services3D,
      controlPlane: controlPlane3D,
    };
  }, [cluster, pods, services]);
}

export default useClusterScene;

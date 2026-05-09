// Type converters between API types and frontend types

import type {
  ApiPod,
  ApiDeployment,
  ApiService,
  ApiConfigMap,
  ApiSecret,
  ApiHPA,
  ApiNode,
  ApiClusterEvent,
  ApiControlPlaneComponent,
} from './api.types';

import type {
  Pod,
  Deployment,
  Service,
  ConfigMap,
  Secret,
  HPA,
  Node,
  K8sEvent,
  ControlPlaneComponent,
  PodPhase,
  DeploymentStatus,
  ServiceType,
} from '../types/kubernetes';

// Convert API Pod to frontend Pod
export function convertPod(apiPod: ApiPod): Pod {
  return {
    id: apiPod.metadata.uid || apiPod.metadata.name,
    name: apiPod.metadata.name,
    namespace: apiPod.metadata.namespace,
    labels: apiPod.metadata.labels,
    containers: apiPod.spec.containers.map((c) => ({
      name: c.name,
      image: c.image,
      resources: {
        requests: {
          cpu: c.resources.requests.cpu_millicores,
          memory: c.resources.requests.memory_mb,
        },
        limits: {
          cpu: c.resources.limits.cpu_millicores,
          memory: c.resources.limits.memory_mb,
        },
      },
      ports: c.ports.map((p) => p.container_port),
    })),
    phase: apiPod.status.phase as PodPhase,
    nodeName: apiPod.status.node_name,
    createdAt: apiPod.metadata.created_at ? new Date(apiPod.metadata.created_at).getTime() : Date.now(),
    conditions: [],
    restartCount: apiPod.status.container_statuses.reduce((sum, cs) => sum + cs.restart_count, 0),
  };
}

// Convert API Deployment to frontend Deployment
export function convertDeployment(apiDeployment: ApiDeployment): Deployment {
  const statusMap: Record<string, DeploymentStatus> = {
    'Progressing': 'Progressing',
    'Available': 'Available',
    'Failed': 'Failed',
  };
  
  return {
    id: apiDeployment.metadata.uid || apiDeployment.metadata.name,
    name: apiDeployment.metadata.name,
    namespace: apiDeployment.metadata.namespace,
    replicas: apiDeployment.status.ready_replicas || 0,
    desiredReplicas: apiDeployment.spec.replicas,
    selector: apiDeployment.spec.selector.match_labels,
    template: {
      labels: apiDeployment.spec.template.metadata.labels,
      containers: apiDeployment.spec.template.spec.containers.map((c) => ({
        name: c.name,
        image: c.image,
        resources: {
          requests: {
            cpu: c.resources.requests.cpu_millicores,
            memory: c.resources.requests.memory_mb,
          },
          limits: {
            cpu: c.resources.limits.cpu_millicores,
            memory: c.resources.limits.memory_mb,
          },
        },
        ports: c.ports.map((p) => p.container_port),
      })),
    },
    status: statusMap[apiDeployment.status.available_replicas > 0 ? 'Available' : 'Progressing'] || 'Progressing',
    createdAt: apiDeployment.metadata.created_at ? new Date(apiDeployment.metadata.created_at).getTime() : Date.now(),
  };
}

// Convert API Service to frontend Service
export function convertService(apiService: ApiService): Service {
  const typeMap: Record<string, ServiceType> = {
    'ClusterIP': 'ClusterIP',
    'NodePort': 'NodePort',
    'LoadBalancer': 'LoadBalancer',
  };
  
  return {
    id: apiService.metadata.uid || apiService.metadata.name,
    name: apiService.metadata.name,
    namespace: apiService.metadata.namespace,
    type: typeMap[apiService.spec.type] || 'ClusterIP',
    selector: apiService.spec.selector,
    ports: apiService.spec.ports.map((p) => ({
      name: p.name,
      port: p.port,
      targetPort: typeof p.target_port === 'number' ? p.target_port : parseInt(p.target_port) || p.port,
      protocol: p.protocol as 'TCP' | 'UDP',
    })),
    clusterIP: apiService.spec.cluster_ip,
    nodePort: apiService.spec.ports.find((p) => p.node_port)?.node_port,
    loadBalancerIP: apiService.spec.load_balancer_ip,
  };
}

// Convert API ConfigMap to frontend ConfigMap
export function convertConfigMap(apiConfigMap: ApiConfigMap): ConfigMap {
  return {
    id: apiConfigMap.metadata.uid || apiConfigMap.metadata.name,
    name: apiConfigMap.metadata.name,
    namespace: apiConfigMap.metadata.namespace,
    data: apiConfigMap.data,
  };
}

// Convert API Secret to frontend Secret
export function convertSecret(apiSecret: ApiSecret): Secret {
  const typeMap: Record<string, Secret['type']> = {
    'Opaque': 'Opaque',
    'kubernetes.io/tls': 'kubernetes.io/tls',
    'kubernetes.io/dockerconfigjson': 'kubernetes.io/dockerconfigjson',
  };
  
  return {
    id: apiSecret.metadata.uid || apiSecret.metadata.name,
    name: apiSecret.metadata.name,
    namespace: apiSecret.metadata.namespace,
    type: typeMap[apiSecret.type] || 'Opaque',
    data: apiSecret.data,
  };
}

// Convert API HPA to frontend HPA
export function convertHPA(apiHPA: ApiHPA): HPA {
  return {
    id: apiHPA.metadata.uid || apiHPA.metadata.name,
    name: apiHPA.metadata.name,
    namespace: apiHPA.metadata.namespace,
    targetRef: {
      kind: 'Deployment',
      name: apiHPA.spec.scale_target_ref_name,
    },
    minReplicas: apiHPA.spec.min_replicas,
    maxReplicas: apiHPA.spec.max_replicas,
    metrics: apiHPA.spec.metrics.map((m) => ({
      type: m.resource_name as 'cpu' | 'memory' | 'custom',
      targetValue: m.target_value,
      currentValue: undefined,
    })),
    currentReplicas: apiHPA.status.current_replicas,
    desiredReplicas: apiHPA.status.desired_replicas,
  };
}

// Convert API Node to frontend Node
export function convertNode(apiNode: ApiNode): Node {
  const isReady = apiNode.status.conditions.some(
    (c) => c.type === 'Ready' && c.status === 'True'
  );
  
  return {
    id: apiNode.metadata.uid || apiNode.metadata.name,
    name: apiNode.metadata.name,
    role: apiNode.role as 'master' | 'worker',
    status: isReady ? 'Ready' : 'NotReady',
    capacity: {
      cpu: apiNode.status.capacity.cpu_millicores,
      memory: apiNode.status.capacity.memory_mb,
    },
    allocatable: {
      cpu: apiNode.status.allocatable.cpu_millicores,
      memory: apiNode.status.allocatable.memory_mb,
    },
    allocated: {
      cpu: apiNode.status.allocated.cpu_millicores,
      memory: apiNode.status.allocated.memory_mb,
    },
    pods: [],
    conditions: apiNode.status.conditions.map((c) => ({
      type: c.type as 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure',
      status: c.status === 'True',
    })),
  };
}

// Convert API Event to frontend Event
export function convertEvent(apiEvent: ApiClusterEvent): K8sEvent {
  return {
    id: apiEvent.id,
    timestamp: new Date(apiEvent.timestamp).getTime(),
    type: apiEvent.severity === 'error' ? 'Warning' : 'Normal',
    reason: apiEvent.type.split('.').pop() || 'Unknown',
    message: apiEvent.message,
    involvedObject: {
      kind: apiEvent.resource_type || 'Unknown',
      name: apiEvent.resource_name || 'Unknown',
      namespace: apiEvent.resource_namespace,
    },
  };
}

// Convert API Control Plane Component to frontend
export function convertControlPlaneComponent(apiComponent: ApiControlPlaneComponent): ControlPlaneComponent {
  return {
    name: apiComponent.name,
    status: apiComponent.status as 'Running' | 'Pending' | 'Failed',
    description: apiComponent.description,
  };
}

// Batch converters
export const convert = {
  pod: convertPod,
  pods: (pods: ApiPod[]) => pods.map(convertPod),
  deployment: convertDeployment,
  deployments: (deployments: ApiDeployment[]) => deployments.map(convertDeployment),
  service: convertService,
  services: (services: ApiService[]) => services.map(convertService),
  configMap: convertConfigMap,
  configMaps: (configMaps: ApiConfigMap[]) => configMaps.map(convertConfigMap),
  secret: convertSecret,
  secrets: (secrets: ApiSecret[]) => secrets.map(convertSecret),
  hpa: convertHPA,
  hpas: (hpas: ApiHPA[]) => hpas.map(convertHPA),
  node: convertNode,
  nodes: (nodes: ApiNode[]) => nodes.map(convertNode),
  event: convertEvent,
  events: (events: ApiClusterEvent[]) => events.map(convertEvent),
  controlPlane: (components: ApiControlPlaneComponent[]) => components.map(convertControlPlaneComponent),
};

export default convert;

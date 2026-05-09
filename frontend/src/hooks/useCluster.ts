// Cluster management hook - bridges API with local state

import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { config } from '../config';
import type {
  ApiCluster,
  ApiClusterConfig,
  ApiPod,
  ApiDeployment,
  ApiService,
  ApiConfigMap,
  ApiSecret,
  ApiHPA,
  ApiClusterEvent,
} from '../services/api.types';
import { useWebSocket } from './useWebSocket';

export interface ClusterState {
  cluster: ApiCluster | null;
  pods: ApiPod[];
  deployments: ApiDeployment[];
  services: ApiService[];
  configMaps: ApiConfigMap[];
  secrets: ApiSecret[];
  hpas: ApiHPA[];
  isLoading: boolean;
  error: string | null;
}

export interface UseClusterReturn extends ClusterState {
  // Connection
  isConnected: boolean;
  connectionStatus: string;
  events: ApiClusterEvent[];
  
  // Cluster operations
  createCluster: (config?: Partial<ApiClusterConfig>) => Promise<void>;
  refreshCluster: () => Promise<void>;
  deleteCluster: () => Promise<void>;
  resetCluster: () => Promise<void>;
  
  // Node operations
  addNode: (name?: string) => Promise<void>;
  removeNode: (nodeName: string) => Promise<void>;
  
  // Pod operations
  createPod: (name: string, image: string, namespace?: string, emitFlowEvents?: boolean) => Promise<void>;
  deletePod: (namespace: string, name: string) => Promise<void>;
  
  // Deployment operations
  createDeployment: (name: string, image: string, replicas: number, namespace?: string) => Promise<void>;
  scaleDeployment: (namespace: string, name: string, replicas: number) => Promise<void>;
  deleteDeployment: (namespace: string, name: string) => Promise<void>;
  
  // Service operations
  createService: (name: string, selector: Record<string, string>, port: number, type?: string, namespace?: string) => Promise<void>;
  deleteService: (namespace: string, name: string) => Promise<void>;
  
  // ConfigMap operations
  createConfigMap: (name: string, data: Record<string, string>, namespace?: string) => Promise<void>;
  deleteConfigMap: (namespace: string, name: string) => Promise<void>;
  
  // Secret operations
  createSecret: (name: string, data: Record<string, string>, namespace?: string) => Promise<void>;
  deleteSecret: (namespace: string, name: string) => Promise<void>;
  
  // HPA operations
  createHPA: (name: string, targetDeployment: string, minReplicas: number, maxReplicas: number, targetCPU: number, namespace?: string) => Promise<void>;
  simulateHPALoad: (namespace: string, name: string, cpuPercentage: number) => Promise<void>;
  deleteHPA: (namespace: string, name: string) => Promise<void>;
  
  // Quick actions
  quickDeployNginx: (replicas?: number) => Promise<void>;
  quickDeployFullStack: () => Promise<void>;
}

export function useCluster(): UseClusterReturn {
  const [state, setState] = useState<ClusterState>({
    cluster: null,
    pods: [],
    deployments: [],
    services: [],
    configMaps: [],
    secrets: [],
    hpas: [],
    isLoading: false,
    error: null,
  });

  const clusterId = state.cluster?.id || null;

  // WebSocket for real-time events
  const {
    status: connectionStatus,
    events,
    clearEvents,
  } = useWebSocket({
    clusterId,
    onEvent: handleEvent,
    includeHistory: true,
  });

  // Handle incoming WebSocket events
  function handleEvent(event: ApiClusterEvent) {
    // Refresh relevant resources based on event type
    if (event.type.startsWith('pod.')) {
      refreshPods();
    } else if (event.type.startsWith('deployment.')) {
      refreshDeployments();
      refreshPods();
    } else if (event.type.startsWith('service.')) {
      refreshServices();
    } else if (event.type.startsWith('node.')) {
      refreshCluster();
    } else if (event.type.startsWith('hpa.')) {
      refreshHPAs();
      refreshDeployments();
    } else if (event.type.startsWith('configmap.')) {
      refreshConfigMaps();
    } else if (event.type.startsWith('secret.')) {
      refreshSecrets();
    }
  }

  // Refresh functions
  const refreshPods = useCallback(async () => {
    if (!clusterId) return;
    try {
      const pods = await api.pod.list(clusterId);
      setState((s) => ({ ...s, pods }));
    } catch (e) {
      console.error('Failed to refresh pods:', e);
    }
  }, [clusterId]);

  const refreshDeployments = useCallback(async () => {
    if (!clusterId) return;
    try {
      const deployments = await api.deployment.list(clusterId);
      setState((s) => ({ ...s, deployments }));
    } catch (e) {
      console.error('Failed to refresh deployments:', e);
    }
  }, [clusterId]);

  const refreshServices = useCallback(async () => {
    if (!clusterId) return;
    try {
      const services = await api.service.list(clusterId);
      setState((s) => ({ ...s, services }));
    } catch (e) {
      console.error('Failed to refresh services:', e);
    }
  }, [clusterId]);

  const refreshConfigMaps = useCallback(async () => {
    if (!clusterId) return;
    try {
      const configMaps = await api.configMap.list(clusterId);
      setState((s) => ({ ...s, configMaps }));
    } catch (e) {
      console.error('Failed to refresh configMaps:', e);
    }
  }, [clusterId]);

  const refreshSecrets = useCallback(async () => {
    if (!clusterId) return;
    try {
      const secrets = await api.secret.list(clusterId);
      setState((s) => ({ ...s, secrets }));
    } catch (e) {
      console.error('Failed to refresh secrets:', e);
    }
  }, [clusterId]);

  const refreshHPAs = useCallback(async () => {
    if (!clusterId) return;
    try {
      const hpas = await api.hpa.list(clusterId);
      setState((s) => ({ ...s, hpas }));
    } catch (e) {
      console.error('Failed to refresh HPAs:', e);
    }
  }, [clusterId]);

  const refreshCluster = useCallback(async () => {
    if (!clusterId) return;
    try {
      const cluster = await api.cluster.get(clusterId);
      setState((s) => ({ ...s, cluster }));
    } catch (e) {
      console.error('Failed to refresh cluster:', e);
    }
  }, [clusterId]);

  const refreshAll = useCallback(async () => {
    if (!clusterId) return;
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const [cluster, pods, deployments, services, configMaps, secrets, hpas] = await Promise.all([
        api.cluster.get(clusterId),
        api.pod.list(clusterId),
        api.deployment.list(clusterId),
        api.service.list(clusterId),
        api.configMap.list(clusterId),
        api.secret.list(clusterId),
        api.hpa.list(clusterId),
      ]);
      setState({
        cluster,
        pods,
        deployments,
        services,
        configMaps,
        secrets,
        hpas,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to refresh cluster',
      }));
    }
  }, [clusterId]);

  // Cluster operations
  const createCluster = useCallback(async (clusterConfig?: Partial<ApiClusterConfig>) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const cluster = await api.cluster.create(clusterConfig);
      setState({
        cluster,
        pods: [],
        deployments: [],
        services: [],
        configMaps: [],
        secrets: [],
        hpas: [],
        isLoading: false,
        error: null,
      });
      clearEvents();
    } catch (e) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to create cluster',
      }));
    }
  }, [clearEvents]);

  const deleteCluster = useCallback(async () => {
    if (!clusterId) return;
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await api.cluster.delete(clusterId);
      setState({
        cluster: null,
        pods: [],
        deployments: [],
        services: [],
        configMaps: [],
        secrets: [],
        hpas: [],
        isLoading: false,
        error: null,
      });
      clearEvents();
    } catch (e) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to delete cluster',
      }));
    }
  }, [clusterId, clearEvents]);

  const resetCluster = useCallback(async () => {
    if (!clusterId) return;
    try {
      await api.cluster.reset(clusterId);
      await refreshAll();
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to reset cluster',
      }));
    }
  }, [clusterId, refreshAll]);

  // Node operations
  const addNode = useCallback(async (name?: string) => {
    if (!clusterId) return;
    try {
      await api.cluster.addNode(clusterId, name);
      await refreshCluster();
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to add node',
      }));
    }
  }, [clusterId, refreshCluster]);

  const removeNode = useCallback(async (nodeName: string) => {
    if (!clusterId) return;
    try {
      await api.cluster.removeNode(clusterId, nodeName);
      await refreshCluster();
      await refreshPods();
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to remove node',
      }));
    }
  }, [clusterId, refreshCluster, refreshPods]);

  // Pod operations
  const createPod = useCallback(async (
    name: string,
    image: string,
    namespace: string = 'default',
    emitFlowEvents: boolean = false
  ) => {
    if (!clusterId) return;
    try {
      await api.pod.create(clusterId, {
        metadata: {
          name,
          namespace,
          labels: { app: name },
          annotations: {},
        },
        spec: {
          containers: [{
            name: name,
            image,
            image_pull_policy: 'IfNotPresent',
            command: [],
            args: [],
            ports: [],
            env: [],
            resources: {
              requests: { cpu_millicores: 100, memory_mb: 128 },
              limits: { cpu_millicores: 200, memory_mb: 256 },
            },
            volume_mounts: [],
          }],
          init_containers: [],
          restart_policy: 'Always',
          node_selector: {},
          service_account_name: 'default',
          termination_grace_period_seconds: 30,
        },
      }, { emitFlowEvents });
      // WebSocket will trigger refresh
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create pod',
      }));
    }
  }, [clusterId]);

  const deletePod = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.pod.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete pod',
      }));
    }
  }, [clusterId]);

  // Deployment operations
  const createDeployment = useCallback(async (
    name: string,
    image: string,
    replicas: number,
    namespace: string = 'default'
  ) => {
    if (!clusterId) return;
    try {
      await api.deployment.create(clusterId, {
        metadata: {
          name,
          namespace,
          labels: { app: name },
          annotations: {},
        },
        spec: {
          replicas,
          selector: { match_labels: { app: name } },
          template: {
            metadata: {
              name,
              namespace,
              labels: { app: name },
              annotations: {},
            },
            spec: {
              containers: [{
                name,
                image,
                image_pull_policy: 'IfNotPresent',
                command: [],
                args: [],
                ports: [],
                env: [],
                resources: {
                  requests: { cpu_millicores: 100, memory_mb: 128 },
                  limits: { cpu_millicores: 200, memory_mb: 256 },
                },
                volume_mounts: [],
              }],
              init_containers: [],
              restart_policy: 'Always',
              node_selector: {},
              service_account_name: 'default',
              termination_grace_period_seconds: 30,
            },
          },
          strategy: 'RollingUpdate',
          min_ready_seconds: 0,
        },
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create deployment',
      }));
    }
  }, [clusterId]);

  const scaleDeployment = useCallback(async (namespace: string, name: string, replicas: number) => {
    if (!clusterId) return;
    try {
      await api.deployment.scale(clusterId, namespace, name, replicas);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to scale deployment',
      }));
    }
  }, [clusterId]);

  const deleteDeployment = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.deployment.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete deployment',
      }));
    }
  }, [clusterId]);

  // Service operations
  const createService = useCallback(async (
    name: string,
    selector: Record<string, string>,
    port: number,
    type: string = 'ClusterIP',
    namespace: string = 'default'
  ) => {
    if (!clusterId) return;
    try {
      await api.service.create(clusterId, {
        metadata: {
          name,
          namespace,
          labels: {},
          annotations: {},
        },
        spec: {
          type,
          selector,
          ports: [{ port, target_port: port, protocol: 'TCP' }],
          external_ips: [],
          session_affinity: 'None',
        },
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create service',
      }));
    }
  }, [clusterId]);

  const deleteService = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.service.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete service',
      }));
    }
  }, [clusterId]);

  // ConfigMap operations
  const createConfigMap = useCallback(async (
    name: string,
    data: Record<string, string>,
    namespace: string = 'default'
  ) => {
    if (!clusterId) return;
    try {
      await api.configMap.create(clusterId, {
        metadata: { name, namespace, labels: {}, annotations: {} },
        data,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create ConfigMap',
      }));
    }
  }, [clusterId]);

  const deleteConfigMap = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.configMap.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete ConfigMap',
      }));
    }
  }, [clusterId]);

  // Secret operations
  const createSecret = useCallback(async (
    name: string,
    data: Record<string, string>,
    namespace: string = 'default'
  ) => {
    if (!clusterId) return;
    try {
      await api.secret.create(clusterId, {
        metadata: { name, namespace, labels: {}, annotations: {} },
        data,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create Secret',
      }));
    }
  }, [clusterId]);

  const deleteSecret = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.secret.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete Secret',
      }));
    }
  }, [clusterId]);

  // HPA operations
  const createHPA = useCallback(async (
    name: string,
    targetDeployment: string,
    minReplicas: number,
    maxReplicas: number,
    targetCPU: number,
    namespace: string = 'default'
  ) => {
    if (!clusterId) return;
    try {
      await api.hpa.create(clusterId, {
        metadata: { name, namespace, labels: {}, annotations: {} },
        spec: {
          scale_target_ref_kind: 'Deployment',
          scale_target_ref_name: targetDeployment,
          min_replicas: minReplicas,
          max_replicas: maxReplicas,
          metrics: [{
            type: 'Resource',
            resource_name: 'cpu',
            target_type: 'Utilization',
            target_value: targetCPU,
          }],
        },
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to create HPA',
      }));
    }
  }, [clusterId]);

  const simulateHPALoad = useCallback(async (namespace: string, name: string, cpuPercentage: number) => {
    if (!clusterId) return;
    try {
      await api.hpa.simulateLoad(clusterId, namespace, name, cpuPercentage);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to simulate HPA load',
      }));
    }
  }, [clusterId]);

  const deleteHPA = useCallback(async (namespace: string, name: string) => {
    if (!clusterId) return;
    try {
      await api.hpa.delete(clusterId, namespace, name);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to delete HPA',
      }));
    }
  }, [clusterId]);

  // Quick actions
  const quickDeployNginx = useCallback(async (replicas: number = 3) => {
    if (!clusterId) return;
    try {
      await api.quickActions.deployNginx(clusterId, replicas, true);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to deploy nginx',
      }));
    }
  }, [clusterId]);

  const quickDeployFullStack = useCallback(async () => {
    if (!clusterId) return;
    try {
      await api.quickActions.deployFullStack(clusterId);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Failed to deploy full stack',
      }));
    }
  }, [clusterId]);

  // Auto-create cluster on mount if backend is enabled
  useEffect(() => {
    if (config.useBackend && !state.cluster && !state.isLoading) {
      createCluster();
    }
  }, []);

  return {
    ...state,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    events,
    createCluster,
    refreshCluster: refreshAll,
    deleteCluster,
    resetCluster,
    addNode,
    removeNode,
    createPod,
    deletePod,
    createDeployment,
    scaleDeployment,
    deleteDeployment,
    createService,
    deleteService,
    createConfigMap,
    deleteConfigMap,
    createSecret,
    deleteSecret,
    createHPA,
    simulateHPALoad,
    deleteHPA,
    quickDeployNginx,
    quickDeployFullStack,
  };
}

export default useCluster;

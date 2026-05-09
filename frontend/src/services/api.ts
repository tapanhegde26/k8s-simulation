// API Client for K8s Simulation Backend

import { config } from '../config';
import type {
  ApiCluster,
  ApiClusterSummary,
  ApiClusterConfig,
  ApiPod,
  ApiPodCreate,
  ApiDeployment,
  ApiDeploymentCreate,
  ApiService,
  ApiServiceCreate,
  ApiConfigMap,
  ApiConfigMapCreate,
  ApiSecret,
  ApiSecretCreate,
  ApiHPA,
  ApiHPACreate,
  ApiNode,
  ApiScenario,
  ApiScenarioSummary,
  ApiScenarioProgress,
} from './api.types';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {
      // Use default message
    }
    throw new ApiError(response.status, response.statusText, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// Cluster API
// ============================================================================

export const clusterApi = {
  async create(clusterConfig?: Partial<ApiClusterConfig>): Promise<ApiCluster> {
    return request<ApiCluster>('/api/v1/clusters', {
      method: 'POST',
      body: JSON.stringify(clusterConfig ? { config: clusterConfig } : {}),
    });
  },

  async list(): Promise<ApiClusterSummary[]> {
    return request<ApiClusterSummary[]>('/api/v1/clusters');
  },

  async get(clusterId: string): Promise<ApiCluster> {
    return request<ApiCluster>(`/api/v1/clusters/${clusterId}`);
  },

  async delete(clusterId: string): Promise<void> {
    return request<void>(`/api/v1/clusters/${clusterId}`, {
      method: 'DELETE',
    });
  },

  async addNode(clusterId: string, name?: string): Promise<ApiNode> {
    const params = name ? `?name=${encodeURIComponent(name)}` : '';
    return request<ApiNode>(`/api/v1/clusters/${clusterId}/nodes${params}`, {
      method: 'POST',
    });
  },

  async removeNode(clusterId: string, nodeName: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/nodes/${nodeName}`,
      { method: 'DELETE' }
    );
  },

  async reset(clusterId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/v1/clusters/${clusterId}/reset`, {
      method: 'POST',
    });
  },
};

// ============================================================================
// Pod API
// ============================================================================

export const podApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiPod[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiPod[]>(`/api/v1/clusters/${clusterId}/pods${params}`);
  },

  async get(clusterId: string, namespace: string, name: string): Promise<ApiPod> {
    return request<ApiPod>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/pods/${name}`
    );
  },

  async create(
    clusterId: string,
    pod: ApiPodCreate,
    options?: { emitFlowEvents?: boolean; speed?: number }
  ): Promise<ApiPod> {
    const params = new URLSearchParams();
    if (options?.emitFlowEvents) params.set('emit_flow_events', 'true');
    if (options?.speed) params.set('speed', options.speed.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return request<ApiPod>(`/api/v1/clusters/${clusterId}/pods${query}`, {
      method: 'POST',
      body: JSON.stringify(pod),
    });
  },

  async delete(clusterId: string, namespace: string, name: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/pods/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// Deployment API
// ============================================================================

export const deploymentApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiDeployment[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiDeployment[]>(`/api/v1/clusters/${clusterId}/deployments${params}`);
  },

  async create(clusterId: string, deployment: ApiDeploymentCreate): Promise<ApiDeployment> {
    return request<ApiDeployment>(`/api/v1/clusters/${clusterId}/deployments`, {
      method: 'POST',
      body: JSON.stringify(deployment),
    });
  },

  async scale(
    clusterId: string,
    namespace: string,
    name: string,
    replicas: number
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/deployments/${name}/scale?replicas=${replicas}`,
      { method: 'PATCH' }
    );
  },

  async delete(
    clusterId: string,
    namespace: string,
    name: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/deployments/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// Service API
// ============================================================================

export const serviceApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiService[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiService[]>(`/api/v1/clusters/${clusterId}/services${params}`);
  },

  async create(clusterId: string, service: ApiServiceCreate): Promise<ApiService> {
    return request<ApiService>(`/api/v1/clusters/${clusterId}/services`, {
      method: 'POST',
      body: JSON.stringify(service),
    });
  },

  async delete(
    clusterId: string,
    namespace: string,
    name: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/services/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// ConfigMap API
// ============================================================================

export const configMapApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiConfigMap[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiConfigMap[]>(`/api/v1/clusters/${clusterId}/configmaps${params}`);
  },

  async create(clusterId: string, configMap: ApiConfigMapCreate): Promise<ApiConfigMap> {
    return request<ApiConfigMap>(`/api/v1/clusters/${clusterId}/configmaps`, {
      method: 'POST',
      body: JSON.stringify(configMap),
    });
  },

  async delete(
    clusterId: string,
    namespace: string,
    name: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/configmaps/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// Secret API
// ============================================================================

export const secretApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiSecret[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiSecret[]>(`/api/v1/clusters/${clusterId}/secrets${params}`);
  },

  async create(clusterId: string, secret: ApiSecretCreate): Promise<ApiSecret> {
    return request<ApiSecret>(`/api/v1/clusters/${clusterId}/secrets`, {
      method: 'POST',
      body: JSON.stringify(secret),
    });
  },

  async delete(
    clusterId: string,
    namespace: string,
    name: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/secrets/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// HPA API
// ============================================================================

export const hpaApi = {
  async list(clusterId: string, namespace?: string): Promise<ApiHPA[]> {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return request<ApiHPA[]>(`/api/v1/clusters/${clusterId}/hpas${params}`);
  },

  async create(clusterId: string, hpa: ApiHPACreate): Promise<ApiHPA> {
    return request<ApiHPA>(`/api/v1/clusters/${clusterId}/hpas`, {
      method: 'POST',
      body: JSON.stringify(hpa),
    });
  },

  async simulateLoad(
    clusterId: string,
    namespace: string,
    name: string,
    cpuPercentage: number
  ): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/hpas/${name}/simulate-load?cpu_percentage=${cpuPercentage}`,
      { method: 'POST' }
    );
  },

  async delete(
    clusterId: string,
    namespace: string,
    name: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/v1/clusters/${clusterId}/namespaces/${namespace}/hpas/${name}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// Quick Actions API
// ============================================================================

export const quickActionsApi = {
  async deployNginx(
    clusterId: string,
    replicas: number = 3,
    withService: boolean = true
  ): Promise<{ deployment: ApiDeployment; service?: ApiService }> {
    return request<{ deployment: ApiDeployment; service?: ApiService }>(
      `/api/v1/clusters/${clusterId}/quick/nginx?replicas=${replicas}&with_service=${withService}`,
      { method: 'POST' }
    );
  },

  async deployFullStack(clusterId: string): Promise<{
    configmap: ApiConfigMap;
    secret: ApiSecret;
    deployment: ApiDeployment;
    service: ApiService;
  }> {
    return request(`/api/v1/clusters/${clusterId}/quick/full-stack`, {
      method: 'POST',
    });
  },
};

// ============================================================================
// Scenarios API
// ============================================================================

export const scenarioApi = {
  async list(difficulty?: string, concept?: string): Promise<ApiScenarioSummary[]> {
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (concept) params.set('concept', concept);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<ApiScenarioSummary[]>(`/api/v1/scenarios${query}`);
  },

  async get(scenarioId: string): Promise<ApiScenario> {
    return request<ApiScenario>(`/api/v1/scenarios/${scenarioId}`);
  },

  async start(clusterId: string, scenarioId: string): Promise<ApiScenarioProgress> {
    return request<ApiScenarioProgress>(
      `/api/v1/clusters/${clusterId}/scenarios/${scenarioId}/start`,
      { method: 'POST' }
    );
  },

  async getProgress(clusterId: string, scenarioId: string): Promise<ApiScenarioProgress> {
    return request<ApiScenarioProgress>(
      `/api/v1/clusters/${clusterId}/scenarios/${scenarioId}/progress`
    );
  },

  async validate(clusterId: string, scenarioId: string): Promise<{
    objectives: { id: string; title: string; completed: boolean }[];
    all_completed: boolean;
    progress: ApiScenarioProgress;
  }> {
    return request(
      `/api/v1/clusters/${clusterId}/scenarios/${scenarioId}/validate`,
      { method: 'POST' }
    );
  },

  async revealHint(
    clusterId: string,
    scenarioId: string,
    hintId: string
  ): Promise<{ hint: string }> {
    return request<{ hint: string }>(
      `/api/v1/clusters/${clusterId}/scenarios/${scenarioId}/hint/${hintId}`,
      { method: 'POST' }
    );
  },
};

// ============================================================================
// Health Check
// ============================================================================

export const healthApi = {
  async check(): Promise<{ status: string; environment: string }> {
    return request<{ status: string; environment: string }>('/health');
  },
};

// Export all APIs
export const api = {
  cluster: clusterApi,
  pod: podApi,
  deployment: deploymentApi,
  service: serviceApi,
  configMap: configMapApi,
  secret: secretApi,
  hpa: hpaApi,
  quickActions: quickActionsApi,
  scenario: scenarioApi,
  health: healthApi,
};

export { ApiError };
export default api;

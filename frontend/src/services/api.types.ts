// API Types - matches backend Pydantic schemas

export interface ApiClusterConfig {
  name: string;
  kubernetes_version: string;
  master_nodes: number;
  worker_nodes: number;
  node_cpu_millicores: number;
  node_memory_mb: number;
  max_pods_per_node: number;
  enable_hpa: boolean;
  enable_cluster_autoscaler: boolean;
  cluster_autoscaler_min_nodes: number;
  cluster_autoscaler_max_nodes: number;
}

export interface ApiClusterStats {
  total_pods: number;
  running_pods: number;
  pending_pods: number;
  failed_pods: number;
  total_deployments: number;
  total_services: number;
  total_nodes: number;
  ready_nodes: number;
  total_cpu_millicores: number;
  used_cpu_millicores: number;
  total_memory_mb: number;
  used_memory_mb: number;
}

export interface ApiControlPlaneComponent {
  name: string;
  status: string;
  health: string;
  description: string;
}

export interface ApiCluster {
  id: string;
  config: ApiClusterConfig;
  status: string;
  control_plane: ApiControlPlaneComponent[];
  nodes: ApiNode[];
  stats: ApiClusterStats;
  created_at: string;
  updated_at: string;
}

export interface ApiClusterSummary {
  id: string;
  name: string;
  status: string;
  kubernetes_version: string;
  node_count: number;
  pod_count: number;
  created_at: string;
}

export interface ApiObjectMeta {
  name: string;
  namespace: string;
  uid?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  created_at?: string;
}

export interface ApiResourceRequirements {
  cpu_millicores: number;
  memory_mb: number;
}

export interface ApiResourceLimits {
  requests: ApiResourceRequirements;
  limits: ApiResourceRequirements;
}

export interface ApiContainer {
  name: string;
  image: string;
  image_pull_policy: string;
  command: string[];
  args: string[];
  ports: { name?: string; container_port: number; protocol: string }[];
  env: { name: string; value?: string }[];
  resources: ApiResourceLimits;
  volume_mounts: { name: string; mount_path: string; read_only: boolean }[];
}

export interface ApiContainerStatus {
  name: string;
  ready: boolean;
  started: boolean;
  restart_count: number;
  state: string;
  image: string;
  container_id?: string;
}

export interface ApiPodSpec {
  containers: ApiContainer[];
  init_containers: ApiContainer[];
  restart_policy: string;
  node_selector: Record<string, string>;
  service_account_name: string;
  termination_grace_period_seconds: number;
}

export interface ApiPodStatus {
  phase: string;
  conditions: Record<string, unknown>[];
  host_ip?: string;
  pod_ip?: string;
  start_time?: string;
  container_statuses: ApiContainerStatus[];
  node_name?: string;
}

export interface ApiPod {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  spec: ApiPodSpec;
  status: ApiPodStatus;
}

export interface ApiPodCreate {
  metadata: ApiObjectMeta;
  spec: ApiPodSpec;
}

export interface ApiLabelSelector {
  match_labels: Record<string, string>;
}

export interface ApiDeploymentSpec {
  replicas: number;
  selector: ApiLabelSelector;
  template: ApiPodCreate;
  strategy: string;
  min_ready_seconds: number;
}

export interface ApiDeploymentStatus {
  replicas: number;
  ready_replicas: number;
  available_replicas: number;
  unavailable_replicas: number;
  updated_replicas: number;
  observed_generation: number;
  conditions: Record<string, unknown>[];
}

export interface ApiDeployment {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  spec: ApiDeploymentSpec;
  status: ApiDeploymentStatus;
}

export interface ApiDeploymentCreate {
  metadata: ApiObjectMeta;
  spec: ApiDeploymentSpec;
}

export interface ApiServicePort {
  name?: string;
  port: number;
  target_port: number | string;
  protocol: string;
  node_port?: number;
}

export interface ApiServiceSpec {
  type: string;
  selector: Record<string, string>;
  ports: ApiServicePort[];
  cluster_ip?: string;
  external_ips: string[];
  load_balancer_ip?: string;
  session_affinity: string;
}

export interface ApiServiceStatus {
  load_balancer_ingress: Record<string, unknown>[];
}

export interface ApiService {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  spec: ApiServiceSpec;
  status: ApiServiceStatus;
}

export interface ApiServiceCreate {
  metadata: ApiObjectMeta;
  spec: ApiServiceSpec;
}

export interface ApiConfigMap {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  data: Record<string, string>;
  binary_data: Record<string, string>;
}

export interface ApiConfigMapCreate {
  metadata: ApiObjectMeta;
  data: Record<string, string>;
  binary_data?: Record<string, string>;
}

export interface ApiSecret {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  type: string;
  data: Record<string, string>;
}

export interface ApiSecretCreate {
  metadata: ApiObjectMeta;
  type?: string;
  data: Record<string, string>;
  string_data?: Record<string, string>;
}

export interface ApiMetricSpec {
  type: string;
  resource_name: string;
  target_type: string;
  target_value: number;
}

export interface ApiHPASpec {
  scale_target_ref_kind: string;
  scale_target_ref_name: string;
  min_replicas: number;
  max_replicas: number;
  metrics: ApiMetricSpec[];
}

export interface ApiHPAStatus {
  current_replicas: number;
  desired_replicas: number;
  current_metrics: Record<string, unknown>[];
  last_scale_time?: string;
}

export interface ApiHPA {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  spec: ApiHPASpec;
  status: ApiHPAStatus;
}

export interface ApiHPACreate {
  metadata: ApiObjectMeta;
  spec: ApiHPASpec;
}

export interface ApiNodeCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

export interface ApiNodeResources {
  cpu_millicores: number;
  memory_mb: number;
  pods: number;
}

export interface ApiNodeStatus {
  conditions: ApiNodeCondition[];
  capacity: ApiNodeResources;
  allocatable: ApiNodeResources;
  allocated: ApiNodeResources;
  node_info: Record<string, string>;
  addresses: Record<string, unknown>[];
}

export interface ApiNode {
  api_version: string;
  kind: string;
  metadata: ApiObjectMeta;
  spec: { unschedulable: boolean };
  status: ApiNodeStatus;
  role: string;
}

// WebSocket Event Types
export interface ApiClusterEvent {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  cluster_id: string;
  resource_type?: string;
  resource_name?: string;
  resource_namespace?: string;
  message: string;
  details: Record<string, unknown>;
}

// Scenario Types
export interface ApiObjective {
  id: string;
  title: string;
  description: string;
  type: string;
  target: Record<string, unknown>;
  completed: boolean;
  order: number;
}

export interface ApiHint {
  id: string;
  text: string;
  reveal_after_seconds: number;
  revealed: boolean;
}

export interface ApiScenarioStory {
  character: string;
  role: string;
  situation: string;
  goal: string;
  success_message: string;
}

export interface ApiScenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  concepts: string[];
  objectives: ApiObjective[];
  hints: ApiHint[];
  story?: ApiScenarioStory;
  initial_state: Record<string, unknown>;
  created_at: string;
}

export interface ApiScenarioSummary {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  concepts: string[];
  objectives_count: number;
}

export interface ApiScenarioProgress {
  scenario_id: string;
  cluster_id: string;
  started_at: string;
  completed_at?: string;
  objectives_completed: string[];
  hints_revealed: string[];
  elapsed_seconds: number;
  is_completed: boolean;
}

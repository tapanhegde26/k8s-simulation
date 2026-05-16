// 3D Visualization Color Palette and Constants

export const colors = {
  // Base colors
  platform: '#1a1a2e',
  grid: '#16213e',
  
  // Node colors
  masterNode: '#326CE5', // K8s blue
  workerNode: '#4ade80', // Green
  nodeNotReady: '#ef4444', // Red
  
  // Pod phase colors
  podPending: '#fbbf24', // Yellow
  podCreating: '#f97316', // Orange
  podRunning: '#22c55e', // Green
  podFailed: '#ef4444', // Red
  podTerminating: '#6b7280', // Gray
  
  // Service colors
  serviceClusterIP: '#3b82f6', // Blue
  serviceNodePort: '#8b5cf6', // Purple
  serviceLoadBalancer: '#f59e0b', // Gold
  
  // Control plane
  apiServer: '#326CE5',
  etcd: '#f97316',
  scheduler: '#22c55e',
  controllerManager: '#8b5cf6',
  cloudController: '#94a3b8',
  
  // Effects
  glow: '#60a5fa',
  particle: '#38bdf8',
  selection: '#fbbf24',
};

export const podPhaseColors: Record<string, string> = {
  Pending: colors.podPending,
  ContainerCreating: colors.podCreating,
  Running: colors.podRunning,
  Failed: colors.podFailed,
  Terminating: colors.podTerminating,
  Succeeded: colors.podRunning,
  Unknown: colors.podTerminating,
};

export const serviceTypeColors: Record<string, string> = {
  ClusterIP: colors.serviceClusterIP,
  NodePort: colors.serviceNodePort,
  LoadBalancer: colors.serviceLoadBalancer,
};

export const controlPlaneColors: Record<string, string> = {
  'kube-apiserver': colors.apiServer,
  'etcd': colors.etcd,
  'kube-scheduler': colors.scheduler,
  'kube-controller-manager': colors.controllerManager,
  'cloud-controller-manager': colors.cloudController,
};

// Layout constants
export const layout = {
  nodeSpacing: 4,
  nodeBaseHeight: 0.5,
  podSize: 0.3,
  podSpacing: 0.4,
  controlPlaneRadius: 3,
  controlPlaneHeight: 2,
  platformRadius: 15,
};

// Node to Control Plane Communication Flow - Components and Flow Data

import type { NodeCPComponent, NodeCPStep, CommunicationPath } from './types';

export const nodeCPComponents: NodeCPComponent[] = [
  // Worker Node
  {
    id: 'kubelet',
    name: 'Kubelet',
    description: 'Node agent that registers node and manages pod lifecycle. Communicates with API server over HTTPS.',
    shape: 'octagon',
    color: '#22c55e',
    position: { x: 30, y: 65 },
    zone: 'worker-node',
  },
  {
    id: 'kube-proxy',
    name: 'kube-proxy',
    description: 'Network proxy that maintains network rules for Service abstraction.',
    shape: 'hexagon',
    color: '#3b82f6',
    position: { x: 110, y: 65 },
    zone: 'worker-node',
  },
  {
    id: 'pod',
    name: 'Pod',
    description: 'Application pod that can access API server via ServiceAccount token.',
    shape: 'hexagon',
    color: '#8b5cf6',
    position: { x: 70, y: 140 },
    zone: 'worker-node',
  },
  {
    id: 'service-account',
    name: 'SA Token',
    description: 'ServiceAccount token auto-injected into pods for API authentication.',
    shape: 'key',
    color: '#f59e0b',
    position: { x: 30, y: 210 },
    zone: 'worker-node',
  },
  {
    id: 'konnectivity-agent',
    name: 'Konnectivity',
    description: 'Konnectivity agent maintains tunnel to control plane for reverse connections.',
    shape: 'diamond',
    color: '#ec4899',
    position: { x: 115, y: 210 },
    zone: 'worker-node',
  },

  // Control Plane
  {
    id: 'api-server',
    name: 'API Server',
    description: 'Central hub for all cluster communication. Exposes HTTPS on port 443.',
    shape: 'octagon',
    color: '#f59e0b',
    position: { x: 280, y: 65 },
    zone: 'control-plane',
  },
  {
    id: 'etcd',
    name: 'etcd',
    description: 'Distributed key-value store. Only API server communicates with etcd.',
    shape: 'cylinder',
    color: '#64748b',
    position: { x: 360, y: 65 },
    zone: 'control-plane',
  },
  {
    id: 'controller-manager',
    name: 'Controller',
    description: 'Controller Manager runs control loops. Communicates with API server.',
    shape: 'square',
    color: '#14b8a6',
    position: { x: 280, y: 140 },
    zone: 'control-plane',
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    description: 'Assigns pods to nodes. Watches API server for unscheduled pods.',
    shape: 'square',
    color: '#6366f1',
    position: { x: 360, y: 140 },
    zone: 'control-plane',
  },
  {
    id: 'konnectivity-server',
    name: 'Konnectivity',
    description: 'Konnectivity server in control plane. Proxies traffic to nodes.',
    shape: 'diamond',
    color: '#ec4899',
    position: { x: 320, y: 210 },
    zone: 'control-plane',
  },

  // PKI
  {
    id: 'root-ca',
    name: 'Cluster CA',
    description: 'Root CA certificate. Nodes use this to verify API server identity.',
    shape: 'shield',
    color: '#ef4444',
    position: { x: 195, y: 140 },
    zone: 'pki',
  },
];

export const nodeCPSteps: NodeCPStep[] = [
  {
    id: 'step1',
    from: 'kubelet',
    to: 'root-ca',
    label: '1. TLS Bootstrap',
    description: 'Kubelet is provisioned with cluster CA certificate for secure communication.',
    duration: 1500,
    commType: 'secure',
    packetLabel: 'CA',
    details: [
      'Node provisioned with cluster root CA',
      'CA cert stored at /etc/kubernetes/pki/',
      'Used to verify API server identity',
      'Enables TLS certificate validation',
    ],
  },
  {
    id: 'step2',
    from: 'kubelet',
    to: 'api-server',
    label: '2. Node Registration',
    description: 'Kubelet registers node with API server using client certificate.',
    duration: 1500,
    commType: 'node-to-cp',
    packetLabel: 'HTTPS',
    details: [
      'Kubelet connects to API server:443',
      'Presents client certificate for auth',
      'TLS bootstrapping for auto cert rotation',
      'Node object created in cluster',
    ],
  },
  {
    id: 'step3',
    from: 'api-server',
    to: 'etcd',
    label: '3. Store Node Info',
    description: 'API server stores node registration in etcd.',
    duration: 1200,
    commType: 'internal',
    packetLabel: 'STORE',
    details: [
      'Node spec stored in etcd',
      'Only API server talks to etcd',
      'etcd communication is mTLS secured',
      'Node now visible in cluster',
    ],
  },
  {
    id: 'step4',
    from: 'kube-proxy',
    to: 'api-server',
    label: '4. Watch Services',
    description: 'kube-proxy watches API server for Service and Endpoint changes.',
    duration: 1200,
    commType: 'node-to-cp',
    packetLabel: 'WATCH',
    details: [
      'Establishes watch on Services',
      'Watches Endpoints/EndpointSlices',
      'Uses ServiceAccount token for auth',
      'Updates iptables/IPVS rules',
    ],
  },
  {
    id: 'step5',
    from: 'controller-manager',
    to: 'api-server',
    label: '5. Control Loops',
    description: 'Controller Manager watches and updates resources via API server.',
    duration: 1200,
    commType: 'internal',
    packetLabel: 'WATCH',
    details: [
      'Runs on control plane node',
      'Watches for resource changes',
      'Reconciles desired vs actual state',
      'Communicates over localhost or HTTPS',
    ],
  },
  {
    id: 'step6',
    from: 'scheduler',
    to: 'api-server',
    label: '6. Pod Scheduling',
    description: 'Scheduler watches for unscheduled pods and assigns them to nodes.',
    duration: 1200,
    commType: 'internal',
    packetLabel: 'BIND',
    details: [
      'Watches for pods with no nodeName',
      'Evaluates node resources & constraints',
      'Updates pod.spec.nodeName',
      'Kubelet picks up scheduled pods',
    ],
  },
  {
    id: 'step7',
    from: 'service-account',
    to: 'pod',
    label: '7. Inject SA Token',
    description: 'ServiceAccount token and CA cert auto-injected into pod.',
    duration: 1200,
    commType: 'secure',
    packetLabel: 'TOKEN',
    details: [
      'Token mounted at /var/run/secrets/',
      'CA cert for API server verification',
      'Namespace info included',
      'Enables pod → API server auth',
    ],
  },
  {
    id: 'step8',
    from: 'pod',
    to: 'api-server',
    label: '8. Pod API Access',
    description: 'Pod accesses API server using injected ServiceAccount token.',
    duration: 1500,
    commType: 'node-to-cp',
    packetLabel: 'HTTPS',
    details: [
      'Connects to kubernetes.default.svc',
      'Virtual IP redirected by kube-proxy',
      'Bearer token in Authorization header',
      'RBAC determines allowed operations',
    ],
  },
  {
    id: 'step9',
    from: 'api-server',
    to: 'kubelet',
    label: '9. Logs/Exec Request',
    description: 'API server connects to kubelet for logs, exec, and port-forward.',
    duration: 1500,
    commType: 'cp-to-node',
    packetLabel: 'EXEC',
    details: [
      'kubectl logs → API server → kubelet',
      'kubectl exec → API server → kubelet',
      'Port-forward through kubelet',
      'Kubelet HTTPS endpoint (10250)',
    ],
  },
  {
    id: 'step10',
    from: 'konnectivity-agent',
    to: 'konnectivity-server',
    label: '10. Establish Tunnel',
    description: 'Konnectivity agent establishes outbound tunnel to control plane.',
    duration: 1500,
    commType: 'tunnel',
    packetLabel: 'TUNNEL',
    details: [
      'Agent initiates connection (outbound)',
      'Maintains persistent tunnel',
      'Replaces deprecated SSH tunnels',
      'Enables CP→Node without direct access',
    ],
  },
  {
    id: 'step11',
    from: 'api-server',
    to: 'konnectivity-server',
    label: '11. Proxy via Tunnel',
    description: 'API server uses Konnectivity to reach nodes in private networks.',
    duration: 1200,
    commType: 'tunnel',
    packetLabel: 'PROXY',
    details: [
      'API server sends request to Konnectivity',
      'Server routes through agent tunnel',
      'Reaches kubelet/pods/services',
      'Secure even on untrusted networks',
    ],
  },
  {
    id: 'step12',
    from: 'konnectivity-server',
    to: 'kubelet',
    label: '12. Tunneled Request',
    description: 'Request delivered to kubelet through Konnectivity tunnel.',
    duration: 1500,
    commType: 'tunnel',
    packetLabel: 'DELIVER',
    details: [
      'Request exits via Konnectivity agent',
      'Delivered to kubelet locally',
      'Response returns through tunnel',
      'Full bidirectional communication ✓',
    ],
  },
];

export function getComponentById(id: string): NodeCPComponent | undefined {
  return nodeCPComponents.find(c => c.id === id);
}

export const communicationPaths: CommunicationPath[] = [
  {
    name: 'Node → API Server',
    direction: 'Outbound',
    security: 'HTTPS + Client Cert',
    purpose: 'Registration, status updates, watch',
  },
  {
    name: 'Pod → API Server',
    direction: 'Outbound',
    security: 'HTTPS + SA Token',
    purpose: 'API access via kubernetes.default.svc',
  },
  {
    name: 'API Server → Kubelet',
    direction: 'Inbound',
    security: 'HTTPS (verify optional)',
    purpose: 'Logs, exec, port-forward',
  },
  {
    name: 'Konnectivity Tunnel',
    direction: 'Agent-initiated',
    security: 'TLS tunnel',
    purpose: 'CP→Node on private networks',
  },
];

export const securityNotes = [
  'Hub-and-spoke: All traffic goes through API server',
  'Nodes must have cluster CA for TLS verification',
  'Kubelet uses client certificates (auto-rotated)',
  'Pods use ServiceAccount tokens (projected)',
  'Control plane components use secure port',
  'Konnectivity replaces deprecated SSH tunnels',
];

export const configYaml = `# Kubelet configuration for secure API access
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.crt
  webhook:
    enabled: true
authorization:
  mode: Webhook
---
# Konnectivity server configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: konnectivity-server-config
data:
  config.yaml: |
    apiVersion: proxy.konnectivity.io/v1alpha1
    kind: ProxyConfiguration
    serverCount: 1
    mode: grpc`;

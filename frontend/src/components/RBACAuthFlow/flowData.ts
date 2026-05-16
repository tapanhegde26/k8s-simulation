// RBAC Authorization Flow - Components and Flow Data

import type { RBACComponent, RBACStep, Role } from './types';

export const rbacComponents: RBACComponent[] = [
  // Client Zone
  {
    id: 'user',
    name: 'User',
    description: 'Human user (developer/admin) making requests to the cluster via kubectl or API.',
    shape: 'user',
    color: '#3b82f6',
    position: { x: 30, y: 55 },
    zone: 'client',
  },
  {
    id: 'service-account',
    name: 'SvcAccount',
    description: 'Pod identity used for in-cluster authentication. Automatically mounted in pods.',
    shape: 'hexagon',
    color: '#22c55e',
    position: { x: 30, y: 140 },
    zone: 'client',
  },
  {
    id: 'kubectl',
    name: 'kubectl',
    description: 'CLI tool that sends authenticated requests to the Kubernetes API server.',
    shape: 'rectangle',
    color: '#8b5cf6',
    position: { x: 100, y: 100 },
    zone: 'client',
  },

  // API Layer
  {
    id: 'api-server',
    name: 'API Server',
    description: 'Kubernetes API server - the front door to the cluster. Handles all API requests.',
    shape: 'octagon',
    color: '#f59e0b',
    position: { x: 210, y: 100 },
    zone: 'api-layer',
  },
  {
    id: 'authenticator',
    name: 'AuthN',
    description: 'Validates identity: certificates, tokens, OIDC. Answers "Who are you?"',
    shape: 'key',
    color: '#ec4899',
    position: { x: 300, y: 55 },
    zone: 'api-layer',
  },
  {
    id: 'authorizer',
    name: 'AuthZ',
    description: 'Checks permissions using RBAC rules. Answers "Can you do this?"',
    shape: 'lock',
    color: '#14b8a6',
    position: { x: 305, y: 135 },
    zone: 'api-layer',
  },
  {
    id: 'admission-controller',
    name: 'Admission',
    description: 'Final validation and mutation. Webhooks, PodSecurity, ResourceQuota.',
    shape: 'diamond',
    color: '#6366f1',
    position: { x: 400, y: 100 },
    zone: 'api-layer',
  },

  // RBAC Layer
  {
    id: 'role',
    name: 'Role',
    description: 'Namespaced permissions. Defines what actions are allowed on which resources.',
    shape: 'rectangle',
    color: '#22c55e',
    position: { x: 200, y: 220 },
    zone: 'rbac-layer',
  },
  {
    id: 'cluster-role',
    name: 'ClusterRole',
    description: 'Cluster-wide permissions. Can grant access to cluster-scoped resources.',
    shape: 'rectangle',
    color: '#f97316',
    position: { x: 290, y: 220 },
    zone: 'rbac-layer',
  },
  {
    id: 'role-binding',
    name: 'Binding',
    description: 'Binds a Role to users/groups/ServiceAccounts within a namespace.',
    shape: 'diamond',
    color: '#a855f7',
    position: { x: 390, y: 220 },
    zone: 'rbac-layer',
  },
  {
    id: 'cluster-role-binding',
    name: 'ClusterBinding',
    description: 'Binds a ClusterRole to subjects cluster-wide.',
    shape: 'diamond',
    color: '#ef4444',
    position: { x: 470, y: 220 },
    zone: 'rbac-layer',
  },

  // Storage
  {
    id: 'etcd',
    name: 'etcd',
    description: 'Distributed key-value store. Stores all cluster state including RBAC objects.',
    shape: 'hexagon',
    color: '#64748b',
    position: { x: 490, y: 100 },
    zone: 'storage',
  },
];

export const rbacSteps: RBACStep[] = [
  {
    id: 'step1',
    from: 'user',
    to: 'kubectl',
    label: '1. User Request',
    description: 'User runs: kubectl get pods -n production',
    duration: 1500,
    requestType: 'auth',
    packetLabel: 'GET pods',
    details: [
      'User: developer@company.com',
      'Command: kubectl get pods',
      'Namespace: production',
      'kubeconfig loaded with credentials',
    ],
  },
  {
    id: 'step2',
    from: 'kubectl',
    to: 'api-server',
    label: '2. API Request',
    description: 'kubectl sends authenticated HTTPS request to API server with bearer token.',
    duration: 1200,
    requestType: 'auth',
    packetLabel: 'HTTPS',
    details: [
      'GET /api/v1/namespaces/production/pods',
      'Authorization: Bearer <token>',
      'TLS client certificate attached',
      'Request reaches API server',
    ],
  },
  {
    id: 'step3',
    from: 'api-server',
    to: 'authenticator',
    label: '3. Authentication',
    description: 'API server validates the identity. "Who are you?"',
    duration: 1500,
    requestType: 'auth',
    packetLabel: 'WHO?',
    details: [
      'Token validation (JWT/ServiceAccount)',
      'Certificate CN extraction',
      'OIDC token verification',
      'Identity: developer@company.com',
    ],
  },
  {
    id: 'step4',
    from: 'authenticator',
    to: 'api-server',
    label: '4. Identity Confirmed',
    description: 'Authenticator returns user info: username, UID, groups.',
    duration: 1200,
    requestType: 'allowed',
    packetLabel: 'OK',
    details: [
      'Username: developer@company.com',
      'Groups: [developers, team-a]',
      'UID: abc-123-def',
      'Authentication successful ✓',
    ],
  },
  {
    id: 'step5',
    from: 'api-server',
    to: 'authorizer',
    label: '5. Authorization Check',
    description: 'API server asks RBAC: "Can this user GET pods in production?"',
    duration: 1500,
    requestType: 'lookup',
    packetLabel: 'CAN?',
    details: [
      'Subject: developer@company.com',
      'Verb: get, list',
      'Resource: pods',
      'Namespace: production',
    ],
  },
  {
    id: 'step6',
    from: 'authorizer',
    to: 'role-binding',
    label: '6. Find RoleBinding',
    description: 'RBAC looks for RoleBindings that match the user/group in this namespace.',
    duration: 1200,
    requestType: 'lookup',
    details: [
      'Searching RoleBindings in production',
      'Match: developer-binding',
      'Subjects: group:developers',
      'RoleRef: pod-reader',
    ],
  },
  {
    id: 'step7',
    from: 'role-binding',
    to: 'role',
    label: '7. Lookup Role',
    description: 'RoleBinding references a Role. Fetch the Role to check permissions.',
    duration: 1200,
    requestType: 'lookup',
    details: [
      'Role: pod-reader',
      'Namespace: production',
      'Fetching role rules...',
    ],
  },
  {
    id: 'step8',
    from: 'role',
    to: 'authorizer',
    label: '8. Check Rules',
    description: 'Role rules checked: apiGroups, resources, verbs.',
    duration: 1500,
    requestType: 'allowed',
    packetLabel: 'MATCH',
    details: [
      'Rule: apiGroups: [""]',
      'resources: ["pods"]',
      'verbs: ["get", "list", "watch"]',
      'Permission GRANTED ✓',
    ],
  },
  {
    id: 'step9',
    from: 'authorizer',
    to: 'api-server',
    label: '9. Authorization OK',
    description: 'RBAC authorizer returns: allowed=true',
    duration: 1200,
    requestType: 'allowed',
    packetLabel: 'ALLOW',
    details: [
      'Decision: allow',
      'Reason: RBAC rule matched',
      'Role: pod-reader',
      'Proceeding to admission...',
    ],
  },
  {
    id: 'step10',
    from: 'api-server',
    to: 'admission-controller',
    label: '10. Admission Control',
    description: 'Final checks: webhooks, resource quotas, pod security.',
    duration: 1200,
    requestType: 'lookup',
    packetLabel: 'ADMIT?',
    details: [
      'ValidatingWebhook: passed',
      'ResourceQuota: not exceeded',
      'PodSecurity: N/A (read request)',
      'Admission approved ✓',
    ],
  },
  {
    id: 'step11',
    from: 'admission-controller',
    to: 'etcd',
    label: '11. Fetch from etcd',
    description: 'Request approved. API server fetches pod data from etcd.',
    duration: 1200,
    requestType: 'lookup',
    details: [
      'Key: /registry/pods/production/*',
      'Consistent read from etcd',
      'Pods found: 5',
      'Returning to client...',
    ],
  },
  {
    id: 'step12',
    from: 'etcd',
    to: 'user',
    label: '12. Response',
    description: 'Pod list returned to user. Request complete!',
    duration: 1500,
    requestType: 'allowed',
    packetLabel: 'PODS',
    details: [
      'HTTP 200 OK',
      'Content-Type: application/json',
      '5 pods returned',
      'Request latency: 45ms',
    ],
  },
];

export function getComponentById(id: string): RBACComponent | undefined {
  return rbacComponents.find(c => c.id === id);
}

export const sampleRoles: Role[] = [
  {
    name: 'pod-reader',
    namespace: 'production',
    rules: [
      {
        apiGroups: [''],
        resources: ['pods', 'pods/log'],
        verbs: ['get', 'list', 'watch'],
      },
    ],
  },
  {
    name: 'deployment-manager',
    namespace: 'production',
    rules: [
      {
        apiGroups: ['apps'],
        resources: ['deployments'],
        verbs: ['get', 'list', 'create', 'update', 'delete'],
      },
    ],
  },
];

export const rbacYaml = `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: production
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`;

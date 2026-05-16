// Network Policy Enforcement Flow - Components and Flow Data

import type { NetworkPolicyComponent, NetworkPolicyStep, PolicyRule } from './types';

export const networkPolicyComponents: NetworkPolicyComponent[] = [
  // Frontend Tier
  {
    id: 'pod-frontend',
    name: 'Frontend',
    description: 'Web frontend pod serving user requests. Needs to communicate with backend API.',
    shape: 'hexagon',
    color: '#3b82f6',
    position: { x: 35, y: 70 },
    zone: 'frontend-tier',
    labels: { app: 'frontend', tier: 'web' },
    ipAddress: '10.244.1.10',
  },

  // Backend Tier
  {
    id: 'pod-backend',
    name: 'Backend',
    description: 'API backend pod. Accepts traffic from frontend, connects to database.',
    shape: 'hexagon',
    color: '#22c55e',
    position: { x: 135, y: 70 },
    zone: 'backend-tier',
    labels: { app: 'backend', tier: 'api' },
    ipAddress: '10.244.1.20',
  },
  {
    id: 'netpol-backend',
    name: 'NetPolicy',
    description: 'Network Policy protecting backend. Only allows ingress from frontend pods.',
    shape: 'shield',
    color: '#f59e0b',
    position: { x: 215, y: 70 },
    zone: 'backend-tier',
  },

  // Database Tier
  {
    id: 'pod-database',
    name: 'Database',
    description: 'PostgreSQL database pod. Only backend pods should access it.',
    shape: 'hexagon',
    color: '#8b5cf6',
    position: { x: 305, y: 70 },
    zone: 'database-tier',
    labels: { app: 'postgres', tier: 'db' },
    ipAddress: '10.244.2.30',
  },
  {
    id: 'netpol-database',
    name: 'NetPolicy',
    description: 'Network Policy protecting database. Only allows ingress from backend pods on port 5432.',
    shape: 'shield',
    color: '#f59e0b',
    position: { x: 385, y: 70 },
    zone: 'database-tier',
  },

  // Attacker Zone
  {
    id: 'pod-attacker',
    name: 'Attacker',
    description: 'Malicious pod trying to access database directly, bypassing backend.',
    shape: 'hexagon',
    color: '#ef4444',
    position: { x: 475, y: 70 },
    zone: 'attacker-zone',
    labels: { app: 'unknown' },
    ipAddress: '10.244.3.99',
  },

  // Control Plane
  {
    id: 'policy-controller',
    name: 'Controller',
    description: 'CNI policy controller (Calico/Cilium) that watches NetworkPolicy resources and programs rules.',
    shape: 'diamond',
    color: '#ec4899',
    position: { x: 175, y: 200 },
    zone: 'control-plane',
  },
  {
    id: 'cni-plugin',
    name: 'CNI',
    description: 'Container Network Interface plugin that enforces network policies using iptables/eBPF.',
    shape: 'octagon',
    color: '#14b8a6',
    position: { x: 290, y: 200 },
    zone: 'control-plane',
  },
  {
    id: 'iptables-node1',
    name: 'iptables',
    description: 'Linux iptables/nftables rules on Node 1 enforcing network policies.',
    shape: 'firewall',
    color: '#6366f1',
    position: { x: 395, y: 205 },
    zone: 'control-plane',
  },
  {
    id: 'iptables-node2',
    name: 'iptables',
    description: 'Linux iptables/nftables rules on Node 2 enforcing network policies.',
    shape: 'firewall',
    color: '#6366f1',
    position: { x: 510, y: 205 },
    zone: 'control-plane',
  },
];

export const networkPolicySteps: NetworkPolicyStep[] = [
  {
    id: 'step1',
    from: 'policy-controller',
    to: 'cni-plugin',
    label: '1. Policy Sync',
    description: 'Policy controller watches NetworkPolicy resources and syncs rules to CNI plugin.',
    duration: 1500,
    trafficType: 'policy-sync',
    details: [
      'Controller watches API server for NetworkPolicy',
      'Parses podSelector and ingress/egress rules',
      'Translates to CNI-specific format',
      'Pushes rules to CNI plugin',
    ],
  },
  {
    id: 'step2',
    from: 'cni-plugin',
    to: 'iptables-node1',
    label: '2. Program iptables',
    description: 'CNI plugin programs iptables/eBPF rules on each node to enforce policies.',
    duration: 1200,
    trafficType: 'policy-sync',
    details: [
      'CNI creates iptables chains for policies',
      'Rules match on pod IPs and labels',
      'ACCEPT rules for allowed traffic',
      'DROP rules for denied traffic',
    ],
  },
  {
    id: 'step3',
    from: 'cni-plugin',
    to: 'iptables-node2',
    label: '3. Sync to Node 2',
    description: 'Rules are also programmed on Node 2 where database pod runs.',
    duration: 1200,
    trafficType: 'policy-sync',
    details: [
      'Same rules applied to all relevant nodes',
      'Pod CIDR ranges used for matching',
      'Rules updated when pods scale',
      'Ensures consistent enforcement',
    ],
  },
  {
    id: 'step4',
    from: 'pod-frontend',
    to: 'netpol-backend',
    label: '4. Frontend → Backend',
    description: 'Frontend pod initiates connection to backend API on port 8080.',
    duration: 1500,
    trafficType: 'evaluation',
    packetLabel: 'TCP:8080',
    details: [
      'Source: 10.244.1.10 (frontend)',
      'Dest: 10.244.1.20:8080 (backend)',
      'NetworkPolicy evaluated at backend',
      'Checking ingress rules...',
    ],
  },
  {
    id: 'step5',
    from: 'netpol-backend',
    to: 'pod-backend',
    label: '5. Policy: ALLOW',
    description: 'NetworkPolicy allows traffic from pods with label app=frontend.',
    duration: 1200,
    trafficType: 'allowed',
    packetLabel: 'ALLOW',
    details: [
      'podSelector: app=frontend ✓',
      'Port 8080 allowed ✓',
      'Ingress rule matched',
      'Traffic permitted to backend',
    ],
  },
  {
    id: 'step6',
    from: 'pod-backend',
    to: 'netpol-database',
    label: '6. Backend → Database',
    description: 'Backend pod connects to database on port 5432.',
    duration: 1500,
    trafficType: 'evaluation',
    packetLabel: 'TCP:5432',
    details: [
      'Source: 10.244.1.20 (backend)',
      'Dest: 10.244.2.30:5432 (postgres)',
      'NetworkPolicy evaluated at database',
      'Checking ingress rules...',
    ],
  },
  {
    id: 'step7',
    from: 'netpol-database',
    to: 'pod-database',
    label: '7. Policy: ALLOW',
    description: 'NetworkPolicy allows traffic from pods with label app=backend on port 5432.',
    duration: 1200,
    trafficType: 'allowed',
    packetLabel: 'ALLOW',
    details: [
      'podSelector: app=backend ✓',
      'Port 5432 allowed ✓',
      'Ingress rule matched',
      'Database connection established',
    ],
  },
  {
    id: 'step8',
    from: 'pod-attacker',
    to: 'netpol-database',
    label: '8. Attacker → Database',
    description: 'Malicious pod attempts direct connection to database, bypassing backend.',
    duration: 1500,
    trafficType: 'evaluation',
    packetLabel: 'TCP:5432',
    details: [
      'Source: 10.244.3.99 (attacker)',
      'Dest: 10.244.2.30:5432 (postgres)',
      'NetworkPolicy evaluated at database',
      'Checking ingress rules...',
    ],
  },
  {
    id: 'step9',
    from: 'netpol-database',
    to: 'iptables-node2',
    label: '9. Policy: DENY',
    description: 'NetworkPolicy blocks traffic - attacker pod labels don\'t match allowed selectors.',
    duration: 1500,
    trafficType: 'denied',
    packetLabel: 'DENY',
    details: [
      'podSelector: app=backend ✗',
      'Source pod label: app=unknown',
      'No matching ingress rule',
      'Traffic DROPPED by iptables',
    ],
  },
  {
    id: 'step10',
    from: 'pod-attacker',
    to: 'netpol-backend',
    label: '10. Attacker → Backend',
    description: 'Attacker also tries to access backend directly.',
    duration: 1500,
    trafficType: 'evaluation',
    packetLabel: 'TCP:8080',
    details: [
      'Source: 10.244.3.99 (attacker)',
      'Dest: 10.244.1.20:8080 (backend)',
      'NetworkPolicy evaluated at backend',
      'Checking ingress rules...',
    ],
  },
  {
    id: 'step11',
    from: 'netpol-backend',
    to: 'iptables-node1',
    label: '11. Policy: DENY',
    description: 'Backend NetworkPolicy also blocks attacker - only frontend pods allowed.',
    duration: 1500,
    trafficType: 'denied',
    packetLabel: 'DENY',
    details: [
      'podSelector: app=frontend ✗',
      'Source pod label: app=unknown',
      'No matching ingress rule',
      'Traffic DROPPED by iptables',
    ],
  },
  {
    id: 'step12',
    from: 'iptables-node1',
    to: 'pod-frontend',
    label: '12. Legitimate Flow Only',
    description: 'Only legitimate traffic flows: Frontend → Backend → Database. Attacker blocked.',
    duration: 1500,
    trafficType: 'allowed',
    packetLabel: 'SECURE',
    details: [
      'Zero-trust network model enforced',
      'Lateral movement prevented',
      'Only explicit allows permitted',
      'Default deny for unlisted traffic',
    ],
  },
];

export function getComponentById(id: string): NetworkPolicyComponent | undefined {
  return networkPolicyComponents.find(c => c.id === id);
}

export const policyRules: PolicyRule[] = [
  {
    name: 'backend-policy',
    podSelector: 'app=backend',
    ingress: [
      {
        from: 'app=frontend',
        ports: ['8080/TCP'],
      },
    ],
  },
  {
    name: 'database-policy',
    podSelector: 'app=postgres',
    ingress: [
      {
        from: 'app=backend',
        ports: ['5432/TCP'],
      },
    ],
  },
];

export const networkPolicyYaml = `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 5432`;

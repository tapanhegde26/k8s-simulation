// Ingress Traffic Flow - Components and Flow Data

import type { IngressComponent, IngressStep, IngressRule } from './types';

export const ingressComponents: IngressComponent[] = [
  // External Zone
  {
    id: 'client',
    name: 'Client',
    description: 'External user or application making HTTP/HTTPS requests to your application from the internet.',
    shape: 'circle',
    color: '#64748b',
    position: { x: 50, y: 180 },
    zone: 'external',
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Public internet - traffic enters through DNS resolution to the Load Balancer IP.',
    shape: 'cloud',
    color: '#94a3b8',
    position: { x: 50, y: 60 },
    zone: 'external',
    hostname: 'myapp.example.com',
  },

  // Cloud Provider Zone
  {
    id: 'cloud-lb',
    name: 'Cloud LB',
    description: 'Cloud provider Load Balancer (AWS ALB/NLB, GCP LB, Azure LB). Provisioned automatically when Ingress is created.',
    shape: 'hexagon',
    color: '#f59e0b',
    position: { x: 180, y: 120 },
    zone: 'cloud-provider',
    ipAddress: '203.0.113.50',
    port: 443,
  },

  // Cluster Edge - Nodes
  {
    id: 'node-1',
    name: 'Node 1',
    description: 'Kubernetes worker node running the Ingress Controller pod. Receives traffic on NodePort.',
    shape: 'rectangle',
    color: '#22c55e',
    position: { x: 320, y: 55 },
    zone: 'cluster-edge',
    ipAddress: '10.0.1.10',
    port: 30080,
  },
  {
    id: 'node-2',
    name: 'Node 2',
    description: 'Another worker node. Load Balancer distributes traffic across all nodes.',
    shape: 'rectangle',
    color: '#22c55e',
    position: { x: 320, y: 155 },
    zone: 'cluster-edge',
    ipAddress: '10.0.1.11',
    port: 30080,
  },

  // Ingress Layer
  {
    id: 'ingress-controller',
    name: 'Ingress Controller',
    description: 'NGINX/Traefik/HAProxy pod that processes Ingress rules and routes traffic. Handles TLS termination.',
    shape: 'octagon',
    color: '#8b5cf6',
    position: { x: 480, y: 55 },
    zone: 'ingress-layer',
  },
  {
    id: 'ingress-rules',
    name: 'Ingress Rules',
    description: 'Ingress resource defining host/path routing rules. Maps URLs to backend Services.',
    shape: 'diamond',
    color: '#ec4899',
    position: { x: 480, y: 170 },
    zone: 'ingress-layer',
  },

  // Services Layer
  {
    id: 'service-a',
    name: 'Service A',
    description: 'ClusterIP Service for the frontend application. Routes /app/* requests.',
    shape: 'hexagon',
    color: '#6366f1',
    position: { x: 620, y: 55 },
    zone: 'services',
    ipAddress: '10.96.10.100',
    port: 80,
  },
  {
    id: 'service-b',
    name: 'Service B',
    description: 'ClusterIP Service for the API backend. Routes /api/* requests.',
    shape: 'hexagon',
    color: '#6366f1',
    position: { x: 620, y: 170 },
    zone: 'services',
    ipAddress: '10.96.10.200',
    port: 80,
  },

  // Workloads - Pods
  {
    id: 'pod-a1',
    name: 'Frontend 1',
    description: 'Frontend application pod replica 1. Serves the web UI.',
    shape: 'circle',
    color: '#10b981',
    position: { x: 760, y: 30 },
    zone: 'workloads',
    ipAddress: '10.244.1.10',
    port: 8080,
  },
  {
    id: 'pod-a2',
    name: 'Frontend 2',
    description: 'Frontend application pod replica 2. Load balanced with replica 1.',
    shape: 'circle',
    color: '#10b981',
    position: { x: 760, y: 110 },
    zone: 'workloads',
    ipAddress: '10.244.2.15',
    port: 8080,
  },
  {
    id: 'pod-b1',
    name: 'API Pod',
    description: 'Backend API pod. Handles /api/* requests.',
    shape: 'circle',
    color: '#10b981',
    position: { x: 760, y: 190 },
    zone: 'workloads',
    ipAddress: '10.244.1.20',
    port: 3000,
  },
];

export const ingressSteps: IngressStep[] = [
  {
    id: 'step1',
    from: 'client',
    to: 'internet',
    label: '1. DNS Resolution',
    description: 'User types https://myapp.example.com in browser. DNS resolves to the Cloud Load Balancer IP.',
    duration: 1500,
    packetType: 'data',
    details: [
      'Browser initiates DNS lookup',
      'DNS returns: myapp.example.com → 203.0.113.50',
      'This IP belongs to Cloud Load Balancer',
      'Browser prepares HTTPS request',
    ],
  },
  {
    id: 'step2',
    from: 'internet',
    to: 'cloud-lb',
    label: '2. HTTPS Request',
    description: 'HTTPS request arrives at the Cloud Load Balancer on port 443.',
    duration: 1200,
    packetType: 'https-request',
    packetLabel: 'HTTPS',
    details: [
      'Request: GET https://myapp.example.com/app/dashboard',
      'Cloud LB receives on port 443',
      'LB configured by Ingress Controller',
      'Health checks ensure backend availability',
    ],
  },
  {
    id: 'step3',
    from: 'cloud-lb',
    to: 'node-1',
    label: '3. Forward to NodePort',
    description: 'Load Balancer forwards traffic to a healthy node on the NodePort (30080).',
    duration: 1200,
    packetType: 'https-request',
    packetLabel: 'HTTPS',
    details: [
      'LB selects healthy node from target group',
      'Forwards to NodePort: 10.0.1.10:30080',
      'NodePort is same on all nodes',
      'kube-proxy routes to Ingress Controller pod',
    ],
  },
  {
    id: 'step4',
    from: 'node-1',
    to: 'ingress-controller',
    label: '4. Ingress Controller',
    description: 'Traffic reaches the Ingress Controller pod (NGINX/Traefik) running on the node.',
    duration: 1500,
    packetType: 'https-request',
    packetLabel: 'HTTPS',
    details: [
      'Ingress Controller receives request',
      'TLS termination happens here',
      'Decrypts HTTPS → HTTP',
      'Reads Host header and path',
    ],
  },
  {
    id: 'step5',
    from: 'ingress-controller',
    to: 'ingress-rules',
    label: '5. Match Ingress Rules',
    description: 'Controller matches the request against Ingress rules to find the backend Service.',
    duration: 1200,
    packetType: 'data',
    details: [
      'Host: myapp.example.com ✓',
      'Path: /app/* → service-a:80',
      'Path: /api/* → service-b:80',
      'Request matches /app/* rule',
    ],
  },
  {
    id: 'step6',
    from: 'ingress-rules',
    to: 'service-a',
    label: '6. Route to Service',
    description: 'Based on path /app/*, request is routed to Service A (frontend).',
    duration: 1200,
    packetType: 'http-request',
    packetLabel: 'HTTP',
    details: [
      'Rule matched: /app/* → service-a',
      'Forward to ClusterIP: 10.96.10.100:80',
      'Request is now HTTP (TLS terminated)',
      'X-Forwarded-* headers added',
    ],
  },
  {
    id: 'step7',
    from: 'service-a',
    to: 'pod-a1',
    label: '7. Load Balance to Pod',
    description: 'Service load balances the request to one of the frontend pods.',
    duration: 1200,
    packetType: 'http-request',
    packetLabel: 'HTTP',
    details: [
      'Service selects pod via iptables/IPVS',
      'Random or round-robin selection',
      'Request sent to: 10.244.1.10:8080',
      'Pod receives HTTP request',
    ],
  },
  {
    id: 'step8',
    from: 'pod-a1',
    to: 'service-a',
    label: '8. Pod Response',
    description: 'Frontend pod processes the request and returns the response.',
    duration: 1200,
    packetType: 'http-response',
    packetLabel: '200 OK',
    details: [
      'Pod processes request',
      'Generates HTML response',
      'Response sent back to Service',
      'HTTP 200 OK with content',
    ],
  },
  {
    id: 'step9',
    from: 'service-a',
    to: 'ingress-controller',
    label: '9. Response to Controller',
    description: 'Response travels back through the Service to the Ingress Controller.',
    duration: 1000,
    packetType: 'http-response',
    packetLabel: '200 OK',
    details: [
      'Response routed back',
      'Connection tracking ensures correct path',
      'Ingress Controller receives response',
    ],
  },
  {
    id: 'step10',
    from: 'ingress-controller',
    to: 'node-1',
    label: '10. TLS Encryption',
    description: 'Ingress Controller encrypts the response with TLS before sending back.',
    duration: 1200,
    packetType: 'https-response',
    packetLabel: 'HTTPS',
    details: [
      'Response encrypted with TLS',
      'Uses certificate from Secret',
      'HTTPS response prepared',
      'Sent back through NodePort',
    ],
  },
  {
    id: 'step11',
    from: 'node-1',
    to: 'cloud-lb',
    label: '11. Return via LB',
    description: 'Encrypted response travels back through the Cloud Load Balancer.',
    duration: 1000,
    packetType: 'https-response',
    packetLabel: 'HTTPS',
    details: [
      'Response exits cluster via NodePort',
      'Cloud LB forwards to client',
      'Connection tracking maintained',
    ],
  },
  {
    id: 'step12',
    from: 'cloud-lb',
    to: 'client',
    label: '12. Response Delivered',
    description: 'Client receives the HTTPS response. The page loads in the browser.',
    duration: 1000,
    packetType: 'https-response',
    packetLabel: 'HTTPS',
    details: [
      'Client receives encrypted response',
      'Browser decrypts with TLS',
      'Page rendered to user',
      'Ingress flow complete!',
    ],
  },
];

export function getComponentById(id: string): IngressComponent | undefined {
  return ingressComponents.find(c => c.id === id);
}

export const ingressRules: IngressRule[] = [
  {
    host: 'myapp.example.com',
    path: '/app/*',
    serviceName: 'service-a',
    servicePort: 80,
  },
  {
    host: 'myapp.example.com',
    path: '/api/*',
    serviceName: 'service-b',
    servicePort: 80,
  },
  {
    host: 'myapp.example.com',
    path: '/',
    serviceName: 'service-a',
    servicePort: 80,
  },
];

export const tlsConfig = {
  secretName: 'myapp-tls-secret',
  hosts: ['myapp.example.com'],
  issuer: "Let's Encrypt",
};

export const ingressYaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls-secret
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /app
        pathType: Prefix
        backend:
          service:
            name: service-a
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: service-b
            port:
              number: 80`;

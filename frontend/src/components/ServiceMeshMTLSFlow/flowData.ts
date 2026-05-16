// Service Mesh mTLS Flow - Components and Flow Data

import type { MTLSComponent, MTLSStep, CertificateInfo } from './types';

export const mtlsComponents: MTLSComponent[] = [
  // Client Pod
  {
    id: 'client-app',
    name: 'App A',
    description: 'Client application making outbound requests. Unaware of mTLS.',
    shape: 'hexagon',
    color: '#3b82f6',
    position: { x: 30, y: 70 },
    zone: 'client-pod',
  },
  {
    id: 'client-proxy',
    name: 'Envoy',
    description: 'Sidecar proxy (Envoy) injected by Istio. Handles mTLS transparently.',
    shape: 'octagon',
    color: '#8b5cf6',
    position: { x: 115, y: 70 },
    zone: 'client-pod',
  },
  {
    id: 'workload-cert-client',
    name: 'Cert',
    description: 'X.509 certificate with SPIFFE ID for workload identity.',
    shape: 'shield',
    color: '#22c55e',
    position: { x: 115, y: 150 },
    zone: 'client-pod',
  },

  // Control Plane
  {
    id: 'istiod',
    name: 'istiod',
    description: 'Istio control plane. Manages configuration, certificates, and policies.',
    shape: 'octagon',
    color: '#f59e0b',
    position: { x: 250, y: 70 },
    zone: 'control-plane',
  },
  {
    id: 'citadel',
    name: 'Citadel',
    description: 'Certificate Authority component. Issues workload certificates.',
    shape: 'key',
    color: '#ec4899',
    position: { x: 340, y: 70 },
    zone: 'control-plane',
  },
  {
    id: 'root-ca',
    name: 'Root CA',
    description: 'Root Certificate Authority. Trust anchor for the mesh.',
    shape: 'lock',
    color: '#ef4444',
    position: { x: 295, y: 150 },
    zone: 'pki',
  },

  // Server Pod
  {
    id: 'server-proxy',
    name: 'Envoy',
    description: 'Server-side sidecar proxy. Terminates mTLS and forwards to app.',
    shape: 'octagon',
    color: '#8b5cf6',
    position: { x: 450, y: 70 },
    zone: 'server-pod',
  },
  {
    id: 'server-app',
    name: 'App B',
    description: 'Server application receiving requests. Unaware of mTLS.',
    shape: 'hexagon',
    color: '#14b8a6',
    position: { x: 535, y: 70 },
    zone: 'server-pod',
  },
  {
    id: 'workload-cert-server',
    name: 'Cert',
    description: 'Server workload certificate with SPIFFE ID.',
    shape: 'shield',
    color: '#22c55e',
    position: { x: 450, y: 150 },
    zone: 'server-pod',
  },
];

export const mtlsSteps: MTLSStep[] = [
  {
    id: 'step1',
    from: 'client-proxy',
    to: 'istiod',
    label: '1. CSR Request',
    description: 'Envoy proxy requests a certificate from istiod on startup.',
    duration: 1500,
    trafficType: 'cert-request',
    packetLabel: 'CSR',
    details: [
      'Envoy generates private key locally',
      'Creates Certificate Signing Request (CSR)',
      'Includes ServiceAccount token for identity',
      'Sends CSR to istiod over secure channel',
    ],
  },
  {
    id: 'step2',
    from: 'istiod',
    to: 'citadel',
    label: '2. Validate & Sign',
    description: 'istiod validates the request and Citadel signs the certificate.',
    duration: 1200,
    trafficType: 'cert-request',
    details: [
      'Validates ServiceAccount token with K8s API',
      'Verifies pod identity and namespace',
      'Citadel CA signs the CSR',
      'Creates X.509 cert with SPIFFE ID',
    ],
  },
  {
    id: 'step3',
    from: 'citadel',
    to: 'root-ca',
    label: '3. Chain to Root',
    description: 'Certificate is chained to the mesh Root CA.',
    duration: 1200,
    trafficType: 'cert-issue',
    packetLabel: 'SIGN',
    details: [
      'Root CA is trust anchor',
      'Intermediate CA signs workload certs',
      'Certificate chain: Workload → Intermediate → Root',
      'Short-lived certs (24h default)',
    ],
  },
  {
    id: 'step4',
    from: 'istiod',
    to: 'workload-cert-client',
    label: '4. Issue Client Cert',
    description: 'Signed certificate delivered to client Envoy proxy.',
    duration: 1500,
    trafficType: 'cert-issue',
    packetLabel: 'CERT',
    details: [
      'SPIFFE ID: spiffe://cluster/ns/default/sa/app-a',
      'Contains public key + CA signature',
      'Pushed via xDS (SDS - Secret Discovery)',
      'Auto-rotated before expiry',
    ],
  },
  {
    id: 'step5',
    from: 'istiod',
    to: 'workload-cert-server',
    label: '5. Issue Server Cert',
    description: 'Server Envoy also receives its workload certificate.',
    duration: 1200,
    trafficType: 'cert-issue',
    packetLabel: 'CERT',
    details: [
      'SPIFFE ID: spiffe://cluster/ns/default/sa/app-b',
      'Same process as client cert',
      'Both sides now have valid certs',
      'Ready for mutual authentication',
    ],
  },
  {
    id: 'step6',
    from: 'client-app',
    to: 'client-proxy',
    label: '6. App Request',
    description: 'Application makes HTTP request to service (plaintext to sidecar).',
    duration: 1200,
    trafficType: 'plaintext',
    packetLabel: 'HTTP',
    details: [
      'App calls http://app-b.default.svc:8080',
      'Request intercepted by iptables rules',
      'Redirected to Envoy on localhost:15001',
      'App is unaware of mTLS',
    ],
  },
  {
    id: 'step7',
    from: 'client-proxy',
    to: 'server-proxy',
    label: '7. TLS Handshake',
    description: 'Envoy proxies initiate mTLS handshake.',
    duration: 1500,
    trafficType: 'handshake',
    packetLabel: 'HELLO',
    details: [
      'Client sends ClientHello + supported ciphers',
      'Server responds with ServerHello + cert',
      'Client verifies server cert against Root CA',
      'Client sends its cert for mutual auth',
    ],
  },
  {
    id: 'step8',
    from: 'server-proxy',
    to: 'client-proxy',
    label: '8. Verify Client',
    description: 'Server verifies client certificate and SPIFFE ID.',
    duration: 1200,
    trafficType: 'handshake',
    packetLabel: 'VERIFY',
    details: [
      'Server validates client cert chain',
      'Extracts SPIFFE ID from SAN',
      'Checks against AuthorizationPolicy',
      'Handshake complete - session keys derived',
    ],
  },
  {
    id: 'step9',
    from: 'client-proxy',
    to: 'server-proxy',
    label: '9. Encrypted Request',
    description: 'Original HTTP request sent over encrypted mTLS channel.',
    duration: 1500,
    trafficType: 'mtls',
    packetLabel: 'mTLS',
    details: [
      'HTTP request encrypted with session key',
      'TLS 1.3 with perfect forward secrecy',
      'ALPN negotiation for HTTP/2',
      'Zero-trust: encrypted even in cluster',
    ],
  },
  {
    id: 'step10',
    from: 'server-proxy',
    to: 'server-app',
    label: '10. Decrypt & Forward',
    description: 'Server Envoy decrypts and forwards plaintext to application.',
    duration: 1200,
    trafficType: 'plaintext',
    packetLabel: 'HTTP',
    details: [
      'Envoy terminates TLS',
      'Forwards plaintext HTTP to app',
      'Adds x-forwarded-client-cert header',
      'App receives request on localhost',
    ],
  },
  {
    id: 'step11',
    from: 'server-app',
    to: 'server-proxy',
    label: '11. App Response',
    description: 'Application sends HTTP response back.',
    duration: 1200,
    trafficType: 'plaintext',
    packetLabel: 'HTTP',
    details: [
      'App processes request normally',
      'Returns HTTP response',
      'Response intercepted by Envoy',
      'Ready for encryption',
    ],
  },
  {
    id: 'step12',
    from: 'server-proxy',
    to: 'client-app',
    label: '12. Secure Response',
    description: 'Response encrypted over mTLS, decrypted by client proxy.',
    duration: 1500,
    trafficType: 'mtls',
    packetLabel: 'mTLS',
    details: [
      'Response encrypted with session key',
      'Sent over existing mTLS connection',
      'Client Envoy decrypts',
      'Plaintext delivered to App A ✓',
    ],
  },
];

export function getComponentById(id: string): MTLSComponent | undefined {
  return mtlsComponents.find(c => c.id === id);
}

export const clientCertInfo: CertificateInfo = {
  subject: 'CN=app-a',
  issuer: 'CN=cluster-ca',
  validity: '24 hours',
  spiffeId: 'spiffe://cluster.local/ns/default/sa/app-a',
};

export const serverCertInfo: CertificateInfo = {
  subject: 'CN=app-b',
  issuer: 'CN=cluster-ca',
  validity: '24 hours',
  spiffeId: 'spiffe://cluster.local/ns/default/sa/app-b',
};

export const mtlsModes = [
  { name: 'DISABLE', description: 'No mTLS, plaintext only' },
  { name: 'PERMISSIVE', description: 'Accept both mTLS and plaintext' },
  { name: 'STRICT', description: 'Require mTLS for all traffic' },
];

export const peerAuthYaml = `apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: app-b-policy
spec:
  selector:
    matchLabels:
      app: app-b
  rules:
  - from:
    - source:
        principals:
        - "cluster.local/ns/default/sa/app-a"`;

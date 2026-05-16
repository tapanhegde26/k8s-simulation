// Secrets Management Flow - Components and Flow Data

import type { SecretsComponent, SecretsStep, SecretData } from './types';

export const secretsComponents: SecretsComponent[] = [
  // Client Zone
  {
    id: 'user',
    name: 'User',
    description: 'Admin creating or updating secrets via kubectl or API.',
    shape: 'user',
    color: '#3b82f6',
    position: { x: 30, y: 70 },
    zone: 'client',
  },
  {
    id: 'kubectl',
    name: 'kubectl',
    description: 'CLI tool for creating and managing Kubernetes secrets.',
    shape: 'rectangle',
    color: '#8b5cf6',
    position: { x: 100, y: 75 },
    zone: 'client',
  },

  // Control Plane
  {
    id: 'api-server',
    name: 'API Server',
    description: 'Receives secret creation requests and coordinates encryption.',
    shape: 'octagon',
    color: '#f59e0b',
    position: { x: 210, y: 70 },
    zone: 'control-plane',
  },
  {
    id: 'etcd',
    name: 'etcd',
    description: 'Stores encrypted secrets. Data encrypted at rest.',
    shape: 'cylinder',
    color: '#64748b',
    position: { x: 310, y: 65 },
    zone: 'control-plane',
  },

  // Encryption Layer
  {
    id: 'encryption-config',
    name: 'EncryptConfig',
    description: 'Encryption configuration defining providers and key rotation.',
    shape: 'rectangle',
    color: '#ec4899',
    position: { x: 210, y: 165 },
    zone: 'encryption',
  },
  {
    id: 'kms-provider',
    name: 'KMS',
    description: 'Key Management Service (AWS KMS, GCP KMS, Vault) for envelope encryption.',
    shape: 'key',
    color: '#14b8a6',
    position: { x: 310, y: 165 },
    zone: 'encryption',
  },

  // Worker Node
  {
    id: 'kubelet',
    name: 'Kubelet',
    description: 'Node agent that fetches secrets and mounts them into pods.',
    shape: 'octagon',
    color: '#22c55e',
    position: { x: 440, y: 70 },
    zone: 'worker-node',
  },

  // Pod Zone
  {
    id: 'pod',
    name: 'Pod',
    description: 'Application pod requesting access to secrets.',
    shape: 'hexagon',
    color: '#6366f1',
    position: { x: 440, y: 165 },
    zone: 'pod-zone',
  },
  {
    id: 'secret-volume',
    name: 'tmpfs',
    description: 'In-memory tmpfs volume where secrets are mounted. Never written to disk.',
    shape: 'cylinder',
    color: '#f97316',
    position: { x: 530, y: 165 },
    zone: 'pod-zone',
  },
  {
    id: 'container',
    name: 'Container',
    description: 'Application container reading secrets from mounted volume or env vars.',
    shape: 'square',
    color: '#ef4444',
    position: { x: 530, y: 70 },
    zone: 'pod-zone',
  },
];

export const secretsSteps: SecretsStep[] = [
  {
    id: 'step1',
    from: 'user',
    to: 'kubectl',
    label: '1. Create Secret',
    description: 'User creates a secret using kubectl create secret command.',
    duration: 1500,
    secretType: 'create',
    packetLabel: 'CREATE',
    details: [
      'kubectl create secret generic db-creds',
      '--from-literal=username=admin',
      '--from-literal=password=s3cr3t',
      'Secret data base64 encoded (not encrypted)',
    ],
  },
  {
    id: 'step2',
    from: 'kubectl',
    to: 'api-server',
    label: '2. API Request',
    description: 'kubectl sends secret creation request to API server over TLS.',
    duration: 1200,
    secretType: 'plaintext',
    packetLabel: 'TLS',
    details: [
      'POST /api/v1/namespaces/default/secrets',
      'Secret transmitted over HTTPS',
      'Base64 encoded, not yet encrypted',
      'API server receives plaintext secret',
    ],
  },
  {
    id: 'step3',
    from: 'api-server',
    to: 'encryption-config',
    label: '3. Check Encryption',
    description: 'API server checks encryption configuration for secrets.',
    duration: 1200,
    secretType: 'create',
    details: [
      'Read /etc/kubernetes/encryption-config.yaml',
      'Provider: aescbc, secretbox, or kms',
      'Determine encryption key to use',
      'KMS envelope encryption if configured',
    ],
  },
  {
    id: 'step4',
    from: 'encryption-config',
    to: 'kms-provider',
    label: '4. Get DEK',
    description: 'For KMS envelope encryption, request Data Encryption Key.',
    duration: 1500,
    secretType: 'encrypted',
    packetLabel: 'DEK',
    details: [
      'Request DEK from KMS provider',
      'KMS encrypts DEK with master key (KEK)',
      'Returns encrypted DEK + plaintext DEK',
      'Envelope encryption: secret → DEK → KEK',
    ],
  },
  {
    id: 'step5',
    from: 'kms-provider',
    to: 'api-server',
    label: '5. Encrypt Secret',
    description: 'Secret data encrypted using the DEK before storage.',
    duration: 1200,
    secretType: 'encrypted',
    packetLabel: 'ENC',
    details: [
      'Secret encrypted with plaintext DEK',
      'Encrypted DEK stored with secret',
      'Plaintext DEK discarded from memory',
      'Only encrypted data persists',
    ],
  },
  {
    id: 'step6',
    from: 'api-server',
    to: 'etcd',
    label: '6. Store in etcd',
    description: 'Encrypted secret stored in etcd. Data encrypted at rest.',
    duration: 1500,
    secretType: 'encrypted',
    packetLabel: 'STORE',
    details: [
      'Key: /registry/secrets/default/db-creds',
      'Value: encrypted secret + encrypted DEK',
      'etcd stores ciphertext only',
      'Encryption at rest achieved ✓',
    ],
  },
  {
    id: 'step7',
    from: 'pod',
    to: 'kubelet',
    label: '7. Pod Scheduled',
    description: 'Pod with secret volume mount is scheduled on node.',
    duration: 1200,
    secretType: 'fetch',
    packetLabel: 'SPEC',
    details: [
      'Pod spec: volumes.secret.secretName',
      'volumeMounts: /etc/secrets',
      'Kubelet sees secret volume requirement',
      'Must fetch secret before pod starts',
    ],
  },
  {
    id: 'step8',
    from: 'kubelet',
    to: 'api-server',
    label: '8. Fetch Secret',
    description: 'Kubelet requests secret from API server.',
    duration: 1200,
    secretType: 'fetch',
    packetLabel: 'GET',
    details: [
      'GET /api/v1/namespaces/default/secrets/db-creds',
      'Kubelet authenticates with node certificate',
      'RBAC: system:node can read secrets for its pods',
      'Request sent over TLS',
    ],
  },
  {
    id: 'step9',
    from: 'api-server',
    to: 'etcd',
    label: '9. Read from etcd',
    description: 'API server reads encrypted secret from etcd.',
    duration: 1200,
    secretType: 'encrypted',
    details: [
      'Fetch encrypted secret from etcd',
      'Retrieve encrypted DEK',
      'Need to decrypt before returning',
      'Call KMS to decrypt DEK',
    ],
  },
  {
    id: 'step10',
    from: 'etcd',
    to: 'kubelet',
    label: '10. Decrypt & Return',
    description: 'API server decrypts secret and returns to kubelet.',
    duration: 1500,
    secretType: 'decrypted',
    packetLabel: 'SECRET',
    details: [
      'KMS decrypts DEK using KEK',
      'DEK decrypts secret data',
      'Plaintext secret returned over TLS',
      'Secret in memory, not on disk',
    ],
  },
  {
    id: 'step11',
    from: 'kubelet',
    to: 'secret-volume',
    label: '11. Mount tmpfs',
    description: 'Kubelet mounts secret to tmpfs volume (in-memory).',
    duration: 1200,
    secretType: 'mounted',
    packetLabel: 'MOUNT',
    details: [
      'Create tmpfs volume (RAM-backed)',
      'Write secret files to tmpfs',
      '/etc/secrets/username',
      '/etc/secrets/password',
    ],
  },
  {
    id: 'step12',
    from: 'secret-volume',
    to: 'container',
    label: '12. App Reads Secret',
    description: 'Container reads secrets from mounted volume path.',
    duration: 1500,
    secretType: 'mounted',
    packetLabel: 'READ',
    details: [
      'App reads /etc/secrets/username',
      'App reads /etc/secrets/password',
      'Secrets never touch disk',
      'Secure secret delivery complete ✓',
    ],
  },
];

export function getComponentById(id: string): SecretsComponent | undefined {
  return secretsComponents.find(c => c.id === id);
}

export const sampleSecret: SecretData = {
  name: 'db-credentials',
  namespace: 'production',
  type: 'Opaque',
  keys: ['username', 'password', 'connection-string'],
};

export const encryptionProviders = [
  { name: 'aescbc', description: 'AES-CBC with PKCS#7 padding' },
  { name: 'secretbox', description: 'XSalsa20 + Poly1305' },
  { name: 'kms', description: 'Envelope encryption via KMS' },
  { name: 'identity', description: 'No encryption (default)' },
];

export const secretsYaml = `apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
data:
  username: YWRtaW4=      # base64(admin)
  password: czNjcjN0      # base64(s3cr3t)
---
# Pod using the secret
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: db-credentials`;

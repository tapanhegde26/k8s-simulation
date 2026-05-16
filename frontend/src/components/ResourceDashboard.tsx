import { motion } from 'framer-motion';
import { useK8sStore } from '../store/k8sStore';
import {
  Box,
  Layers,
  Network,
  Globe,
  FileText,
  Lock,
  Gauge,
  Server,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Pod, Deployment, Service, Ingress, ConfigMap, Secret, HPA } from '../types/kubernetes';

type ResourceType = 'pods' | 'deployments' | 'services' | 'ingresses' | 'configmaps' | 'secrets' | 'hpas';

export function ResourceDashboard() {
  const [activeResource, setActiveResource] = useState<ResourceType>('pods');
  const store = useK8sStore();

  const resourceTabs = [
    { id: 'pods' as ResourceType, label: 'Pods', icon: Box, count: store.pods.length },
    { id: 'deployments' as ResourceType, label: 'Deployments', icon: Layers, count: store.deployments.length },
    { id: 'services' as ResourceType, label: 'Services', icon: Network, count: store.services.length },
    { id: 'ingresses' as ResourceType, label: 'Ingresses', icon: Globe, count: store.ingresses.length },
    { id: 'configmaps' as ResourceType, label: 'ConfigMaps', icon: FileText, count: store.configMaps.length },
    { id: 'secrets' as ResourceType, label: 'Secrets', icon: Lock, count: store.secrets.length },
    { id: 'hpas' as ResourceType, label: 'HPAs', icon: Gauge, count: store.hpas.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Kubernetes Resources</h2>
        <p className="text-slate-400 mt-1">
          View and manage all cluster resources
        </p>
      </div>

      {/* Resource Tabs */}
      <div className="flex flex-wrap gap-2">
        {resourceTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveResource(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all
              ${activeResource === tab.id
                ? 'bg-k8s-blue text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
            `}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs
              ${activeResource === tab.id ? 'bg-white/20' : 'bg-slate-700'}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Resource List */}
      <div className="glass rounded-xl p-6">
        {activeResource === 'pods' && <PodList pods={store.pods} onDelete={store.deletePod} />}
        {activeResource === 'deployments' && <DeploymentList deployments={store.deployments} onDelete={store.deleteDeployment} onScale={store.scaleDeployment} />}
        {activeResource === 'services' && <ServiceList services={store.services} onDelete={store.deleteService} />}
        {activeResource === 'ingresses' && <IngressList ingresses={store.ingresses} onDelete={store.deleteIngress} />}
        {activeResource === 'configmaps' && <ConfigMapList configMaps={store.configMaps} onDelete={store.deleteConfigMap} />}
        {activeResource === 'secrets' && <SecretList secrets={store.secrets} onDelete={store.deleteSecret} />}
        {activeResource === 'hpas' && <HPAList hpas={store.hpas} onDelete={store.deleteHPA} onUpdateMetrics={store.updateHPAMetrics} />}
      </div>
    </div>
  );
}

function EmptyState({ resource }: { resource: string }) {
  return (
    <div className="text-center py-12">
      <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-400">No {resource} found</h3>
      <p className="text-sm text-slate-500 mt-1">
        Create some {resource} using the Interactive Lab
      </p>
    </div>
  );
}

function PodList({ pods, onDelete }: { pods: Pod[]; onDelete: (id: string) => void }) {
  if (pods.length === 0) return <EmptyState resource="pods" />;

  return (
    <div className="space-y-3">
      {pods.map((pod, index) => (
        <motion.div
          key={pod.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="font-medium">{pod.name}</h4>
                <span className="text-xs text-slate-400">Namespace: {pod.namespace}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${pod.phase === 'Running' ? 'bg-green-500/20 text-green-400' : ''}
                ${pod.phase === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${pod.phase === 'Failed' ? 'bg-red-500/20 text-red-400' : ''}
                ${pod.phase === 'Terminating' ? 'bg-orange-500/20 text-orange-400' : ''}
                ${pod.phase === 'ContainerCreating' ? 'bg-blue-500/20 text-blue-400' : ''}
              `}>
                {pod.phase}
              </span>
              <button
                onClick={() => onDelete(pod.id)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Node:</span>
              <span className="ml-2 text-slate-300">{pod.nodeName || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-500">Containers:</span>
              <span className="ml-2 text-slate-300">{pod.containers.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Restarts:</span>
              <span className="ml-2 text-slate-300">{pod.restartCount}</span>
            </div>
            <div>
              <span className="text-slate-500">Age:</span>
              <span className="ml-2 text-slate-300">{formatAge(pod.createdAt)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function DeploymentList({ 
  deployments, 
  onDelete, 
  onScale 
}: { 
  deployments: Deployment[]; 
  onDelete: (id: string) => void;
  onScale: (id: string, replicas: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (deployments.length === 0) return <EmptyState resource="deployments" />;

  return (
    <div className="space-y-3">
      {deployments.map((deployment, index) => (
        <motion.div
          key={deployment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
        >
          <div 
            className="p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === deployment.id ? null : deployment.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="font-medium">{deployment.name}</h4>
                  <span className="text-xs text-slate-400">Namespace: {deployment.namespace}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${deployment.status === 'Available' ? 'bg-green-500/20 text-green-400' : ''}
                  ${deployment.status === 'Progressing' ? 'bg-blue-500/20 text-blue-400' : ''}
                  ${deployment.status === 'Failed' ? 'bg-red-500/20 text-red-400' : ''}
                `}>
                  {deployment.replicas}/{deployment.desiredReplicas} Ready
                </span>
                {expandedId === deployment.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </div>
          
          {expandedId === deployment.id && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="border-t border-slate-700 p-4"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-slate-400">Scale:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onScale(deployment.id, Math.max(0, deployment.desiredReplicas - 1))}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono">{deployment.desiredReplicas}</span>
                  <button
                    onClick={() => onScale(deployment.id, deployment.desiredReplicas + 1)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => onDelete(deployment.id)}
                  className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="text-sm text-slate-400">
                <div>Selector: {JSON.stringify(deployment.selector)}</div>
                <div>Created: {new Date(deployment.createdAt).toLocaleString()}</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ServiceList({ services, onDelete }: { services: Service[]; onDelete: (id: string) => void }) {
  if (services.length === 0) return <EmptyState resource="services" />;

  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-medium">{service.name}</h4>
                <span className="text-xs text-slate-400">Namespace: {service.namespace}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                {service.type}
              </span>
              <button
                onClick={() => onDelete(service.id)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Cluster IP:</span>
              <span className="ml-2 font-mono text-slate-300">{service.clusterIP}</span>
            </div>
            {service.nodePort && (
              <div>
                <span className="text-slate-500">Node Port:</span>
                <span className="ml-2 font-mono text-slate-300">{service.nodePort}</span>
              </div>
            )}
            {service.loadBalancerIP && (
              <div>
                <span className="text-slate-500">External IP:</span>
                <span className="ml-2 font-mono text-slate-300">{service.loadBalancerIP}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Ports:</span>
              <span className="ml-2 font-mono text-slate-300">
                {service.ports.map(p => `${p.port}:${p.targetPort}`).join(', ')}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function IngressList({ ingresses, onDelete }: { ingresses: Ingress[]; onDelete: (id: string) => void }) {
  if (ingresses.length === 0) return <EmptyState resource="ingresses" />;

  return (
    <div className="space-y-3">
      {ingresses.map((ingress, index) => (
        <motion.div
          key={ingress.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-orange-400" />
              <div>
                <h4 className="font-medium">{ingress.name}</h4>
                <span className="text-xs text-slate-400">Namespace: {ingress.namespace}</span>
              </div>
            </div>
            <button
              onClick={() => onDelete(ingress.id)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {ingress.rules.map((rule, i) => (
              <div key={i} className="text-sm bg-slate-900/50 rounded p-2">
                <span className="text-orange-400">{rule.host}</span>
                {rule.paths.map((path, j) => (
                  <div key={j} className="ml-4 text-slate-400">
                    {path.path} → {path.backend.serviceName}:{path.backend.servicePort}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ConfigMapList({ configMaps, onDelete }: { configMaps: ConfigMap[]; onDelete: (id: string) => void }) {
  if (configMaps.length === 0) return <EmptyState resource="configmaps" />;

  return (
    <div className="space-y-3">
      {configMaps.map((cm, index) => (
        <motion.div
          key={cm.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="font-medium">{cm.name}</h4>
                <span className="text-xs text-slate-400">Namespace: {cm.namespace}</span>
              </div>
            </div>
            <button
              onClick={() => onDelete(cm.id)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-slate-500">Keys:</span>
            <span className="ml-2 text-slate-300">{Object.keys(cm.data).join(', ')}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SecretList({ secrets, onDelete }: { secrets: Secret[]; onDelete: (id: string) => void }) {
  if (secrets.length === 0) return <EmptyState resource="secrets" />;

  return (
    <div className="space-y-3">
      {secrets.map((secret, index) => (
        <motion.div
          key={secret.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="font-medium">{secret.name}</h4>
                <span className="text-xs text-slate-400">Namespace: {secret.namespace}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                {secret.type}
              </span>
              <button
                onClick={() => onDelete(secret.id)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-slate-500">Keys:</span>
            <span className="ml-2 text-slate-300">{Object.keys(secret.data).length} keys (hidden)</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function HPAList({ 
  hpas, 
  onDelete,
  onUpdateMetrics 
}: { 
  hpas: HPA[]; 
  onDelete: (id: string) => void;
  onUpdateMetrics: (id: string, value: number) => void;
}) {
  if (hpas.length === 0) return <EmptyState resource="HPAs" />;

  return (
    <div className="space-y-3">
      {hpas.map((hpa, index) => (
        <motion.div
          key={hpa.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-green-400" />
              <div>
                <h4 className="font-medium">{hpa.name}</h4>
                <span className="text-xs text-slate-400">Target: {hpa.targetRef.name}</span>
              </div>
            </div>
            <button
              onClick={() => onDelete(hpa.id)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Min Replicas:</span>
                <span className="ml-2 text-slate-300">{hpa.minReplicas}</span>
              </div>
              <div>
                <span className="text-slate-500">Max Replicas:</span>
                <span className="ml-2 text-slate-300">{hpa.maxReplicas}</span>
              </div>
              <div>
                <span className="text-slate-500">Current:</span>
                <span className="ml-2 text-slate-300">{hpa.currentReplicas}</span>
              </div>
            </div>
            
            {/* Simulate Load */}
            <div className="bg-slate-900/50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Simulate CPU Load:</span>
                <span className="text-sm font-mono">
                  {hpa.metrics[0]?.currentValue || 0}% / {hpa.metrics[0]?.targetValue}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hpa.metrics[0]?.currentValue || 0}
                onChange={(e) => onUpdateMetrics(hpa.id, Number(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function formatAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

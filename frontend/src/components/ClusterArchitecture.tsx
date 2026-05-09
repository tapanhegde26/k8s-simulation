import { motion } from 'framer-motion';
import { useK8sStore } from '../store/k8sStore';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Network,
  Shield,
  Clock,
  Box,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

export function ClusterArchitecture() {
  const { nodes, controlPlane, pods, addNode, removeNode, resetCluster } = useK8sStore();
  
  const masterNodes = nodes.filter(n => n.role === 'master');
  const workerNodes = nodes.filter(n => n.role === 'worker');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kubernetes Cluster Architecture</h2>
          <p className="text-slate-400 mt-1">
            Visualize the control plane and worker node components
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Node
          </button>
          <button
            onClick={resetCluster}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Control Plane Section */}
      <section className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Control Plane (Master)</h3>
            <p className="text-sm text-slate-400">Brain of the Kubernetes cluster</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {controlPlane.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <ComponentIcon name={component.name} />
                <span className={`w-2 h-2 rounded-full ${
                  component.status === 'Running' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <h4 className="font-medium text-sm mb-1">{component.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{component.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Control Plane Flow Diagram */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-4">Component Interaction Flow</h4>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <FlowStep icon={<Network />} label="kubectl" />
            <FlowArrow />
            <FlowStep icon={<Server />} label="API Server" highlight />
            <FlowArrow />
            <FlowStep icon={<Database />} label="etcd" />
            <FlowArrow />
            <FlowStep icon={<Clock />} label="Scheduler" />
            <FlowArrow />
            <FlowStep icon={<Cpu />} label="Controller Manager" />
          </div>
        </div>
      </section>

      {/* Master Node */}
      <section className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Master Node</h3>
            <p className="text-sm text-slate-400">Hosts control plane components</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {masterNodes.map((node) => (
            <NodeCard key={node.id} node={node} pods={pods} />
          ))}
        </div>
      </section>

      {/* Worker Nodes */}
      <section className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <HardDrive className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Worker Nodes ({workerNodes.length})</h3>
              <p className="text-sm text-slate-400">Run your application workloads</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workerNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <NodeCard 
                node={node} 
                pods={pods}
                onRemove={() => removeNode(node.id)}
                canRemove={workerNodes.length > 1}
              />
            </motion.div>
          ))}
        </div>

        {/* Worker Node Components */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-4">Worker Node Components</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WorkerComponent 
              icon={<Cpu />}
              name="kubelet"
              description="Agent that ensures containers are running in a Pod"
            />
            <WorkerComponent 
              icon={<Network />}
              name="kube-proxy"
              description="Network proxy that maintains network rules on nodes"
            />
            <WorkerComponent 
              icon={<Box />}
              name="Container Runtime"
              description="Software responsible for running containers (containerd, CRI-O)"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ComponentIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    'kube-apiserver': <Server className="w-5 h-5 text-blue-400" />,
    'etcd': <Database className="w-5 h-5 text-yellow-400" />,
    'kube-scheduler': <Clock className="w-5 h-5 text-green-400" />,
    'kube-controller-manager': <Cpu className="w-5 h-5 text-purple-400" />,
    'cloud-controller-manager': <Network className="w-5 h-5 text-cyan-400" />,
  };
  return icons[name] || <Server className="w-5 h-5 text-slate-400" />;
}

function FlowStep({ icon, label, highlight }: { icon: JSX.Element; label: string; highlight?: boolean }) {
  return (
    <div className={`
      flex flex-col items-center gap-1 p-3 rounded-lg
      ${highlight ? 'bg-k8s-blue/20 border border-k8s-blue/50' : 'bg-slate-800/50'}
    `}>
      <div className={highlight ? 'text-k8s-blue' : 'text-slate-400'}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="text-slate-500 px-1">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

interface NodeCardProps {
  node: {
    id: string;
    name: string;
    role: 'master' | 'worker';
    status: 'Ready' | 'NotReady';
    allocatable: { cpu: number; memory: number };
    allocated: { cpu: number; memory: number };
    pods: string[];
  };
  pods: Array<{
    id: string;
    name: string;
    nodeName?: string;
    phase: string;
  }>;
  onRemove?: () => void;
  canRemove?: boolean;
}

function NodeCard({ node, pods, onRemove, canRemove }: NodeCardProps) {
  const nodePods = pods.filter((p) => p.nodeName === node.name);
  const cpuUsage = (node.allocated.cpu / node.allocatable.cpu) * 100;
  const memUsage = (node.allocated.memory / node.allocatable.memory) * 100;

  return (
    <div className="node-card bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${node.role === 'master' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
            <Server className={`w-5 h-5 ${node.role === 'master' ? 'text-blue-400' : 'text-green-400'}`} />
          </div>
          <div>
            <h4 className="font-medium">{node.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              node.status === 'Ready' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {node.status}
            </span>
          </div>
        </div>
        {onRemove && canRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
            title="Remove node"
          >
            <Minus size={16} />
          </button>
        )}
      </div>

      {/* Resource Usage */}
      <div className="space-y-3 mb-4">
        <ResourceBar label="CPU" value={cpuUsage} used={node.allocated.cpu} total={node.allocatable.cpu} unit="m" />
        <ResourceBar label="Memory" value={memUsage} used={node.allocated.memory} total={node.allocatable.memory} unit="Mi" />
      </div>

      {/* Pods on this node */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Pods ({nodePods.length})</div>
        <div className="flex flex-wrap gap-1">
          {nodePods.length === 0 ? (
            <span className="text-xs text-slate-500">No pods scheduled</span>
          ) : (
            nodePods.slice(0, 6).map((pod) => (
              <span
                key={pod.id}
                className={`pod-badge text-xs px-2 py-0.5 rounded ${
                  pod.phase === 'Running' ? 'bg-green-500/20 text-green-400' :
                  pod.phase === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}
              >
                {pod.name.slice(0, 15)}
              </span>
            ))
          )}
          {nodePods.length > 6 && (
            <span className="text-xs text-slate-400">+{nodePods.length - 6} more</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ResourceBar({ label, value, used, total, unit }: { 
  label: string; 
  value: number; 
  used: number; 
  total: number; 
  unit: string;
}) {
  const color = value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500';
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{used}{unit} / {total}{unit}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function WorkerComponent({ icon, name, description }: { icon: JSX.Element; name: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
      <div className="text-green-400 mt-0.5">{icon}</div>
      <div>
        <h5 className="font-medium text-sm">{name}</h5>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

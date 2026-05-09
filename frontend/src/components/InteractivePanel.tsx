import { useState } from 'react';
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
  Plus,
  Terminal,
  Play,
} from 'lucide-react';

type ResourceForm = 'pod' | 'deployment' | 'service' | 'ingress' | 'configmap' | 'secret' | 'hpa';

export function InteractivePanel() {
  const [activeForm, setActiveForm] = useState<ResourceForm>('deployment');
  const store = useK8sStore();

  const forms = [
    { id: 'pod' as ResourceForm, label: 'Pod', icon: Box },
    { id: 'deployment' as ResourceForm, label: 'Deployment', icon: Layers },
    { id: 'service' as ResourceForm, label: 'Service', icon: Network },
    { id: 'ingress' as ResourceForm, label: 'Ingress', icon: Globe },
    { id: 'configmap' as ResourceForm, label: 'ConfigMap', icon: FileText },
    { id: 'secret' as ResourceForm, label: 'Secret', icon: Lock },
    { id: 'hpa' as ResourceForm, label: 'HPA', icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Interactive Lab</h2>
        <p className="text-slate-400 mt-1">
          Create and manage Kubernetes resources interactively
        </p>
      </div>

      {/* Resource Type Selector */}
      <div className="flex flex-wrap gap-2">
        {forms.map((form) => (
          <button
            key={form.id}
            onClick={() => setActiveForm(form.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all
              ${activeForm === form.id
                ? 'bg-k8s-blue text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
            `}
          >
            <form.icon size={18} />
            <span>{form.label}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="glass rounded-xl p-6">
        {activeForm === 'pod' && <PodForm onCreate={store.createPod} />}
        {activeForm === 'deployment' && <DeploymentForm onCreate={store.createDeployment} />}
        {activeForm === 'service' && <ServiceForm onCreate={store.createService} deployments={store.deployments} />}
        {activeForm === 'ingress' && <IngressForm onCreate={store.createIngress} services={store.services} />}
        {activeForm === 'configmap' && <ConfigMapForm onCreate={store.createConfigMap} />}
        {activeForm === 'secret' && <SecretForm onCreate={store.createSecret} />}
        {activeForm === 'hpa' && <HPAForm onCreate={store.createHPA} deployments={store.deployments} />}
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Terminal size={20} />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            title="Deploy nginx"
            description="Create a simple nginx deployment with 3 replicas"
            onClick={() => {
              store.createDeployment({
                name: 'nginx-deployment',
                namespace: 'default',
                desiredReplicas: 3,
                selector: { app: 'nginx' },
                template: {
                  labels: { app: 'nginx' },
                  containers: [{
                    name: 'nginx',
                    image: 'nginx:latest',
                    resources: {
                      requests: { cpu: 100, memory: 128 },
                      limits: { cpu: 200, memory: 256 },
                    },
                    ports: [80],
                  }],
                },
              });
            }}
          />
          <QuickAction
            title="Create LoadBalancer"
            description="Expose nginx deployment via LoadBalancer"
            onClick={() => {
              store.createService({
                name: 'nginx-service',
                namespace: 'default',
                type: 'LoadBalancer',
                selector: { app: 'nginx' },
                ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
              });
            }}
          />
          <QuickAction
            title="Setup HPA"
            description="Auto-scale nginx based on CPU usage"
            onClick={() => {
              store.createHPA({
                name: 'nginx-hpa',
                namespace: 'default',
                targetRef: { kind: 'Deployment', name: 'nginx-deployment' },
                minReplicas: 2,
                maxReplicas: 10,
                metrics: [{ type: 'cpu', targetValue: 50 }],
              });
            }}
          />
          <QuickAction
            title="Add ConfigMap"
            description="Create app configuration"
            onClick={() => {
              store.createConfigMap({
                name: 'app-config',
                namespace: 'default',
                data: {
                  'APP_ENV': 'production',
                  'LOG_LEVEL': 'info',
                  'MAX_CONNECTIONS': '100',
                },
              });
            }}
          />
          <QuickAction
            title="Create Ingress"
            description="Setup ingress for nginx service"
            onClick={() => {
              store.createIngress({
                name: 'nginx-ingress',
                namespace: 'default',
                rules: [{
                  host: 'nginx.example.com',
                  paths: [{
                    path: '/',
                    pathType: 'Prefix',
                    backend: { serviceName: 'nginx-service', servicePort: 80 },
                  }],
                }],
              });
            }}
          />
          <QuickAction
            title="Full Stack Demo"
            description="Deploy complete app with all resources"
            onClick={() => {
              // Deployment
              store.createDeployment({
                name: 'demo-app',
                namespace: 'default',
                desiredReplicas: 2,
                selector: { app: 'demo' },
                template: {
                  labels: { app: 'demo' },
                  containers: [{
                    name: 'app',
                    image: 'demo-app:v1',
                    resources: {
                      requests: { cpu: 200, memory: 256 },
                      limits: { cpu: 500, memory: 512 },
                    },
                    ports: [8080],
                  }],
                },
              });
              // Service
              setTimeout(() => {
                store.createService({
                  name: 'demo-service',
                  namespace: 'default',
                  type: 'ClusterIP',
                  selector: { app: 'demo' },
                  ports: [{ port: 80, targetPort: 8080, protocol: 'TCP' }],
                });
              }, 500);
              // ConfigMap
              store.createConfigMap({
                name: 'demo-config',
                namespace: 'default',
                data: { 'config.json': '{"debug": false}' },
              });
              // Secret
              store.createSecret({
                name: 'demo-secret',
                namespace: 'default',
                type: 'Opaque',
                data: { 'api-key': '***hidden***' },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Play size={16} className="text-green-400" />
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
    </motion.button>
  );
}

function PodForm({ onCreate }: { onCreate: (pod: any) => void }) {
  const [name, setName] = useState('my-pod');
  const [namespace, setNamespace] = useState('default');
  const [image, setImage] = useState('nginx:latest');
  const [cpuRequest, setCpuRequest] = useState(100);
  const [memoryRequest, setMemoryRequest] = useState(128);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      labels: { app: name },
      containers: [{
        name: name,
        image,
        resources: {
          requests: { cpu: cpuRequest, memory: memoryRequest },
          limits: { cpu: cpuRequest * 2, memory: memoryRequest * 2 },
        },
      }],
    });
    setName('my-pod-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Box className="text-blue-400" />
        Create Pod
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <FormField label="Image" value={image} onChange={setImage} className="md:col-span-2" />
        <FormField label="CPU Request (millicores)" type="number" value={cpuRequest} onChange={(v) => setCpuRequest(Number(v))} />
        <FormField label="Memory Request (Mi)" type="number" value={memoryRequest} onChange={(v) => setMemoryRequest(Number(v))} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create Pod
      </button>
    </form>
  );
}

function DeploymentForm({ onCreate }: { onCreate: (deployment: any) => void }) {
  const [name, setName] = useState('my-deployment');
  const [namespace, setNamespace] = useState('default');
  const [replicas, setReplicas] = useState(3);
  const [image, setImage] = useState('nginx:latest');
  const [cpuRequest, setCpuRequest] = useState(100);
  const [memoryRequest, setMemoryRequest] = useState(128);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      desiredReplicas: replicas,
      selector: { app: name },
      template: {
        labels: { app: name },
        containers: [{
          name: name,
          image,
          resources: {
            requests: { cpu: cpuRequest, memory: memoryRequest },
            limits: { cpu: cpuRequest * 2, memory: memoryRequest * 2 },
          },
        }],
      },
    });
    setName('deployment-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Layers className="text-purple-400" />
        Create Deployment
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <FormField label="Replicas" type="number" value={replicas} onChange={(v) => setReplicas(Number(v))} />
        <FormField label="Image" value={image} onChange={setImage} />
        <FormField label="CPU Request (millicores)" type="number" value={cpuRequest} onChange={(v) => setCpuRequest(Number(v))} />
        <FormField label="Memory Request (Mi)" type="number" value={memoryRequest} onChange={(v) => setMemoryRequest(Number(v))} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create Deployment
      </button>
    </form>
  );
}

function ServiceForm({ onCreate, deployments }: { onCreate: (service: any) => void; deployments: any[] }) {
  const [name, setName] = useState('my-service');
  const [namespace, setNamespace] = useState('default');
  const [type, setType] = useState<'ClusterIP' | 'NodePort' | 'LoadBalancer'>('ClusterIP');
  const [port, setPort] = useState(80);
  const [targetPort, setTargetPort] = useState(80);
  const [selector, setSelector] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      type,
      selector: selector ? { app: selector } : { app: name },
      ports: [{ port, targetPort, protocol: 'TCP' as const }],
    });
    setName('service-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Network className="text-cyan-400" />
        Create Service
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
          >
            <option value="ClusterIP">ClusterIP</option>
            <option value="NodePort">NodePort</option>
            <option value="LoadBalancer">LoadBalancer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Target Deployment</label>
          <select
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
          >
            <option value="">Select deployment...</option>
            {deployments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <FormField label="Port" type="number" value={port} onChange={(v) => setPort(Number(v))} />
        <FormField label="Target Port" type="number" value={targetPort} onChange={(v) => setTargetPort(Number(v))} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create Service
      </button>
    </form>
  );
}

function IngressForm({ onCreate, services }: { onCreate: (ingress: any) => void; services: any[] }) {
  const [name, setName] = useState('my-ingress');
  const [namespace, setNamespace] = useState('default');
  const [host, setHost] = useState('app.example.com');
  const [path, setPath] = useState('/');
  const [serviceName, setServiceName] = useState('');
  const [servicePort, setServicePort] = useState(80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      rules: [{
        host,
        paths: [{
          path,
          pathType: 'Prefix' as const,
          backend: { serviceName: serviceName || 'my-service', servicePort },
        }],
      }],
    });
    setName('ingress-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Globe className="text-orange-400" />
        Create Ingress
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <FormField label="Host" value={host} onChange={setHost} />
        <FormField label="Path" value={path} onChange={setPath} />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Backend Service</label>
          <select
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
          >
            <option value="">Select service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <FormField label="Service Port" type="number" value={servicePort} onChange={(v) => setServicePort(Number(v))} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create Ingress
      </button>
    </form>
  );
}

function ConfigMapForm({ onCreate }: { onCreate: (configMap: any) => void }) {
  const [name, setName] = useState('my-configmap');
  const [namespace, setNamespace] = useState('default');
  const [dataKey, setDataKey] = useState('config.json');
  const [dataValue, setDataValue] = useState('{"key": "value"}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      data: { [dataKey]: dataValue },
    });
    setName('configmap-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="text-yellow-400" />
        Create ConfigMap
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <FormField label="Data Key" value={dataKey} onChange={setDataKey} />
        <FormField label="Data Value" value={dataValue} onChange={setDataValue} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create ConfigMap
      </button>
    </form>
  );
}

function SecretForm({ onCreate }: { onCreate: (secret: any) => void }) {
  const [name, setName] = useState('my-secret');
  const [namespace, setNamespace] = useState('default');
  const [type, setType] = useState<'Opaque' | 'kubernetes.io/tls'>('Opaque');
  const [dataKey, setDataKey] = useState('password');
  const [dataValue, setDataValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      namespace,
      type,
      data: { [dataKey]: dataValue || '***hidden***' },
    });
    setName('secret-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lock className="text-red-400" />
        Create Secret
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
          >
            <option value="Opaque">Opaque</option>
            <option value="kubernetes.io/tls">TLS</option>
          </select>
        </div>
        <FormField label="Data Key" value={dataKey} onChange={setDataKey} />
        <FormField label="Data Value" value={dataValue} onChange={setDataValue} type="password" />
      </div>

      <p className="text-sm text-slate-500">
        Note: In this simulation, secret values are not actually stored securely.
      </p>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create Secret
      </button>
    </form>
  );
}

function HPAForm({ onCreate, deployments }: { onCreate: (hpa: any) => void; deployments: any[] }) {
  const [name, setName] = useState('my-hpa');
  const [namespace, setNamespace] = useState('default');
  const [targetDeployment, setTargetDeployment] = useState('');
  const [minReplicas, setMinReplicas] = useState(1);
  const [maxReplicas, setMaxReplicas] = useState(10);
  const [targetCPU, setTargetCPU] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeployment) {
      alert('Please select a target deployment');
      return;
    }
    onCreate({
      name,
      namespace,
      targetRef: { kind: 'Deployment', name: targetDeployment },
      minReplicas,
      maxReplicas,
      metrics: [{ type: 'cpu' as const, targetValue: targetCPU }],
    });
    setName('hpa-' + Math.random().toString(36).slice(2, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Gauge className="text-green-400" />
        Create Horizontal Pod Autoscaler
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" value={name} onChange={setName} />
        <FormField label="Namespace" value={namespace} onChange={setNamespace} />
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Target Deployment</label>
          <select
            value={targetDeployment}
            onChange={(e) => setTargetDeployment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
          >
            <option value="">Select deployment...</option>
            {deployments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <FormField label="Min Replicas" type="number" value={minReplicas} onChange={(v) => setMinReplicas(Number(v))} />
        <FormField label="Max Replicas" type="number" value={maxReplicas} onChange={(v) => setMaxReplicas(Number(v))} />
        <FormField label="Target CPU (%)" type="number" value={targetCPU} onChange={(v) => setTargetCPU(Number(v))} />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <Plus size={18} />
        Create HPA
      </button>
    </form>
  );
}

function FormField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  className = ''
}: { 
  label: string; 
  value: string | number; 
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-k8s-blue"
      />
    </div>
  );
}

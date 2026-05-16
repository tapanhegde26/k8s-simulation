import { useState } from 'react';
import { ClusterArchitecture } from './components/ClusterArchitecture';
import { PodCreationFlow } from './components/PodCreationFlow';
import { PodCreationFlowAnimation } from './components/PodCreationFlowAnimation';
import { ServiceDiscoveryFlow } from './components/ServiceDiscoveryFlow';
import { IngressTrafficFlow } from './components/IngressTrafficFlow';
import { PodToPodFlow } from './components/PodToPodFlow';
import { NetworkPolicyFlow } from './components/NetworkPolicyFlow';
import { RBACAuthFlow } from './components/RBACAuthFlow';
import { SecretsManagementFlow } from './components/SecretsManagementFlow';
import { ServiceMeshMTLSFlow } from './components/ServiceMeshMTLSFlow';
import { NodeControlPlaneFlow } from './components/NodeControlPlaneFlow';
import { ResourceDashboard } from './components/ResourceDashboard';
import { InteractivePanel } from './components/InteractivePanel';
import { EventLog } from './components/EventLog';
import { ConnectionStatus } from './components/ConnectionStatus';
import { K8sArchitectureFlow } from './components/K8sArchitectureFlow';
import { useK8sStore } from './store/k8sStore';
import { useCluster } from './hooks/useCluster';
import { config } from './config';
import { 
  Server, 
  GitBranch, 
  Layers, 
  Activity,
  Box,
  Menu,
  X,
  RefreshCw,
  Workflow,
  PanelRightOpen,
  PanelRightClose,
  Zap,
  Network,
  ArrowRightLeft,
  Cable,
  Shield,
  KeyRound,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

type Tab = 
  | 'architecture' 
  | 'flow-animation' 
  | 'node-cp-communication'
  | 'pod-flow' 
  | 'pod-flow-animation' 
  | 'service-discovery' 
  | 'ingress-traffic' 
  | 'pod-to-pod' 
  | 'network-policy'
  | 'rbac-auth'
  | 'secrets-management'
  | 'service-mesh-mtls'
  | 'resources' 
  | 'interactive';

type Category = 'architecture' | 'networking' | 'security' | 'tools';

interface TabItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  category: Category;
}

interface CategoryInfo {
  id: Category;
  label: string;
  icon: LucideIcon;
  color: string;
}

const categories: CategoryInfo[] = [
  { id: 'architecture', label: 'Architecture', icon: Server, color: 'text-blue-400' },
  { id: 'networking', label: 'Networking', icon: Network, color: 'text-green-400' },
  { id: 'security', label: 'Security', icon: Shield, color: 'text-amber-400' },
  { id: 'tools', label: 'Tools & Resources', icon: Layers, color: 'text-purple-400' },
];

const tabs: TabItem[] = [
  // Architecture
  { id: 'architecture', label: 'Cluster Overview', icon: Server, category: 'architecture' },
  { id: 'flow-animation', label: 'Architecture Flow', icon: Workflow, category: 'architecture' },
  { id: 'node-cp-communication', label: 'Node ↔ Control Plane', icon: ArrowRightLeft, category: 'architecture' },
  { id: 'pod-flow-animation', label: 'Pod Creation Flow', icon: Zap, category: 'architecture' },
  { id: 'pod-flow', label: 'Pod Timeline', icon: GitBranch, category: 'architecture' },
  
  // Networking
  { id: 'service-discovery', label: 'Service Discovery', icon: Network, category: 'networking' },
  { id: 'ingress-traffic', label: 'Ingress Traffic', icon: ArrowRightLeft, category: 'networking' },
  { id: 'pod-to-pod', label: 'Pod-to-Pod (CNI)', icon: Cable, category: 'networking' },
  
  // Security
  { id: 'network-policy', label: 'Network Policies', icon: Shield, category: 'security' },
  { id: 'rbac-auth', label: 'RBAC Authorization', icon: KeyRound, category: 'security' },
  { id: 'secrets-management', label: 'Secrets Management', icon: Lock, category: 'security' },
  { id: 'service-mesh-mtls', label: 'Service Mesh mTLS', icon: ShieldCheck, category: 'security' },
  
  // Tools
  { id: 'resources', label: 'Resources', icon: Layers, category: 'tools' },
  { id: 'interactive', label: 'Interactive Lab', icon: Activity, category: 'tools' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('architecture');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEventLog, setShowEventLog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set(['architecture', 'networking', 'security', 'tools'])
  );
  
  const backendCluster = useCluster();
  const isBackendMode = config.useBackend && backendCluster.cluster;
  void isBackendMode;

  const toggleCategory = (category: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getTabsByCategory = (category: Category) => {
    return tabs.filter(tab => tab.category === category);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="k8s-gradient px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Kubernetes Cluster Simulation</h1>
              <p className="text-sm text-blue-200">Interactive Learning Platform</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-sm">
          <ConnectionStatus 
            status={backendCluster.connectionStatus}
            clusterName={backendCluster.cluster?.config.name}
            nodeCount={backendCluster.cluster?.stats.total_nodes}
            podCount={backendCluster.cluster?.stats.total_pods}
          />
          
          {isBackendMode && (
            <button
              onClick={() => backendCluster.refreshCluster()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh cluster data"
            >
              <RefreshCw size={16} className={backendCluster.isLoading ? 'animate-spin' : ''} />
            </button>
          )}
          
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
            Cluster: {backendCluster.cluster?.status || 'Healthy'}
          </span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
            v{backendCluster.cluster?.config.kubernetes_version || '1.28.0'}
          </span>
          
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={showEventLog ? 'Hide Event Log' : 'Show Event Log'}
          >
            {showEventLog ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar with Categories */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed lg:relative lg:translate-x-0
          w-64 h-[calc(100vh-72px)] bg-slate-800/50 border-r border-slate-700
          transition-transform duration-300 z-40 overflow-y-auto
        `}>
          <nav className="p-4 space-y-1">
            {categories.map((category) => (
              <div key={category.id} className="mb-2">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <category.icon size={16} className={category.color} />
                    <span className={`text-sm font-semibold ${category.color}`}>
                      {category.label}
                    </span>
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown size={16} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-500" />
                  )}
                </button>

                {/* Category Items */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-2 mt-1 space-y-1">
                    {getTabsByCategory(category.id).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                          ${activeTab === tab.id 
                            ? 'bg-k8s-blue text-white shadow-lg shadow-k8s-blue/30' 
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}
                        `}
                      >
                        <tab.icon size={16} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800/50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Quick Stats</h3>
            <QuickStats />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-72px)] overflow-hidden">
          <div className="h-full flex">
            {/* Primary Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'architecture' && <ClusterArchitecture />}
              {activeTab === 'flow-animation' && (
                <div className="h-full min-h-[700px]">
                  <K8sArchitectureFlow />
                </div>
              )}
              {activeTab === 'node-cp-communication' && (
                <div className="h-full min-h-[500px]">
                  <NodeControlPlaneFlow />
                </div>
              )}
              {activeTab === 'pod-flow-animation' && (
                <div className="h-full min-h-[700px]">
                  <PodCreationFlowAnimation />
                </div>
              )}
              {activeTab === 'service-discovery' && (
                <div className="h-full min-h-[700px]">
                  <ServiceDiscoveryFlow />
                </div>
              )}
              {activeTab === 'ingress-traffic' && (
                <div className="h-full min-h-[500px]">
                  <IngressTrafficFlow />
                </div>
              )}
              {activeTab === 'pod-to-pod' && (
                <div className="h-full min-h-[500px]">
                  <PodToPodFlow />
                </div>
              )}
              {activeTab === 'network-policy' && (
                <div className="h-full min-h-[500px]">
                  <NetworkPolicyFlow />
                </div>
              )}
              {activeTab === 'rbac-auth' && (
                <div className="h-full min-h-[500px]">
                  <RBACAuthFlow />
                </div>
              )}
              {activeTab === 'secrets-management' && (
                <div className="h-full min-h-[500px]">
                  <SecretsManagementFlow />
                </div>
              )}
              {activeTab === 'service-mesh-mtls' && (
                <div className="h-full min-h-[500px]">
                  <ServiceMeshMTLSFlow />
                </div>
              )}
              {activeTab === 'pod-flow' && <PodCreationFlow />}
              {activeTab === 'resources' && <ResourceDashboard />}
              {activeTab === 'interactive' && <InteractivePanel />}
            </div>

            {/* Event Log Sidebar - Optional */}
            {showEventLog && (
              <div className="w-80 border-l border-slate-700 bg-slate-800/30">
                <EventLog />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function QuickStats() {
  const localStore = useK8sStore();
  const backendCluster = useCluster();
  
  const isBackendMode = config.useBackend && backendCluster.cluster;
  
  const stats = isBackendMode ? [
    { label: 'Nodes', value: backendCluster.cluster?.stats.total_nodes || 0 },
    { label: 'Pods', value: backendCluster.cluster?.stats.total_pods || 0 },
    { label: 'Deployments', value: backendCluster.cluster?.stats.total_deployments || 0 },
    { label: 'Services', value: backendCluster.cluster?.stats.total_services || 0 },
  ] : [
    { label: 'Nodes', value: localStore.nodes.length },
    { label: 'Pods', value: localStore.pods.length },
    { label: 'Deployments', value: localStore.deployments.length },
    { label: 'Services', value: localStore.services.length },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-k8s-blue">{stat.value}</div>
          <div className="text-xs text-slate-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default App;

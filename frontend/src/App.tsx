import { useState } from 'react';
import { ClusterArchitecture } from './components/ClusterArchitecture';
import { PodCreationFlow } from './components/PodCreationFlow';
import { PodCreationFlowAnimation } from './components/PodCreationFlowAnimation';
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
  HardDrive
} from 'lucide-react';
import { PersistentVolumeFlowAnimation } from './components/PersistentVolumeFlowAnimation';

type Tab = 'architecture' | 'flow-animation' | 'pod-flow' | 'pod-flow-animation' | 'pv-flow-animation' | 'resources' | 'interactive';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('architecture');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEventLog, setShowEventLog] = useState(false);
  
  // Backend cluster hook (only used when backend is enabled)
  const backendCluster = useCluster();
  
  // Determine which data source to use
  const isBackendMode = config.useBackend && backendCluster.cluster;
  
  // We keep localStore reference for components that still use it
  void isBackendMode; // Used in JSX
  
  const tabs = [
    { id: 'architecture' as Tab, label: 'Cluster Architecture', icon: Server },
    { id: 'flow-animation' as Tab, label: 'Architecture Flow', icon: Workflow },
    { id: 'pod-flow-animation' as Tab, label: 'Pod Creation Flow', icon: Zap },
    { id: 'pv-flow-animation' as Tab, label: 'PV / PVC Flow', icon: HardDrive },
    { id: 'pod-flow' as Tab, label: 'Pod Flow (Timeline)', icon: GitBranch },
    { id: 'resources' as Tab, label: 'Resources', icon: Layers },
    { id: 'interactive' as Tab, label: 'Interactive Lab', icon: Activity },
  ];

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
          {/* Connection Status */}
          <ConnectionStatus 
            status={backendCluster.connectionStatus}
            clusterName={backendCluster.cluster?.config.name}
            nodeCount={backendCluster.cluster?.stats.total_nodes}
            podCount={backendCluster.cluster?.stats.total_pods}
          />
          
          {/* Refresh button for backend mode */}
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
          
          {/* Toggle Event Log */}
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
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed lg:relative lg:translate-x-0
          w-64 h-[calc(100vh-72px)] bg-slate-800/50 border-r border-slate-700
          transition-transform duration-300 z-40
        `}>
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${activeTab === tab.id 
                    ? 'bg-k8s-blue text-white shadow-lg shadow-k8s-blue/30' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}
                `}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
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
              {activeTab === 'pod-flow-animation' && (
                <div className="h-full min-h-[700px]">
                  <PodCreationFlowAnimation />
                </div>
              )}
              {activeTab === 'pv-flow-animation' && (
                <div className="h-full min-h-[700px]">
                  <PersistentVolumeFlowAnimation />
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
  
  // Use backend data if available, otherwise use local store
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

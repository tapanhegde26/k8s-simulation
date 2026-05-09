// Connection Status Component - shows backend connection state

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2, AlertCircle, Server } from 'lucide-react';
import { config } from '../config';

interface ConnectionStatusProps {
  status: string;
  clusterName?: string;
  nodeCount?: number;
  podCount?: number;
}

export function ConnectionStatus({ status, clusterName, nodeCount, podCount }: ConnectionStatusProps) {
  if (!config.useBackend) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <Server className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-400">Local Mode</span>
      </div>
    );
  }

  const statusConfig = {
    connecting: {
      icon: Loader2,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'Connecting...',
      animate: true,
    },
    connected: {
      icon: Wifi,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'Connected',
      animate: false,
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      label: 'Disconnected',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Error',
      animate: false,
    },
  };

  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 ${cfg.bg} border ${cfg.border} rounded-lg`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${cfg.color} ${cfg.animate ? 'animate-spin' : ''}`} />
        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
      </div>
      
      {status === 'connected' && clusterName && (
        <>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{clusterName}</span>
            {nodeCount !== undefined && (
              <span>{nodeCount} nodes</span>
            )}
            {podCount !== undefined && (
              <span>{podCount} pods</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile/sidebar
export function ConnectionStatusCompact({ status }: { status: string }) {
  if (!config.useBackend) {
    return (
      <div className="w-2 h-2 rounded-full bg-yellow-400" title="Local Mode" />
    );
  }

  const colors = {
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-green-400',
    disconnected: 'bg-slate-400',
    error: 'bg-red-400',
  };

  const color = colors[status as keyof typeof colors] || colors.disconnected;

  return (
    <motion.div
      className={`w-2 h-2 rounded-full ${color}`}
      title={status}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    />
  );
}

export default ConnectionStatus;

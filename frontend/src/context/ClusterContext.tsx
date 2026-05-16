// Cluster Context - provides cluster state to the entire app

import { createContext, useContext, ReactNode } from 'react';
import { useCluster, UseClusterReturn } from '../hooks/useCluster';

const ClusterContext = createContext<UseClusterReturn | null>(null);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const cluster = useCluster();
  
  return (
    <ClusterContext.Provider value={cluster}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusterContext(): UseClusterReturn {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useClusterContext must be used within a ClusterProvider');
  }
  return context;
}

export default ClusterContext;

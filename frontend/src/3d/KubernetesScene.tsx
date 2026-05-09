// Kubernetes Scene - Main 3D scene container

import { useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { KubernetesSceneProps, SelectedObject, Node3D, Pod3D } from './types';
import { useClusterScene } from './hooks/useClusterScene';
import { useAnimationQueue } from './hooks/useAnimationQueue';

import { SkyEnvironment } from './scenes/SkyEnvironment';
import { ClusterPlatform } from './scenes/ClusterPlatform';
import { ControlPlaneIsland } from './scenes/ControlPlaneIsland';

import { NodeBuilding } from './objects/NodeBuilding';
import { ServicePipeline } from './objects/ServicePipeline';

import { CameraController } from './controls/CameraController';
import { ObjectSelector, SelectionState } from './controls/ObjectSelector';

import { GlowEffect } from './effects/GlowEffect';
import { ParticleSystem } from './effects/ParticleSystem';

import { PodCreationJourney } from './animations/PodCreationJourney';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#326CE5" wireframe />
    </mesh>
  );
}

interface SceneContentProps {
  sceneData: ReturnType<typeof useClusterScene>;
  selectedObject: SelectedObject | null;
  onSelectObject: (selection: SelectionState) => void;
  activeAnimation: { podName: string; targetNode: Node3D } | null;
  onAnimationComplete: () => void;
}

function SceneContent({
  sceneData,
  selectedObject,
  onSelectObject,
  activeAnimation,
  onAnimationComplete,
}: SceneContentProps) {
  const { nodes, pods, services, controlPlane } = sceneData;

  const getPodsByNode = useCallback((nodeName: string): Pod3D[] => {
    return pods.filter((pod) => pod.nodeName === nodeName);
  }, [pods]);

  return (
    <>
      <SkyEnvironment />
      <ClusterPlatform radius={15} />

      <ObjectSelector onSelect={onSelectObject}>
        {/* Control Plane */}
        <ControlPlaneIsland
          components={controlPlane}
          selectedComponent={selectedObject?.type === 'control-plane' ? selectedObject.name : null}
          onSelectComponent={(name) => onSelectObject({ type: 'control-plane', id: name, name })}
        />

        {/* Nodes */}
        {nodes.map((node) => (
          <NodeBuilding
            key={node.id}
            node={node}
            pods={getPodsByNode(node.name)}
            isSelected={selectedObject?.type === 'node' && selectedObject.id === node.id}
            selectedPodId={selectedObject?.type === 'pod' ? selectedObject.id : null}
            onClick={() => onSelectObject({ type: 'node', id: node.id, name: node.name })}
            onPodClick={(podId) => {
              const pod = pods.find((p) => p.id === podId);
              if (pod) onSelectObject({ type: 'pod', id: podId, name: pod.name });
            }}
          />
        ))}

        {/* Services */}
        {services.map((service) => (
          <ServicePipeline
            key={service.id}
            service={service}
            pods={pods}
            isSelected={selectedObject?.type === 'service' && selectedObject.id === service.id}
            onClick={() => onSelectObject({ type: 'service', id: service.id, name: service.name })}
          />
        ))}
      </ObjectSelector>

      {/* Particles */}
      <ParticleSystem count={150} bounds={12} />

      {/* Pod Creation Animation */}
      {activeAnimation && (
        <PodCreationJourney
          podName={activeAnimation.podName}
          targetNodePosition={activeAnimation.targetNode.position}
          isActive={true}
          onComplete={onAnimationComplete}
        />
      )}

      {/* Camera */}
      <CameraController
        mode={selectedObject ? 'focus' : 'orbit'}
        focusTarget={selectedObject ? getFocusTarget(selectedObject, nodes, pods, services) : null}
        autoRotate={!selectedObject}
      />

      {/* Post-processing */}
      <GlowEffect intensity={0.4} />
    </>
  );
}

function getFocusTarget(
  selected: SelectedObject,
  nodes: Node3D[],
  pods: Pod3D[],
  services: ReturnType<typeof useClusterScene>['services']
): [number, number, number] | null {
  switch (selected.type) {
    case 'node': {
      const node = nodes.find((n) => n.id === selected.id);
      return node?.position || null;
    }
    case 'pod': {
      const pod = pods.find((p) => p.id === selected.id);
      return pod?.position || null;
    }
    case 'service': {
      const service = services.find((s) => s.id === selected.id);
      return service?.position || null;
    }
    case 'control-plane':
      return [0, 2, -12];
    default:
      return null;
  }
}

export function KubernetesScene({
  cluster,
  pods,
  services,
  events,
  onSelectObject,
}: KubernetesSceneProps) {
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<{ podName: string; targetNode: Node3D } | null>(null);

  const sceneData = useClusterScene(cluster, pods, services);
  const animationQueue = useAnimationQueue();

  const handleSelect = useCallback((selection: SelectionState) => {
    if (selection.type && selection.id && selection.name) {
      setSelectedObject({ type: selection.type, id: selection.id, name: selection.name });
      onSelectObject?.(selection.type, selection.id, selection.name);
    } else {
      setSelectedObject(null);
    }
  }, [onSelectObject]);

  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      
      if (latestEvent.type === 'pod.scheduled' && latestEvent.details) {
        const nodeName = latestEvent.details.node_name as string;
        const targetNode = sceneData.nodes.find((n) => n.name === nodeName);
        
        if (targetNode && !activeAnimation) {
          setActiveAnimation({
            podName: latestEvent.resource_name || 'pod',
            targetNode,
          });
        }
      }
    }
  }, [events, sceneData.nodes, activeAnimation]);

  const handleAnimationComplete = useCallback(() => {
    setActiveAnimation(null);
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [12, 12, 12], fov: 50 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            sceneData={sceneData}
            selectedObject={selectedObject}
            onSelectObject={handleSelect}
            activeAnimation={activeAnimation}
            onAnimationComplete={handleAnimationComplete}
          />
        </Suspense>
      </Canvas>

      {/* Info Panel */}
      {selectedObject && (
        <InfoPanel
          selected={selectedObject}
          sceneData={sceneData}
          onClose={() => setSelectedObject(null)}
        />
      )}

      {/* Controls Legend */}
      <ControlsLegend />

      {/* Animation Speed Control */}
      <AnimationControls
        speed={animationQueue.speed}
        isPaused={animationQueue.isPaused}
        onSpeedChange={animationQueue.setSpeed}
        onPause={animationQueue.pause}
        onResume={animationQueue.resume}
      />
    </div>
  );
}

interface InfoPanelProps {
  selected: SelectedObject;
  sceneData: ReturnType<typeof useClusterScene>;
  onClose: () => void;
}

function InfoPanel({ selected, sceneData, onClose }: InfoPanelProps) {
  const getInfo = () => {
    switch (selected.type) {
      case 'node': {
        const node = sceneData.nodes.find((n) => n.id === selected.id);
        if (!node) return null;
        return {
          title: node.name,
          subtitle: `${node.role.toUpperCase()} Node`,
          details: [
            { label: 'Status', value: node.status },
            { label: 'Pods', value: node.podCount.toString() },
            { label: 'CPU', value: `${Math.round(node.allocatedCpu / node.allocatableCpu * 100)}%` },
            { label: 'Memory', value: `${Math.round(node.allocatedMemory / node.allocatableMemory * 100)}%` },
          ],
        };
      }
      case 'pod': {
        const pod = sceneData.pods.find((p) => p.id === selected.id);
        if (!pod) return null;
        return {
          title: pod.name,
          subtitle: `Pod in ${pod.namespace}`,
          details: [
            { label: 'Phase', value: pod.phase },
            { label: 'Node', value: pod.nodeName || 'Pending' },
            { label: 'Containers', value: pod.containerCount.toString() },
            { label: 'CPU Request', value: `${pod.cpuRequest}m` },
          ],
        };
      }
      case 'service': {
        const service = sceneData.services.find((s) => s.id === selected.id);
        if (!service) return null;
        return {
          title: service.name,
          subtitle: `${service.type} Service`,
          details: [
            { label: 'Cluster IP', value: service.clusterIP || 'None' },
            { label: 'Endpoints', value: service.connectedPodIds.length.toString() },
          ],
        };
      }
      case 'control-plane': {
        const component = sceneData.controlPlane.find((c) => c.name === selected.name);
        if (!component) return null;
        return {
          title: selected.name,
          subtitle: 'Control Plane Component',
          details: [
            { label: 'Status', value: component.status },
            { label: 'Health', value: component.health },
          ],
        };
      }
      default:
        return null;
    }
  };

  const info = getInfo();
  if (!info) return null;

  return (
    <div className="absolute top-4 right-4 w-72 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl">
      <div className="p-4 border-b border-slate-700 flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-white">{info.title}</h3>
          <p className="text-sm text-slate-400">{info.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="p-4 space-y-2">
        {info.details.map((detail) => (
          <div key={detail.label} className="flex justify-between text-sm">
            <span className="text-slate-400">{detail.label}</span>
            <span className="text-white font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlsLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-xs text-slate-300">
      <div className="font-semibold mb-2 text-white">Controls</div>
      <div className="space-y-1">
        <div>🖱️ Drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>👆 Click to select</div>
      </div>
    </div>
  );
}

interface AnimationControlsProps {
  speed: number;
  isPaused: boolean;
  onSpeedChange: (speed: number) => void;
  onPause: () => void;
  onResume: () => void;
}

function AnimationControls({ speed, isPaused, onSpeedChange, onPause, onResume }: AnimationControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
      <button
        onClick={isPaused ? onResume : onPause}
        className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
      >
        {isPaused ? '▶' : '⏸'}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Speed:</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="bg-slate-700 text-white text-xs rounded px-2 py-1 border-none"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>
    </div>
  );
}

export default KubernetesScene;

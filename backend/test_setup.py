"""Test script to verify backend setup."""

import asyncio
import sys
sys.path.insert(0, '.')

async def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        from app.config import settings
        print(f"  ✓ Config loaded: {settings.app_name}")
        
        from app.schemas.kubernetes import Pod, Deployment, Service
        print("  ✓ Kubernetes schemas loaded")
        
        from app.schemas.cluster import Cluster, ClusterConfig
        print("  ✓ Cluster schemas loaded")
        
        from app.schemas.events import EventType, ClusterEvent
        print("  ✓ Event schemas loaded")
        
        from app.schemas.scenarios import Scenario, BUILTIN_SCENARIOS
        print(f"  ✓ Scenarios loaded: {len(BUILTIN_SCENARIOS)} built-in scenarios")
        
        from app.core.events import event_bus
        print("  ✓ Event bus loaded")
        
        from app.core.state_machine import create_pod_state_machine, PodState
        print("  ✓ State machine loaded")
        
        from app.services.scheduler import Scheduler
        print("  ✓ Scheduler loaded")
        
        from app.services.autoscaler import HPAController, ClusterAutoscaler
        print("  ✓ Autoscaler loaded")
        
        from app.services.simulator import ClusterSimulator
        print("  ✓ Simulator loaded")
        
        print("\n✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_simulator():
    """Test basic simulator functionality."""
    print("\nTesting simulator...")
    
    try:
        from uuid import uuid4
        from app.schemas.cluster import ClusterConfig
        from app.services.simulator import ClusterSimulator
        
        # Create a cluster
        config = ClusterConfig(name="test-cluster", worker_nodes=2)
        simulator = ClusterSimulator(uuid4(), config)
        
        await simulator.initialize()
        print(f"  ✓ Cluster initialized with {len(simulator.nodes)} nodes")
        
        # Check nodes
        master_nodes = [n for n in simulator.nodes.values() if n.role == "master"]
        worker_nodes = [n for n in simulator.nodes.values() if n.role == "worker"]
        print(f"  ✓ Master nodes: {len(master_nodes)}, Worker nodes: {len(worker_nodes)}")
        
        # Get stats
        stats = simulator.get_stats()
        print(f"  ✓ Stats: {stats.total_nodes} nodes, {stats.total_pods} pods")
        
        print("\n✅ Simulator test passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Simulator error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_scheduler():
    """Test scheduler functionality."""
    print("\nTesting scheduler...")
    
    try:
        from uuid import uuid4
        from app.schemas.kubernetes import (
            Pod, PodSpec, Container, ObjectMeta, PodStatus,
            Node, NodeSpec, NodeStatus, NodeCondition, NodeConditionType, NodeResources
        )
        from app.services.scheduler import Scheduler
        
        scheduler = Scheduler()
        
        # Create test nodes
        nodes = []
        for i in range(3):
            node = Node(
                metadata=ObjectMeta(name=f"worker-{i+1}", uid=uuid4()),
                spec=NodeSpec(),
                status=NodeStatus(
                    conditions=[NodeCondition(type=NodeConditionType.READY, status="True")],
                    allocatable=NodeResources(cpu_millicores=4000, memory_mb=8192, pods=110),
                    allocated=NodeResources(cpu_millicores=i*500, memory_mb=i*512, pods=i*5)
                ),
                role="worker"
            )
            nodes.append(node)
        
        # Create test pod
        pod = Pod(
            metadata=ObjectMeta(name="test-pod", namespace="default", uid=uuid4()),
            spec=PodSpec(containers=[Container(name="nginx", image="nginx:latest")]),
            status=PodStatus()
        )
        
        # Schedule
        result = scheduler.schedule(pod, nodes)
        print(f"  ✓ Scheduling result: success={result.success}, node={result.selected_node}")
        
        if result.success:
            explanation = scheduler.get_scheduling_explanation(result)
            print(f"  ✓ Explanation generated ({len(explanation)} chars)")
        
        print("\n✅ Scheduler test passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Scheduler error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("=" * 50)
    print("K8s Simulation Backend - Test Suite")
    print("=" * 50)
    
    results = []
    results.append(await test_imports())
    results.append(await test_simulator())
    results.append(await test_scheduler())
    
    print("\n" + "=" * 50)
    if all(results):
        print("All tests passed! ✅")
        print("\nTo start the server, run:")
        print("  cd backend")
        print("  pip install -r requirements.txt")
        print("  uvicorn app.main:app --reload")
    else:
        print("Some tests failed! ❌")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())

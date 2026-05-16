# K8s Simulation Backend

FastAPI backend for the Kubernetes Cluster Simulation educational platform.

## Features

- **Cluster Simulation Engine**: Full simulation of Kubernetes cluster behavior
- **REST API**: Complete CRUD operations for K8s resources
- **WebSocket Events**: Real-time cluster event streaming
- **Learning Scenarios**: Built-in educational scenarios with objectives
- **Pod Scheduling**: Realistic scheduler simulation with filtering and scoring
- **HPA Simulation**: Horizontal Pod Autoscaler with load simulation

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker build -t k8s-simulation-backend .
docker run -p 8000:8000 k8s-simulation-backend
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Clusters
- `POST /api/v1/clusters` - Create a new cluster
- `GET /api/v1/clusters` - List all clusters
- `GET /api/v1/clusters/{id}` - Get cluster details
- `DELETE /api/v1/clusters/{id}` - Delete a cluster
- `POST /api/v1/clusters/{id}/nodes` - Add a worker node
- `DELETE /api/v1/clusters/{id}/nodes/{name}` - Remove a node
- `POST /api/v1/clusters/{id}/reset` - Reset cluster state

### Resources
- `GET/POST /api/v1/clusters/{id}/pods` - List/Create pods
- `GET/POST /api/v1/clusters/{id}/deployments` - List/Create deployments
- `PATCH /api/v1/clusters/{id}/namespaces/{ns}/deployments/{name}/scale` - Scale deployment
- `GET/POST /api/v1/clusters/{id}/services` - List/Create services
- `GET/POST /api/v1/clusters/{id}/configmaps` - List/Create ConfigMaps
- `GET/POST /api/v1/clusters/{id}/secrets` - List/Create Secrets
- `GET/POST /api/v1/clusters/{id}/hpas` - List/Create HPAs

### Quick Actions
- `POST /api/v1/clusters/{id}/quick/nginx` - Deploy nginx with service
- `POST /api/v1/clusters/{id}/quick/full-stack` - Deploy full stack demo

### Scenarios
- `GET /api/v1/scenarios` - List learning scenarios
- `GET /api/v1/scenarios/{id}` - Get scenario details
- `POST /api/v1/clusters/{id}/scenarios/{sid}/start` - Start a scenario
- `POST /api/v1/clusters/{id}/scenarios/{sid}/validate` - Validate objectives

### WebSocket
- `WS /ws/clusters/{id}/events` - Real-time event stream

## WebSocket Events

Connect to receive real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/clusters/{cluster_id}/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.message);
};
```

Event types include:
- `pod.created`, `pod.scheduled`, `pod.running`, `pod.deleted`
- `deployment.created`, `deployment.scaled`
- `node.added`, `node.removed`
- `hpa.triggered`, `hpa.scaled_up`, `hpa.scaled_down`
- Pod creation flow events (14 detailed steps)

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── cluster.py      # Cluster endpoints
│   │   │   ├── resources.py    # Resource CRUD
│   │   │   └── scenarios.py    # Learning scenarios
│   │   └── websocket.py        # WebSocket handler
│   ├── core/
│   │   ├── events.py           # Event bus
│   │   └── state_machine.py    # Resource state machines
│   ├── db/
│   │   └── database.py         # SQLAlchemy setup
│   ├── models/
│   │   └── database.py         # ORM models
│   ├── schemas/
│   │   ├── kubernetes.py       # K8s resource schemas
│   │   ├── cluster.py          # Cluster schemas
│   │   ├── events.py           # Event schemas
│   │   └── scenarios.py        # Scenario schemas
│   ├── services/
│   │   ├── simulator.py        # Main simulation engine
│   │   ├── scheduler.py        # Pod scheduler
│   │   └── autoscaler.py       # HPA/Cluster autoscaler
│   ├── config.py               # Settings
│   └── main.py                 # FastAPI app
├── tests/
├── requirements.txt
└── Dockerfile
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode |
| `ENVIRONMENT` | `development` | Environment name |
| `DATABASE_URL` | `sqlite+aiosqlite:///./k8s_simulation.db` | Database connection |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

## License

MIT

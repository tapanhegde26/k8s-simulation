# Kubernetes Cluster Simulation


[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)


An interactive learning platform for understanding Kubernetes architecture, components, and workflows through visual animations and hands-on experimentation.


## Why This Project?


Learning Kubernetes from documentation can be overwhelming. This simulator helps you **see** how components work together:


- Watch a pod get created step-by-step: `API Server → etcd → Scheduler → Kubelet → Container`
- Understand control plane and worker node communication visually
- Experiment without needing a real cluster or cloud costs


## Demo


### Architecture Flow
See how Kubernetes components communicate with each other:


<p align="center">
 <img src="docs/arch-flow-demo.gif" alt="Architecture Flow Animation" width="700">
</p>


### Pod Creation Flow
Watch the step-by-step process of creating a pod:


<p align="center">
 <img src="docs/pod-creation-demo.gif" alt="Pod Creation Flow Animation" width="700">
</p>


## Project Structure


```
k8s-simulation/
├── frontend/          # React-based web application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── README.md      # Frontend documentation
│
├── backend/           # Python FastAPI backend
│   ├── app/           # Application code
│   ├── tests/         # Test files
│   └── README.md      # Backend documentation
│
├── docker-compose.yml # Docker orchestration
├── Makefile           # Common commands
└── README.md          # This file
```


## Features


### Frontend (React + TypeScript)
- **Cluster Architecture View** - Visual representation of K8s control plane and worker nodes
- **Architecture Flow Animation** - Animated visualization of component interactions
- **Pod Creation Flow Animation** - Step-by-step animated pod creation process
- **Resource Dashboard** - Monitor cluster resources
- **Interactive Lab** - Hands-on experimentation


### Backend (Python + FastAPI)
- RESTful API for cluster simulation
- WebSocket support for real-time updates
- SQLite database for persistence
- Simulated K8s operations


## Quick Start


### Option 1: Frontend Only (Recommended for Learning)


```bash
cd frontend
npm install
npm run dev
```


Open http://localhost:5173 in your browser.


### Option 2: Full Stack with Docker


```bash
# Start both frontend and backend
docker-compose up


# Or run in background
docker-compose up -d
```


- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs


### Option 3: Run Separately


**Frontend:**
```bash
cd frontend
npm install
npm run dev
```


**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```


## Using the Makefile


For convenience, common commands are available via Make:


```bash
make help           # Show all available commands


# Frontend commands
make frontend-install   # Install frontend dependencies
make frontend-dev       # Start frontend dev server
make frontend-build     # Build frontend for production


# Backend commands
make backend-install    # Install backend dependencies
make backend-dev        # Start backend dev server
make backend-test       # Run backend tests


# Docker commands
make docker-up          # Start all services
make docker-down        # Stop all services
make docker-logs        # View logs


# Utility commands
make clean              # Clean build artifacts
make install            # Install all dependencies
make dev                # Start both frontend and backend
```


## Environment Variables


### Frontend (.env in frontend/)
```env
VITE_API_URL=http://localhost:8000
VITE_USE_BACKEND=false
```


### Backend (.env in backend/)
```env
DEBUG=true
ENVIRONMENT=development
DATABASE_URL=sqlite+aiosqlite:///./k8s_simulation.db
```


## Learning Path


1. **Start with Cluster Architecture** - Understand the basic components
2. **Watch Architecture Flow** - See how components interact
3. **Explore Pod Creation Flow** - Learn the detailed pod creation process
4. **Try Interactive Lab** - Experiment with creating resources


## Tech Stack


| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| Containerization | Docker, Docker Compose |


## Contributing


1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request


## License


MIT License - feel free to use this for learning and education.




.PHONY: help install clean dev frontend-install frontend-dev frontend-build backend-install backend-dev backend-test docker-up docker-down docker-logs

# Default target
help:
	@echo "Kubernetes Cluster Simulation - Available Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make install          Install all dependencies (frontend + backend)"
	@echo "  make dev              Start both frontend and backend dev servers"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make frontend-install Install frontend dependencies"
	@echo "  make frontend-dev     Start frontend development server"
	@echo "  make frontend-build   Build frontend for production"
	@echo "  make frontend-preview Preview production build"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make backend-install  Install backend dependencies"
	@echo "  make backend-dev      Start backend development server"
	@echo "  make backend-test     Run backend tests"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up        Start all services with Docker"
	@echo "  make docker-down      Stop all Docker services"
	@echo "  make docker-logs      View Docker logs"
	@echo "  make docker-build     Build Docker images"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean            Clean build artifacts"
	@echo "  make help             Show this help message"

# Install all dependencies
install: frontend-install backend-install
	@echo "All dependencies installed!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Clean complete!"

# Start both frontend and backend
dev:
	@echo "Starting development servers..."
	@echo "Frontend will be at http://localhost:5173"
	@echo "Backend will be at http://localhost:8000"
	@make -j2 frontend-dev backend-dev

# ============ Frontend Commands ============

frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

frontend-dev:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

frontend-build:
	@echo "Building frontend for production..."
	cd frontend && npm run build

frontend-preview:
	@echo "Previewing production build..."
	cd frontend && npm run preview

# ============ Backend Commands ============

backend-install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

backend-dev:
	@echo "Starting backend development server..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-test:
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v

# ============ Docker Commands ============

docker-up:
	@echo "Starting Docker services..."
	docker-compose up

docker-up-detached:
	@echo "Starting Docker services in background..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-build:
	@echo "Building Docker images..."
	docker-compose build

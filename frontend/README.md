# Kubernetes Cluster Simulation - Frontend

Interactive React-based visualization for learning Kubernetes architecture and concepts.

## Features

- **Cluster Architecture View** - Visual representation of control plane and worker nodes
- **Architecture Flow Animation** - 2D animated visualization of K8s component interactions
- **Pod Creation Flow Animation** - Step-by-step animated visualization of pod creation process
- **Pod Flow Timeline** - Detailed timeline view of pod creation steps
- **Resource Dashboard** - Monitor cluster resources
- **Interactive Lab** - Hands-on experimentation

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Three.js** for 3D visualizations
- **Zustand** for state management

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── K8sArchitectureFlow/    # Architecture flow animation
│   │   ├── PodCreationFlowAnimation/  # Pod creation animation
│   │   └── ...
│   ├── 3d/                  # Three.js 3D components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript types
│   ├── config/              # Configuration
│   ├── context/             # React contexts
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Environment Variables

Create a `.env` file (or use the root `.env`):

```env
VITE_API_URL=http://localhost:8000
VITE_USE_BACKEND=false
```

## Development

The frontend can run in two modes:

1. **Standalone Mode** (`VITE_USE_BACKEND=false`) - Uses local mock data
2. **Backend Mode** (`VITE_USE_BACKEND=true`) - Connects to the Python backend API

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

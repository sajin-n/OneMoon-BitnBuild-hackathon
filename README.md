# OneMoon 🛡️

> **Enterprise Cybersecurity & Threat Intelligence Platform**  
> Unified email phishing defense, browser telemetry, ML heuristic analysis, and real-time SecOps intelligence.

---

## 📁 Repository Structure

```text
onemoon/
├── apps/
│   ├── api/             # Fastify + TypeScript backend API
│   ├── dashboard/       # React + Vite + Tailwind security intelligence dashboard
│   ├── extension/       # Chrome Manifest V3 extension (React, Vite, Tailwind)
│   └── ml-service/      # Python FastAPI microservice for AI/ML inference
├── packages/
│   ├── config/          # Shared configuration and base TypeScript presets
│   ├── security-engine/ # Detection, heuristics, and scoring engine
│   └── types/           # Shared TypeScript types and interfaces
├── docs/
│   ├── architecture.md           # System architecture & component communication
│   ├── threat-model.md           # Threat model, STRIDE analysis & trust boundaries
│   └── mvp-implementation-plan.md # Actionable step-by-step MVP implementation guide
├── docker-compose.yml   # PostgreSQL and Redis development services
├── .env.example         # Environment variable template
└── pnpm-workspace.yaml  # Workspace configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ (tested on v22)
- **pnpm**: v9+ (or v10)
- **Python**: v3.10+
- **Docker** (optional, for PostgreSQL & Redis)

---

### 1. Installation

Install Node monorepo dependencies across all apps and packages:

```bash
pnpm install
```

---

### 2. Running Applications

#### Backend API (`apps/api`)
```bash
# Development mode with hot-reload
pnpm dev:api

# Or directly:
cd apps/api
pnpm dev
# Test health: curl http://localhost:3001/health
```

#### Web Dashboard (`apps/dashboard`)
```bash
# Starts Vite development server at http://localhost:5173
pnpm dev:dashboard

# Or directly:
cd apps/dashboard
pnpm dev
```

#### Chrome Extension (`apps/extension`)
```bash
# Build the unpacked extension
pnpm build:extension

# Or development watch mode:
pnpm dev:extension
```
*To load into Chrome:*
1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select `apps/extension/dist`

#### ML Service (`apps/ml-service`)
```bash
# Install Python dependencies
pip install -r apps/ml-service/requirements.txt

# Start FastAPI service
python -m uvicorn app.main:app --reload --app-dir apps/ml-service --port 8000
# Test health: curl http://localhost:8000/health
```

#### Infrastructure Services (Docker)
```bash
docker compose up -d
```

---

## 🛠️ Verification Commands

```bash
# Verify TypeScript builds across all packages
pnpm build

# Verify formatting
pnpm format:check
```

---

## 📋 Status & Next Steps

This repository represents the initial architecture scaffolding for **OneMoon**:
- [x] Workspace structure configured
- [x] Fastify API with `GET /health`
- [x] FastAPI ML Service with `GET /health`
- [x] Web Dashboard with OneMoon branding
- [x] Manifest V3 Extension build pipeline
- [ ] Implement actual Gmail DOM parser & analysis
- [ ] Implement ML inference models & NLP phishing classifier
- [ ] Connect Threat Intel feeds
- [ ] Implement evidence auditing

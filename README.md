# MCP Academic Researcher

A full-stack Research Assistant application using MCP (Model Context Protocol) with local LLM support via Ollama.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Angular UI    │────▶│  NestJS Gateway │────▶│ Python          │
│   (port 4200)   │     │  (port 3000)    │     │ Orchestrator    │
└─────────────────┘     └─────────────────┘     │ (port 8000)     │
                                                 └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
               ┌────────────────┐               ┌────────────────┐               ┌────────────────┐
               │  Papers MCP    │               │  Notes MCP     │               │  Citations MCP │
               │  Server        │               │  Server        │               │  Server        │
               └────────────────┘               └────────────────┘               └────────────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────┐
                                                 │  Ollama LLM    │
                                                 │  (port 11434)  │
                                                 └────────────────┘
```

## Prerequisites

- **Node.js** 18+ (with npm)
- **Python** 3.11+
- **uv** - Python package manager ([install](https://docs.astral.sh/uv/getting-started/installation/))
- **Ollama** - Local LLM runtime ([install](https://ollama.ai/))
- **Angular CLI** - `npm install -g @angular/cli`
- **NestJS CLI** - `npm install -g @nestjs/cli`

## Project Structure

```
mcp-academic-researcher/
├── frontend/                    # Angular 17+ with Angular Material
├── backend/                     # NestJS 10+ API Gateway
├── python/                      # Python uv workspace
│   ├── pyproject.toml           # Workspace root config
│   ├── orchestrator/            # FastAPI orchestrator
│   ├── mcp_servers/
│   │   ├── papers/              # Papers search MCP server
│   │   ├── notes/               # Notes management MCP server
│   │   ├── citations/           # Citations MCP server
│   │   └── files/               # PDF processing MCP server
│   └── shared/                  # Shared utilities package
├── data/                        # Local data storage
│   ├── pdfs/
│   ├── exports/
│   └── attachments/
└── scripts/                     # Management scripts
```

## Port Assignments

| Service | Port | Description |
|---------|------|-------------|
| Angular Frontend | 4200 | Web UI |
| NestJS API Gateway | 3000 | REST API |
| Python Orchestrator | 8000 | MCP coordination |
| Ollama | 11434 | Local LLM |

## Quick Start

### 1. Initialize all projects

```bash
./scripts/init-all.sh
```

This script will:
- Check for required dependencies
- Create Angular project with Angular Material
- Create NestJS backend project
- Initialize Python workspace with uv
- Set up all MCP servers

### 2. Start all services

```bash
./scripts/start-all.sh
```

### 3. Stop all services

```bash
./scripts/stop-all.sh
```

## Manual Initialization

If you prefer to initialize projects manually:

### Angular Frontend

```bash
cd frontend
ng new . --style=scss --routing=true --skip-git
ng add @angular/material
```

### NestJS Backend

```bash
cd backend
nest new . --skip-git --package-manager npm
```

### Python Orchestrator

```bash
cd python/orchestrator
uv init --name orchestrator
uv add fastapi uvicorn httpx pydantic
```

### MCP Servers

```bash
cd python/mcp_servers/<server-name>
uv init --name mcp-<server-name>
uv add mcp pydantic
```

## Development

### Frontend Development

```bash
cd frontend
npm start
# Available at http://localhost:4200
```

### Backend Development

```bash
cd backend
npm run start:dev
# Available at http://localhost:3000
```

### Python Orchestrator

```bash
cd python/orchestrator
uv run uvicorn src.main:app --reload --port 8000
```

## Ollama Setup

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull a model:
   ```bash
   ollama pull llama3.2
   # or for better performance:
   ollama pull llama3.1
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```

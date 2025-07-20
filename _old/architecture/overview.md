# MosAIc Stack Architecture Overview

## Introduction

The MosAIc Stack is a comprehensive enterprise development platform that integrates multiple services to provide a complete AI-powered development ecosystem. This document provides a high-level overview of the system architecture.

## System Architecture

```mermaid
graph TB
    subgraph "External Access"
        Users[Users/Developers]
        Internet[Internet]
    end
    
    subgraph "Edge Layer"
        NPM[Nginx Proxy Manager<br/>:81, :80, :443]
        CF[Cloudflare Tunnel<br/>Optional]
    end
    
    subgraph "Application Layer"
        Gitea[Gitea<br/>:3000<br/>Git Hosting]
        BookStack[BookStack<br/>:6875<br/>Documentation]
        Woodpecker[Woodpecker CI<br/>:8000<br/>CI/CD]
        Portainer[Portainer<br/>:9000<br/>Container Mgmt]
    end
    
    subgraph "MosAIc Core"
        MCP[MosAIc MCP Server<br/>:3456<br/>Model Context Protocol]
        Tony[Tony Framework<br/>v2.8.0<br/>Agent Orchestration]
        Core[MosAIc Core<br/>@mosaic/core<br/>Orchestration Engine]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>:5432)]
        Redis[(Redis<br/>:6379)]
        SQLite[(SQLite<br/>MCP State)]
        MariaDB[(MariaDB<br/>:3306)]
    end
    
    subgraph "Storage"
        Volumes[Docker Volumes]
        GitData[Git Repositories]
        Artifacts[Build Artifacts]
    end
    
    Users --> Internet
    Internet --> CF
    CF --> NPM
    Users --> NPM
    
    NPM --> Gitea
    NPM --> BookStack
    NPM --> Woodpecker
    NPM --> Portainer
    
    Gitea --> MariaDB
    Gitea --> GitData
    
    BookStack --> MariaDB
    
    Woodpecker --> PG
    Woodpecker --> Gitea
    Woodpecker --> Artifacts
    
    MCP --> SQLite
    MCP --> Redis
    
    Tony --> MCP
    Core --> MCP
    
    Portainer --> Volumes
```

## Component Layers

### 1. Edge Layer
- **Nginx Proxy Manager**: Handles all incoming traffic, SSL termination, and routing
- **Cloudflare Tunnel** (Optional): Secure external access without port forwarding

### 2. Application Layer
- **Gitea**: Self-hosted Git service for source code management
- **BookStack**: Documentation platform for project and API documentation
- **Woodpecker CI**: Continuous integration and deployment pipelines
- **Portainer**: Docker container management interface

### 3. MosAIc Core Layer
- **MosAIc MCP Server**: Model Context Protocol server for AI coordination
- **Tony Framework 2.8.0**: AI agent orchestration with MCP integration
- **@mosaic/core**: Central orchestration engine for multi-project coordination

### 4. Data Layer
- **PostgreSQL**: Primary database for Woodpecker CI and MosAIc Platform
- **MariaDB**: Database for Gitea and BookStack
- **Redis**: Caching and session management
- **SQLite**: Lightweight database for MCP state management

### 5. Storage Layer
- **Docker Volumes**: Persistent storage for all containers
- **Git Repositories**: Source code storage
- **Build Artifacts**: CI/CD build outputs and releases

## Network Architecture

```mermaid
graph LR
    subgraph "Docker Networks"
        subgraph "mosaic_net"
            direction TB
            NPM2[Nginx Proxy Manager]
            Services[All Services]
        end
        
        subgraph "mosaic_internal"
            direction TB
            DB[Databases]
            Cache[Redis]
            MCP2[MCP Server]
        end
        
        subgraph "bridge"
            direction TB
            Isolated[Isolated Dev]
        end
    end
    
    NPM2 -.-> Services
    Services -.-> DB
    Services -.-> Cache
    Services -.-> MCP2
```

## Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| Nginx Proxy Manager | 80, 443, 81 | 80, 443, 81 | HTTP, HTTPS, Admin UI |
| Gitea | 3000 | - | Git hosting (proxied) |
| BookStack | 80 | 6875 | Documentation (proxied) |
| Woodpecker Server | 8000 | - | CI/CD UI (proxied) |
| Woodpecker Agent | 3000 | - | CI/CD agent |
| Portainer | 9000 | 9000 | Container management |
| PostgreSQL | 5432 | - | Database |
| MariaDB | 3306 | - | Database |
| Redis | 6379 | - | Cache |
| MosAIc MCP | 3456 | 3456 | MCP server (dev) |

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        SSL[SSL/TLS Termination]
        Auth[Authentication Layer]
        RBAC[Role-Based Access]
        Network[Network Isolation]
        Secrets[Secret Management]
    end
    
    subgraph "Security Features"
        Firewall[Firewall Rules]
        Audit[Audit Logging]
        Backup[Automated Backups]
        Monitor[Security Monitoring]
    end
    
    SSL --> Auth
    Auth --> RBAC
    RBAC --> Network
    Network --> Secrets
    
    Firewall --> SSL
    Audit --> Auth
    Backup --> Network
    Monitor --> RBAC
```

## Data Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant NPM as Nginx Proxy
    participant Gitea
    participant Wood as Woodpecker
    participant MCP
    participant Tony
    
    Dev->>NPM: Push Code
    NPM->>Gitea: Route to Gitea
    Gitea->>Wood: Webhook Trigger
    Wood->>Wood: Run Pipeline
    Wood->>MCP: Deploy Update
    MCP->>Tony: Coordinate Agents
    Tony->>Dev: Notification
```

## High Availability Considerations

1. **Load Balancing**: Nginx Proxy Manager can distribute load across multiple instances
2. **Database Replication**: PostgreSQL and MariaDB support master-slave replication
3. **Container Orchestration**: Can be deployed on Docker Swarm or Kubernetes
4. **Backup Strategy**: Automated backups of all persistent data
5. **Monitoring**: Health checks and alerting for all services

## Scalability Design

The MosAIc Stack is designed to scale both vertically and horizontally:

- **Vertical Scaling**: Increase resources for individual services
- **Horizontal Scaling**: Add more instances behind load balancer
- **Microservices**: Each component can scale independently
- **Caching**: Redis reduces database load
- **CDN Integration**: Static assets can be served via CDN

## Next Steps

- Review [Service Documentation](../services/) for detailed component information
- Follow the [Deployment Guide](../deployment/complete-deployment-guide.md) to set up MosAIc
- Check [Operations Handbook](../operations/handbook.md) for maintenance procedures

---

*Last Updated: January 2025 | MosAIc Stack Architecture v1.0.0*
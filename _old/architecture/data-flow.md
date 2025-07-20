# MosAIc Stack Data Flow Architecture

## Overview

This document describes how data flows through the MosAIc Stack, from user interactions to persistent storage, including CI/CD pipelines, AI orchestration, and inter-service communications.

## Primary Data Flows

### 1. Git Development Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant NPM as Nginx Proxy
    participant Gitea as Gitea
    participant DB as MariaDB
    participant Wood as Woodpecker
    participant Agent as CI Agent
    participant MCP as MosAIc MCP
    
    Dev->>NPM: Git Push (HTTPS/SSH)
    NPM->>Gitea: Forward Request
    Gitea->>DB: Store Commit Data
    DB-->>Gitea: Confirm Storage
    Gitea->>Wood: Webhook (New Commit)
    Wood->>Agent: Assign Build Job
    Agent->>Gitea: Clone Repository
    Agent->>Agent: Run Build/Tests
    Agent->>MCP: AI Analysis (Optional)
    MCP-->>Agent: Analysis Results
    Agent->>Wood: Report Status
    Wood->>Gitea: Update Commit Status
    Gitea-->>Dev: Push Confirmation
```

### 2. Documentation Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant NPM as Nginx Proxy
    participant Book as BookStack
    participant DB as MariaDB
    participant Search as Search Index
    participant Media as Media Storage
    
    User->>NPM: Access Docs
    NPM->>Book: Route Request
    Book->>DB: Fetch Page Data
    DB-->>Book: Return Content
    Book->>Search: Query Index
    Search-->>Book: Search Results
    Book->>Media: Fetch Images
    Media-->>Book: Return Media
    Book-->>NPM: Render Page
    NPM-->>User: Display Documentation
```

### 3. AI Orchestration Flow

```mermaid
sequenceDiagram
    participant Client as Tony Client
    participant MCP as MosAIc MCP
    participant Redis as Redis
    participant SQLite as SQLite
    participant Agent1 as Agent 1
    participant Agent2 as Agent 2
    
    Client->>MCP: Initialize Session
    MCP->>SQLite: Create Session
    MCP->>Redis: Cache Session
    Client->>MCP: Deploy Agents
    MCP->>Agent1: Start Agent 1
    MCP->>Agent2: Start Agent 2
    
    Client->>MCP: Assign Task
    MCP->>Redis: Queue Task
    MCP->>Agent1: Route Task
    Agent1->>Agent1: Process Task
    Agent1->>MCP: Task Update
    MCP->>Redis: Update Status
    MCP->>SQLite: Log Progress
    
    Agent1->>MCP: Request Coordination
    MCP->>Agent2: Forward Request
    Agent2->>MCP: Respond
    MCP->>Agent1: Relay Response
    
    Agent1->>MCP: Task Complete
    MCP->>SQLite: Final Status
    MCP->>Client: Notify Completion
```

### 4. CI/CD Pipeline Flow

```mermaid
graph LR
    subgraph "Trigger Phase"
        Push[Git Push] --> Webhook[Gitea Webhook]
        PR[Pull Request] --> Webhook
        Manual[Manual Trigger] --> Webhook
    end
    
    subgraph "Build Phase"
        Webhook --> Queue[Job Queue]
        Queue --> Agent[CI Agent]
        Agent --> Clone[Clone Repo]
        Clone --> Build[Build Process]
        Build --> Test[Run Tests]
    end
    
    subgraph "Analysis Phase"
        Test --> Lint[Code Linting]
        Lint --> Sec[Security Scan]
        Sec --> MCP[AI Analysis]
        MCP --> Quality[Quality Check]
    end
    
    subgraph "Deploy Phase"
        Quality --> Package[Create Package]
        Package --> Registry[Push to Registry]
        Registry --> Deploy[Deploy Service]
        Deploy --> Notify[Notifications]
    end
```

## Data Storage Patterns

### 1. Transactional Data

```mermaid
graph TD
    subgraph "Write Path"
        App[Application] --> Validate[Validation Layer]
        Validate --> TX[Transaction Start]
        TX --> Write[Database Write]
        Write --> Commit[Commit/Rollback]
    end
    
    subgraph "Read Path"
        Request[Read Request] --> Cache{Cache Hit?}
        Cache -->|Yes| Return[Return Data]
        Cache -->|No| DB[Database Query]
        DB --> UpdateCache[Update Cache]
        UpdateCache --> Return
    end
    
    subgraph "Storage"
        PostgreSQL[(PostgreSQL)]
        MariaDB[(MariaDB)]
        Redis[(Redis Cache)]
    end
    
    Write --> PostgreSQL
    Write --> MariaDB
    DB --> PostgreSQL
    DB --> MariaDB
    UpdateCache --> Redis
    Cache --> Redis
```

### 2. File Storage Patterns

```mermaid
graph TD
    subgraph "Git Repositories"
        GitData[/var/lib/gitea/]
        GitLFS[/var/lib/gitea-lfs/]
    end
    
    subgraph "Documentation"
        BookFiles[/var/lib/bookstack/uploads/]
        BookImages[/var/lib/bookstack/images/]
    end
    
    subgraph "CI/CD Artifacts"
        BuildCache[/var/lib/woodpecker/cache/]
        Artifacts[/var/lib/woodpecker/artifacts/]
        Logs[/var/lib/woodpecker/logs/]
    end
    
    subgraph "MosAIc Data"
        MCPState[/var/lib/mosaic/mcp/state/]
        AgentLogs[/var/lib/mosaic/agents/logs/]
        Sessions[/var/lib/mosaic/sessions/]
    end
```

### 3. Cache Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[Browser Cache]
        L2[CDN Cache]
        L3[Nginx Cache]
        L4[Application Cache]
        L5[Redis Cache]
        L6[Database Cache]
    end
    
    Request[User Request] --> L1
    L1 -->|Miss| L2
    L2 -->|Miss| L3
    L3 -->|Miss| L4
    L4 -->|Miss| L5
    L5 -->|Miss| L6
    L6 -->|Miss| DB[(Database)]
    
    DB --> L6
    L6 --> L5
    L5 --> L4
    L4 --> L3
    L3 --> L2
    L2 --> L1
    L1 --> Response[User Response]
```

## Real-time Data Flows

### 1. WebSocket Connections

```mermaid
sequenceDiagram
    participant Client as Browser
    participant NPM as Nginx Proxy
    participant App as Application
    participant Redis as Redis PubSub
    participant Other as Other Clients
    
    Client->>NPM: WebSocket Upgrade
    NPM->>App: Proxy WebSocket
    App->>Redis: Subscribe Channel
    
    loop Real-time Updates
        Other->>App: Send Update
        App->>Redis: Publish Message
        Redis->>App: Broadcast
        App->>Client: WebSocket Message
    end
    
    Client->>NPM: Close Connection
    NPM->>App: Close WebSocket
    App->>Redis: Unsubscribe
```

### 2. Event Streaming

```mermaid
graph TD
    subgraph "Event Sources"
        Git[Git Events]
        CI[CI/CD Events]
        MCP[MCP Events]
        User[User Actions]
    end
    
    subgraph "Event Bus"
        Redis[Redis Streams]
        Queue[Message Queue]
    end
    
    subgraph "Event Consumers"
        Notify[Notification Service]
        Audit[Audit Logger]
        Monitor[Monitoring]
        Analytics[Analytics]
    end
    
    Git --> Redis
    CI --> Redis
    MCP --> Redis
    User --> Redis
    
    Redis --> Queue
    Queue --> Notify
    Queue --> Audit
    Queue --> Monitor
    Queue --> Analytics
```

## Data Security Flows

### 1. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant NPM as Nginx Proxy
    participant App as Application
    participant Auth as Auth Service
    participant DB as Database
    participant Session as Session Store
    
    User->>NPM: Login Request
    NPM->>App: Forward Auth
    App->>Auth: Validate Credentials
    Auth->>DB: Check User
    DB-->>Auth: User Data
    Auth->>Auth: Hash Compare
    Auth->>Session: Create Session
    Session-->>Auth: Session Token
    Auth-->>App: Auth Success
    App-->>NPM: Set Cookie
    NPM-->>User: Login Success
```

### 2. Data Encryption Flow

```mermaid
graph LR
    subgraph "Encryption at Rest"
        Files[Files] --> Encrypt[Encryption Layer]
        Encrypt --> Storage[Encrypted Storage]
    end
    
    subgraph "Encryption in Transit"
        Client[Client] --> TLS[TLS 1.3]
        TLS --> Server[Server]
    end
    
    subgraph "Key Management"
        KMS[Key Store]
        Rotate[Key Rotation]
        Audit[Key Audit]
    end
    
    Encrypt --> KMS
    KMS --> Rotate
    Rotate --> Audit
```

## Performance Optimization Flows

### 1. Query Optimization

```mermaid
graph TD
    Query[Database Query] --> Analyze{Query Analysis}
    Analyze --> Cache{Cacheable?}
    
    Cache -->|Yes| CheckCache{In Cache?}
    CheckCache -->|Yes| ReturnCache[Return Cached]
    CheckCache -->|No| Execute[Execute Query]
    
    Cache -->|No| Execute
    Execute --> Index{Use Index?}
    Index -->|Yes| FastPath[Indexed Lookup]
    Index -->|No| FullScan[Table Scan]
    
    FastPath --> Result[Query Result]
    FullScan --> Result
    Result --> StoreCache[Cache Result]
    StoreCache --> Return[Return Data]
    ReturnCache --> Return
```

### 2. Asset Delivery

```mermaid
graph LR
    subgraph "Static Assets"
        Images[Images]
        CSS[CSS Files]
        JS[JavaScript]
    end
    
    subgraph "Processing"
        Minify[Minification]
        Compress[Compression]
        Bundle[Bundling]
    end
    
    subgraph "Delivery"
        CDN[CDN Cache]
        Edge[Edge Servers]
        Client[Client Browser]
    end
    
    Images --> Compress
    CSS --> Minify
    JS --> Minify
    
    Minify --> Bundle
    Compress --> CDN
    Bundle --> CDN
    
    CDN --> Edge
    Edge --> Client
```

## Monitoring Data Flows

### 1. Metrics Collection

```mermaid
graph TD
    subgraph "Data Sources"
        App[Applications]
        Sys[System Metrics]
        Net[Network Metrics]
        Custom[Custom Metrics]
    end
    
    subgraph "Collection"
        Agent[Monitoring Agent]
        Scraper[Metric Scraper]
    end
    
    subgraph "Processing"
        Aggregate[Aggregation]
        Alert[Alert Engine]
        Store[Time Series DB]
    end
    
    subgraph "Visualization"
        Dash[Dashboards]
        Report[Reports]
        Notify[Notifications]
    end
    
    App --> Agent
    Sys --> Agent
    Net --> Scraper
    Custom --> Scraper
    
    Agent --> Aggregate
    Scraper --> Aggregate
    
    Aggregate --> Store
    Aggregate --> Alert
    
    Store --> Dash
    Store --> Report
    Alert --> Notify
```

### 2. Log Aggregation

```mermaid
graph LR
    subgraph "Log Sources"
        AppLog[Application Logs]
        SysLog[System Logs]
        AuditLog[Audit Logs]
        SecLog[Security Logs]
    end
    
    subgraph "Pipeline"
        Collect[Log Collector]
        Parse[Parser]
        Enrich[Enrichment]
        Filter[Filtering]
    end
    
    subgraph "Storage & Analysis"
        Index[Search Index]
        Archive[Log Archive]
        Analyze[Log Analytics]
    end
    
    AppLog --> Collect
    SysLog --> Collect
    AuditLog --> Collect
    SecLog --> Collect
    
    Collect --> Parse
    Parse --> Enrich
    Enrich --> Filter
    
    Filter --> Index
    Filter --> Archive
    Index --> Analyze
```

## Backup Data Flows

### 1. Incremental Backup

```mermaid
sequenceDiagram
    participant Scheduler as Backup Scheduler
    participant Agent as Backup Agent
    participant Source as Data Source
    participant Dedupe as Deduplication
    participant Storage as Backup Storage
    participant Verify as Verification
    
    Scheduler->>Agent: Trigger Backup
    Agent->>Source: Read Changed Blocks
    Source-->>Agent: Block Data
    Agent->>Dedupe: Check Duplicates
    Dedupe-->>Agent: Unique Blocks
    Agent->>Storage: Store Blocks
    Storage-->>Agent: Confirm Written
    Agent->>Verify: Verify Integrity
    Verify-->>Agent: Checksum Valid
    Agent->>Scheduler: Backup Complete
```

## Next Steps

- Review [Security Architecture](./security-architecture.md) for data protection details
- Check [Performance Tuning](../operations/performance-tuning.md) for optimization
- See [Monitoring Setup](../operations/monitoring.md) for data flow monitoring

---

*Last Updated: January 2025 | MosAIc Data Flow Architecture v1.0.0*
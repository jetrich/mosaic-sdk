# MosAIc Orchestration Architecture Diagrams

## Overview

This document contains visual representations of the MosAIc orchestration architecture using Mermaid diagrams. These diagrams illustrate the system's components, data flow, and integration points.

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Tools]
        API[REST API]
        GQL[GraphQL API]
        MCP[MCP Protocol]
    end

    subgraph "Orchestration Core"
        GW[API Gateway]
        RE[Routing Engine]
        LB[Load Balancer]
        CM[Cache Manager]
        CB[Circuit Breaker]
    end

    subgraph "Service Abstraction"
        GS[Git Service]
        CS[CI/CD Service]
        DS[Docs Service]
        PS[Project Service]
        AS[AI Service]
    end

    subgraph "Plugin System"
        PM[Plugin Manager]
        PL[Plugin Loader]
        PR[Plugin Registry]
        PLC[Lifecycle Controller]
    end

    subgraph "Provider Plugins"
        subgraph "Git Providers"
            GH[GitHub Plugin]
            GT[Gitea Plugin]
            GL[GitLab Plugin]
        end
        
        subgraph "CI/CD Providers"
            GA[GitHub Actions]
            WP[Woodpecker CI]
            JK[Jenkins]
        end
        
        subgraph "Other Providers"
            NT[Notion]
            BS[BookStack]
            OAI[OpenAI]
            AC[Anthropic]
        end
    end

    CLI --> GW
    API --> GW
    GQL --> GW
    MCP --> GW

    GW --> RE
    RE --> LB
    LB --> CM
    CM --> CB

    CB --> GS
    CB --> CS
    CB --> DS
    CB --> PS
    CB --> AS

    GS --> PM
    CS --> PM
    DS --> PM
    PS --> PM
    AS --> PM

    PM --> PL
    PL --> PR
    PR --> PLC

    PLC --> GH
    PLC --> GT
    PLC --> GL
    PLC --> GA
    PLC --> WP
    PLC --> JK
    PLC --> NT
    PLC --> BS
    PLC --> OAI
    PLC --> AC
```

## Request Flow Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant RE as Routing Engine
    participant CM as Cache Manager
    participant LB as Load Balancer
    participant CB as Circuit Breaker
    participant P as Provider Plugin
    participant E as External Service

    C->>GW: Request
    GW->>RE: Route Request
    RE->>CM: Check Cache
    
    alt Cache Hit
        CM-->>RE: Cached Response
        RE-->>GW: Return Cached
        GW-->>C: Response
    else Cache Miss
        RE->>LB: Select Provider
        LB->>CB: Check Circuit
        
        alt Circuit Open
            CB-->>LB: Circuit Open Error
            LB->>LB: Select Fallback
        end
        
        CB->>P: Execute Request
        P->>E: External API Call
        E-->>P: API Response
        P-->>CB: Process Response
        CB-->>LB: Return Result
        LB->>CM: Cache Result
        CM-->>RE: Confirm Cache
        RE-->>GW: Return Response
        GW-->>C: Final Response
    end
```

## Plugin Lifecycle Diagram

```mermaid
stateDiagram-v2
    [*] --> Discovered: Plugin Found
    Discovered --> Validated: Validation Passed
    Validated --> Loaded: Load Success
    Loaded --> Initialized: Init Success
    Initialized --> Started: Start Success
    Started --> Running: Health Check OK
    
    Running --> Stopping: Stop Signal
    Stopping --> Stopped: Cleanup Done
    Stopped --> [*]: Disposed
    
    Running --> Failed: Error Detected
    Failed --> Stopping: Recovery Failed
    Failed --> Running: Recovery Success
    
    Running --> Updating: Hot Reload
    Updating --> Running: Update Success
    Updating --> Failed: Update Failed
```

## Multi-Provider Routing Decision Tree

```mermaid
graph TD
    A[Incoming Request] --> B{Check Rules}
    
    B --> C{Organization Pattern}
    C -->|internal-*| D[Route to Gitea]
    C -->|public-*| E[Route to GitHub]
    C -->|client-*| F[Route to GitLab]
    
    B --> G{Cost Threshold}
    G -->|High Cost Op| H[Self-Hosted]
    G -->|Low Cost Op| I{Check Credits}
    I -->|Credits Available| J[Cloud Provider]
    I -->|No Credits| H
    
    B --> K{Performance Requirement}
    K -->|Low Latency| L[Nearest Provider]
    K -->|High Throughput| M[Load Balance]
    K -->|Best Effort| N[Any Available]
    
    D --> O{Health Check}
    E --> O
    F --> O
    H --> O
    J --> O
    L --> O
    M --> O
    N --> O
    
    O -->|Healthy| P[Execute Request]
    O -->|Unhealthy| Q[Failover]
    
    Q --> R{Alternative Available}
    R -->|Yes| S[Use Alternative]
    R -->|No| T[Return Error]
    
    P --> U[Success]
    S --> U
    T --> V[Failure]
```

## Cache Architecture

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[L1: Memory Cache<br/>~10ms latency<br/>1GB capacity]
        L2[L2: Redis Cache<br/>~50ms latency<br/>10GB capacity]
        L3[L3: CDN Cache<br/>~100ms latency<br/>Unlimited capacity]
    end
    
    subgraph "Cache Operations"
        R[Read Request] --> L1
        L1 -->|Miss| L2
        L2 -->|Miss| L3
        L3 -->|Miss| O[Origin]
        
        O -->|Fill| L3
        L3 -->|Promote| L2
        L2 -->|Promote| L1
        
        W[Write Request] --> WS{Write Strategy}
        WS -->|Write Through| WT[All Layers]
        WS -->|Write Back| WB[L1 Only]
        
        I[Invalidate] --> L1
        I --> L2
        I --> L3
    end
```

## Load Balancing Strategies

```mermaid
graph TB
    subgraph "Load Balancer"
        R[Request] --> S{Strategy Selector}
        
        S --> RR[Round Robin]
        S --> WRR[Weighted Round Robin]
        S --> LC[Least Connections]
        S --> RT[Response Time]
        S --> AD[Adaptive]
        
        subgraph "Round Robin"
            RR --> P1[Provider 1]
            RR --> P2[Provider 2]
            RR --> P3[Provider 3]
            RR --> P1
        end
        
        subgraph "Weighted"
            WRR -->|30%| WP1[Provider 1]
            WRR -->|50%| WP2[Provider 2]
            WRR -->|20%| WP3[Provider 3]
        end
        
        subgraph "Adaptive"
            AD --> ML[ML Model]
            ML --> PP[Performance Prediction]
            PP --> OS[Optimal Selection]
        end
    end
```

## Circuit Breaker State Machine

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial State
    
    state Closed {
        [*] --> Monitoring
        Monitoring --> Monitoring: Success
        Monitoring --> Counting: Failure
        Counting --> Counting: Failure < Threshold
        Counting --> Opening: Failure >= Threshold
    }
    
    Closed --> Open: Threshold Breached
    
    state Open {
        [*] --> Rejecting
        Rejecting --> Rejecting: Reject All
        Rejecting --> Timer: Start Timer
        Timer --> HalfOpen: Timeout
    }
    
    Open --> HalfOpen: Reset Timeout
    
    state HalfOpen {
        [*] --> Testing
        Testing --> Success: Request Success
        Success --> Success: Count < Required
        Success --> Closed: Count >= Required
        Testing --> Open: Request Failed
    }
    
    HalfOpen --> Closed: Success Threshold
    HalfOpen --> Open: Any Failure
```

## Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Tenant Layer"
        T1[Tenant A]
        T2[Tenant B]
        T3[Tenant C]
    end
    
    subgraph "Isolation Layer"
        TM[Tenant Manager]
        QM[Quota Manager]
        IM[Identity Manager]
    end
    
    subgraph "Shared Infrastructure"
        O[Orchestrator]
        C[Cache]
        M[Monitoring]
    end
    
    subgraph "Dedicated Resources"
        subgraph "Tenant A Resources"
            A1[Provider Set A]
            A2[Rules A]
            A3[Quotas A]
        end
        
        subgraph "Tenant B Resources"
            B1[Provider Set B]
            B2[Rules B]
            B3[Quotas B]
        end
    end
    
    T1 --> TM
    T2 --> TM
    T3 --> TM
    
    TM --> QM
    TM --> IM
    
    QM --> O
    IM --> O
    
    O --> A1
    O --> B1
    
    A1 --> A2
    A2 --> A3
    
    B1 --> B2
    B2 --> B3
    
    O --> C
    O --> M
```

## Monitoring and Observability

```mermaid
graph LR
    subgraph "Data Collection"
        M[Metrics]
        L[Logs]
        T[Traces]
        E[Events]
    end
    
    subgraph "Processing"
        AG[Aggregation]
        AN[Analysis]
        AL[Alerting]
    end
    
    subgraph "Storage"
        TS[Time Series DB]
        LS[Log Storage]
        TR[Trace Storage]
    end
    
    subgraph "Visualization"
        D[Dashboards]
        A[Alerts]
        R[Reports]
    end
    
    M --> AG
    L --> AG
    T --> AG
    E --> AG
    
    AG --> AN
    AN --> AL
    
    AG --> TS
    AG --> LS
    AG --> TR
    
    TS --> D
    LS --> D
    TR --> D
    
    AL --> A
    AN --> R
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Dev Environment]
        TEST[Test Suite]
        BUILD[Build Pipeline]
    end
    
    subgraph "Staging"
        STG[Staging Cluster]
        STGDB[Staging DB]
        STGCACHE[Staging Cache]
    end
    
    subgraph "Production"
        subgraph "Region 1"
            P1[Prod Cluster 1]
            DB1[Database 1]
            C1[Cache 1]
        end
        
        subgraph "Region 2"
            P2[Prod Cluster 2]
            DB2[Database 2]
            C2[Cache 2]
        end
        
        LB[Global Load Balancer]
    end
    
    DEV --> TEST
    TEST --> BUILD
    BUILD --> STG
    
    STG --> P1
    STG --> P2
    
    LB --> P1
    LB --> P2
    
    P1 <--> DB1
    P1 <--> C1
    
    P2 <--> DB2
    P2 <--> C2
    
    DB1 <-.-> DB2
    C1 <-.-> C2
```

## Data Flow for Multi-Provider Operations

```mermaid
graph LR
    subgraph "User Request"
        U[User] --> R[Request]
    end
    
    subgraph "Orchestration"
        R --> O[Orchestrator]
        O --> D{Decision}
    end
    
    subgraph "Provider Selection"
        D -->|Git Op| GP{Git Provider}
        D -->|CI/CD Op| CP{CI/CD Provider}
        D -->|Doc Op| DP{Doc Provider}
        
        GP -->|Criteria Met| GH[GitHub]
        GP -->|Self-Host| GT[Gitea]
        
        CP -->|Cloud| GA[GitHub Actions]
        CP -->|Self-Host| WP[Woodpecker]
        
        DP -->|Collab| NO[Notion]
        DP -->|Self-Host| BS[BookStack]
    end
    
    subgraph "Response"
        GH --> RS[Response]
        GT --> RS
        GA --> RS
        WP --> RS
        NO --> RS
        BS --> RS
        
        RS --> U
    end
```

## Error Handling Flow

```mermaid
graph TD
    E[Error Occurs] --> T{Error Type}
    
    T -->|Network| N[Network Handler]
    T -->|Auth| A[Auth Handler]
    T -->|Rate Limit| R[Rate Limit Handler]
    T -->|Provider| P[Provider Handler]
    
    N --> RT{Retry?}
    RT -->|Yes| RE[Retry with Backoff]
    RT -->|No| FO[Failover]
    
    A --> RF[Refresh Token]
    RF -->|Success| RE
    RF -->|Fail| ER[Error Response]
    
    R --> W[Wait Period]
    W --> RE
    
    P --> CB[Circuit Breaker]
    CB -->|Open| FO
    CB -->|Closed| RE
    
    FO --> ALT{Alternative?}
    ALT -->|Yes| SW[Switch Provider]
    ALT -->|No| ER
    
    RE -->|Success| OK[Success]
    RE -->|Fail| FO
    SW --> OK
    ER --> LOG[Log Error]
    LOG --> USR[User Notification]
```

---

These diagrams provide a visual understanding of the MosAIc orchestration architecture, showing how different components interact and how data flows through the system. The diagrams can be rendered using any Mermaid-compatible viewer or documentation system.
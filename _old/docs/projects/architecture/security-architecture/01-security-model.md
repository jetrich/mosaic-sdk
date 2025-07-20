---
title: "01 Security Model"
order: 01
category: "security-architecture"
tags: ["security-architecture", "architecture", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# MosAIc Stack Security Architecture

## Overview

This document outlines the comprehensive security architecture of the MosAIc Stack, covering authentication, authorization, encryption, network security, and compliance considerations.

## Security Layers

```mermaid
graph TB
    subgraph "Perimeter Security"
        CF[Cloudflare WAF]
        FW[Host Firewall]
        IDS[Intrusion Detection]
    end
    
    subgraph "Network Security"
        NPM[Nginx Proxy Manager<br/>SSL/TLS Termination]
        VLAN[Network Segmentation]
        VPN[VPN Access]
    end
    
    subgraph "Application Security"
        Auth[Authentication]
        AuthZ[Authorization]
        Audit[Audit Logging]
    end
    
    subgraph "Data Security"
        EncRest[Encryption at Rest]
        EncTransit[Encryption in Transit]
        Backup[Secure Backups]
    end
    
    subgraph "Container Security"
        Scan[Image Scanning]
        Runtime[Runtime Protection]
        Secrets[Secret Management]
    end
    
    CF --> FW
    FW --> NPM
    NPM --> VLAN
    VLAN --> Auth
    Auth --> AuthZ
    AuthZ --> Audit
    
    Audit --> EncRest
    EncRest --> EncTransit
    EncTransit --> Backup
    
    Runtime --> Scan
    Scan --> Secrets
```

## Authentication Architecture

### 1. Multi-Factor Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant NPM as Nginx Proxy
    participant App as Application
    participant LDAP as LDAP/AD
    participant TOTP as TOTP Service
    participant Session as Session Store
    
    User->>NPM: Login Request
    NPM->>App: Forward to App
    App->>LDAP: Validate Credentials
    LDAP-->>App: User Authenticated
    
    App->>User: Request 2FA Code
    User->>App: Provide TOTP Code
    App->>TOTP: Validate Code
    TOTP-->>App: Code Valid
    
    App->>Session: Create Session
    Session-->>App: Session Token
    App-->>User: Login Success + Token
```

### 2. SSO Integration

```mermaid
graph LR
    subgraph "Identity Providers"
        LDAP[LDAP/AD]
        SAML[SAML IdP]
        OAuth[OAuth Provider]
        OIDC[OpenID Connect]
    end
    
    subgraph "Service Providers"
        Gitea[Gitea]
        BookStack[BookStack]
        Woodpecker[Woodpecker]
        Portainer[Portainer]
    end
    
    subgraph "Auth Proxy"
        AuthProxy[Authentik/Authelia]
    end
    
    LDAP --> AuthProxy
    SAML --> AuthProxy
    OAuth --> AuthProxy
    OIDC --> AuthProxy
    
    AuthProxy --> Gitea
    AuthProxy --> BookStack
    AuthProxy --> Woodpecker
    AuthProxy --> Portainer
```

## Authorization Model

### 1. Role-Based Access Control (RBAC)

```yaml
roles:
  - name: admin
    permissions:
      - "*:*:*"  # Full access
    
  - name: developer
    permissions:
      - "gitea:repo:*"
      - "woodpecker:build:*"
      - "bookstack:page:read"
      - "mcp:agent:deploy"
    
  - name: qa_engineer
    permissions:
      - "gitea:repo:read"
      - "woodpecker:build:read"
      - "woodpecker:build:restart"
      - "bookstack:*:*"
    
  - name: viewer
    permissions:
      - "*:*:read"  # Read-only access

permissions:
  format: "service:resource:action"
  services: [gitea, bookstack, woodpecker, portainer, mcp]
  resources: [repo, page, build, container, agent]
  actions: [create, read, update, delete, execute]
```

### 2. Attribute-Based Access Control (ABAC)

```mermaid
graph TD
    Request[Access Request] --> Eval{Evaluate Attributes}
    
    Eval --> UserAttr[User Attributes]
    Eval --> ResAttr[Resource Attributes]
    Eval --> EnvAttr[Environment Attributes]
    
    UserAttr --> Rules[Policy Rules]
    ResAttr --> Rules
    EnvAttr --> Rules
    
    Rules --> Decision{Access Decision}
    Decision -->|Allow| Grant[Grant Access]
    Decision -->|Deny| Deny[Deny Access]
    Decision -->|MFA| Challenge[Additional Auth]
```

## Network Security

### 1. Zero Trust Network Architecture

```mermaid
graph TB
    subgraph "Untrusted Zone"
        Internet[Internet]
        User[Remote User]
    end
    
    subgraph "DMZ"
        CF[Cloudflare]
        NPM[Nginx Proxy]
    end
    
    subgraph "Trust Boundary"
        Policy[Policy Engine]
        MFA[MFA Gateway]
    end
    
    subgraph "Application Zone"
        Apps[Applications]
        API[APIs]
    end
    
    subgraph "Data Zone"
        DB[Databases]
        Storage[File Storage]
    end
    
    Internet --> CF
    User --> CF
    CF --> NPM
    NPM --> Policy
    Policy --> MFA
    MFA --> Apps
    Apps --> API
    API --> DB
    Apps --> Storage
    
    Policy -.->|Verify| Apps
    Policy -.->|Verify| API
    Policy -.->|Verify| DB
```

### 2. Network Segmentation

```yaml
networks:
  dmz:
    subnet: 172.20.0.0/24
    services:
      - nginx-proxy-manager
    rules:
      - allow: "80,443 from 0.0.0.0/0"
      - deny: "all from internal"
  
  application:
    subnet: 172.21.0.0/24
    services:
      - gitea
      - bookstack
      - woodpecker
    rules:
      - allow: "from dmz"
      - allow: "to data"
      - deny: "from internet"
  
  data:
    subnet: 172.22.0.0/24
    services:
      - postgresql
      - mariadb
      - redis
    rules:
      - allow: "from application"
      - deny: "from dmz"
      - deny: "from internet"
  
  management:
    subnet: 172.23.0.0/24
    services:
      - portainer
      - monitoring
    rules:
      - allow: "from admin_vpn"
      - deny: "from application"
```

## Data Protection

### 1. Encryption Standards

```yaml
encryption:
  at_rest:
    databases:
      algorithm: AES-256-GCM
      key_management: HashiCorp Vault
      rotation: 90 days
    
    files:
      algorithm: AES-256-CTR
      key_derivation: PBKDF2
      iterations: 100000
    
    backups:
      algorithm: AES-256-CBC
      compression: zstd
      gpg_signing: required
  
  in_transit:
    external:
      protocol: TLS 1.3
      ciphers:
        - TLS_AES_256_GCM_SHA384
        - TLS_CHACHA20_POLY1305_SHA256
      hsts: "max-age=31536000; includeSubDomains"
    
    internal:
      protocol: TLS 1.2+
      mutual_tls: enabled
      certificate_validation: required
```

### 2. Key Management

```mermaid
graph TD
    subgraph "Key Hierarchy"
        Master[Master Key]
        KEK[Key Encryption Keys]
        DEK[Data Encryption Keys]
    end
    
    subgraph "Key Storage"
        HSM[Hardware Security Module]
        Vault[HashiCorp Vault]
        Local[Local Key Store]
    end
    
    subgraph "Key Operations"
        Gen[Key Generation]
        Rotate[Key Rotation]
        Revoke[Key Revocation]
        Audit[Key Audit]
    end
    
    Master --> KEK
    KEK --> DEK
    
    Master --> HSM
    KEK --> Vault
    DEK --> Local
    
    Gen --> Master
    Rotate --> KEK
    Revoke --> DEK
    Audit --> Vault
```

## Container Security

### 1. Image Security Pipeline

```mermaid
graph LR
    subgraph "Build Phase"
        Source[Source Code]
        Build[Docker Build]
        Scan[Security Scan]
    end
    
    subgraph "Registry"
        Sign[Image Signing]
        Store[Secure Registry]
        Policy[Admission Policy]
    end
    
    subgraph "Runtime"
        Pull[Verified Pull]
        Run[Secure Runtime]
        Monitor[Runtime Monitor]
    end
    
    Source --> Build
    Build --> Scan
    Scan --> Sign
    Sign --> Store
    Store --> Policy
    Policy --> Pull
    Pull --> Run
    Run --> Monitor
```

### 2. Runtime Security Policies

```yaml
security_policies:
  pod_security:
    - no_privileged: true
    - read_only_root_fs: true
    - non_root_user: true
    - no_host_network: true
    - no_host_pid: true
    - drop_capabilities:
        - ALL
    - add_capabilities:
        - NET_BIND_SERVICE  # Only if needed
  
  resource_limits:
    cpu: "1000m"
    memory: "1Gi"
    ephemeral_storage: "2Gi"
  
  network_policies:
    ingress:
      - from:
          - podSelector:
              matchLabels:
                app: allowed-app
    egress:
      - to:
          - podSelector:
              matchLabels:
                app: database
```

## Secret Management

### 1. Secret Storage Architecture

```mermaid
graph TD
    subgraph "Secret Sources"
        Env[Environment Vars]
        Files[Secret Files]
        Config[Configurations]
    end
    
    subgraph "Secret Store"
        Vault[HashiCorp Vault]
        K8s[Kubernetes Secrets]
        Docker[Docker Secrets]
    end
    
    subgraph "Secret Injection"
        Init[Init Containers]
        Side[Sidecar Proxy]
        Runtime[Runtime Injection]
    end
    
    subgraph "Applications"
        App1[Gitea]
        App2[BookStack]
        App3[Woodpecker]
    end
    
    Env --> Vault
    Files --> Vault
    Config --> Vault
    
    Vault --> K8s
    Vault --> Docker
    
    K8s --> Init
    Docker --> Side
    Vault --> Runtime
    
    Init --> App1
    Side --> App2
    Runtime --> App3
```

### 2. Secret Rotation

```yaml
secret_rotation:
  database_passwords:
    frequency: 30 days
    method: automatic
    notification: 24 hours before
  
  api_keys:
    frequency: 90 days
    method: manual
    approval: required
  
  certificates:
    frequency: 365 days
    method: automatic
    renewal: 30 days before expiry
  
  ssh_keys:
    frequency: 180 days
    method: manual
    audit: required
```

## Compliance & Auditing

### 1. Audit Architecture

```mermaid
graph LR
    subgraph "Event Sources"
        Auth[Authentication Events]
        Access[Access Events]
        Change[Change Events]
        System[System Events]
    end
    
    subgraph "Audit Pipeline"
        Collect[Event Collection]
        Enrich[Event Enrichment]
        Store[Secure Storage]
        Analyze[Analysis Engine]
    end
    
    subgraph "Outputs"
        SIEM[SIEM Integration]
        Report[Compliance Reports]
        Alert[Security Alerts]
        Archive[Long-term Archive]
    end
    
    Auth --> Collect
    Access --> Collect
    Change --> Collect
    System --> Collect
    
    Collect --> Enrich
    Enrich --> Store
    Store --> Analyze
    
    Analyze --> SIEM
    Analyze --> Report
    Analyze --> Alert
    Store --> Archive
```

### 2. Compliance Framework

```yaml
compliance:
  standards:
    - name: SOC2 Type II
      controls:
        - access_control
        - encryption
        - monitoring
        - incident_response
    
    - name: HIPAA
      controls:
        - phi_encryption
        - access_logs
        - data_retention
        - breach_notification
    
    - name: GDPR
      controls:
        - data_minimization
        - right_to_erasure
        - consent_management
        - data_portability
  
  audit_schedule:
    internal: monthly
    external: annually
    penetration_testing: quarterly
```

## Incident Response

### 1. Security Incident Flow

```mermaid
stateDiagram-v2
    [*] --> Detection
    Detection --> Triage
    Triage --> Containment
    Containment --> Investigation
    Investigation --> Remediation
    Remediation --> Recovery
    Recovery --> PostMortem
    PostMortem --> [*]
    
    Detection --> Escalation: High Severity
    Escalation --> Containment
    
    Investigation --> Legal: Data Breach
    Legal --> Remediation
```

### 2. Response Playbooks

```yaml
playbooks:
  unauthorized_access:
    detection:
      - Failed login threshold exceeded
      - Access from unusual location
      - Privilege escalation attempt
    
    immediate_actions:
      - Block source IP
      - Disable affected account
      - Capture forensic data
    
    investigation:
      - Review access logs
      - Check lateral movement
      - Identify data accessed
    
    remediation:
      - Reset credentials
      - Review permissions
      - Patch vulnerabilities
      - Update security rules
```

## Security Monitoring

### 1. Real-time Monitoring

```mermaid
graph TD
    subgraph "Data Collection"
        Logs[Application Logs]
        Metrics[System Metrics]
        Network[Network Traffic]
        User[User Activity]
    end
    
    subgraph "Analysis"
        Correlate[Event Correlation]
        ML[Machine Learning]
        Rules[Rule Engine]
        Threat[Threat Intel]
    end
    
    subgraph "Response"
        Alert[Alerting]
        Auto[Automation]
        Dashboard[Dashboards]
        Report[Reports]
    end
    
    Logs --> Correlate
    Metrics --> Correlate
    Network --> ML
    User --> Rules
    
    Correlate --> Alert
    ML --> Auto
    Rules --> Dashboard
    Threat --> Report
```

## Security Best Practices

### Development Security
1. **Code Scanning**: All commits scanned for vulnerabilities
2. **Dependency Management**: Automated dependency updates
3. **Secret Scanning**: Prevent secrets in code
4. **SAST/DAST**: Static and dynamic security testing

### Operational Security
1. **Least Privilege**: Minimal permissions by default
2. **Defense in Depth**: Multiple security layers
3. **Zero Trust**: Verify everything, trust nothing
4. **Immutable Infrastructure**: No runtime modifications

### Data Security
1. **Classification**: Data classified by sensitivity
2. **Retention**: Automated data lifecycle management
3. **Anonymization**: PII masked in non-production
4. **Backup Security**: Encrypted, tested backups

## Next Steps

- Review [Deployment Security](../deployment/security-hardening.md) for implementation
- Check [Operations Security](../operations/security-operations.md) for procedures
- See [Incident Response](../operations/incident-response.md) for detailed plans

---

*Last Updated: January 2025 | MosAIc Security Architecture v1.0.0*
# MosAIc Stack Service Endpoints & Ports Documentation

## Public Service Endpoints (via Traefik)

All services are accessible via HTTPS with automatic SSL certificates from Let's Encrypt.

| Service | URL | Description | Default Credentials |
|---------|-----|-------------|-------------------|
| **Traefik Dashboard** | `https://traefik.${DOMAIN}` | Reverse proxy management | Set via `TRAEFIK_ADMIN_PASSWORD` |
| **Gitea** | `https://git.${DOMAIN}` | Git repository hosting | Admin user created on first login |
| **Plane** | `https://plane.${DOMAIN}` | Project management | `${ADMIN_EMAIL}` / `${PLANE_ADMIN_PASSWORD}` |
| **Plane API** | `https://api-plane.${DOMAIN}` | Plane REST API | API key authentication |
| **BookStack** | `https://docs.${DOMAIN}` | Documentation wiki | `admin@admin.com` / `password` (change immediately) |
| **Portainer** | `https://portainer.${DOMAIN}` | Container management | Set via `secrets/portainer_password` |
| **Grafana** | `https://grafana.${DOMAIN}` | Monitoring dashboards | `admin` / `${GRAFANA_ADMIN_PASSWORD}` |
| **Prometheus** | `https://prometheus.${DOMAIN}` | Metrics server | Protected by `${METRICS_AUTH}` |
| **Alertmanager** | `https://alerts.${DOMAIN}` | Alert management | Protected by `${METRICS_AUTH}` |

## Internal Service Ports

These ports are used for inter-container communication and should not be exposed publicly.

### Core Services

| Service | Container Name | Internal Port | Protocol | Network |
|---------|---------------|---------------|----------|---------|
| **PostgreSQL** | `mosaic-postgres` | 5432 | TCP | `mosaic-db` |
| **MariaDB** | `mosaic-mariadb` | 3306 | TCP | `mosaic-db` |
| **Redis** | `mosaic-redis` | 6379 | TCP | `mosaic-cache` |

### Application Services

| Service | Container Name | Internal Port | Protocol | Network |
|---------|---------------|---------------|----------|---------|
| **Gitea** | `mosaic-gitea` | 3000 (HTTP), 22 (SSH) | TCP | `mosaic-proxy`, `mosaic-db`, `mosaic-cache` |
| **Plane Frontend** | `mosaic-plane-frontend` | 3000 | TCP | `mosaic-proxy` |
| **Plane API** | `mosaic-plane-api` | 8000 | TCP | `mosaic-proxy`, `mosaic-db`, `mosaic-cache` |
| **BookStack** | `mosaic-bookstack` | 80 | TCP | `mosaic-proxy`, `mosaic-db`, `mosaic-cache` |
| **Portainer** | `mosaic-portainer` | 9000 (UI), 8000 (API) | TCP | `mosaic-proxy` |

### Monitoring Services

| Service | Container Name | Internal Port | Protocol | Network |
|---------|---------------|---------------|----------|---------|
| **Prometheus** | `mosaic-prometheus` | 9090 | TCP | `mosaic-monitoring` |
| **Grafana** | `mosaic-grafana` | 3000 | TCP | `mosaic-monitoring`, `mosaic-proxy` |
| **Loki** | `mosaic-loki` | 3100 | TCP | `mosaic-monitoring` |
| **Alertmanager** | `mosaic-alertmanager` | 9093 | TCP | `mosaic-monitoring`, `mosaic-proxy` |

### Metric Exporters

| Service | Container Name | Internal Port | Protocol | Purpose |
|---------|---------------|---------------|----------|---------|
| **Node Exporter** | `mosaic-node-exporter` | 9100 | TCP | Host system metrics |
| **cAdvisor** | `mosaic-cadvisor` | 8080 | TCP | Container metrics |
| **Postgres Exporter** | `mosaic-postgres-exporter` | 9187 | TCP | PostgreSQL metrics |
| **Redis Exporter** | `mosaic-redis-exporter` | 9121 | TCP | Redis metrics |
| **Blackbox Exporter** | `mosaic-blackbox-exporter` | 9115 | TCP | Endpoint monitoring |

## Docker Networks

The stack uses isolated Docker networks for security and service segregation:

| Network Name | Purpose | Connected Services |
|--------------|---------|-------------------|
| `mosaic-proxy` | External access via Traefik | All public-facing services |
| `mosaic-db` | Database connections | PostgreSQL, MariaDB, and dependent services |
| `mosaic-cache` | Redis connections | Redis and dependent services |
| `mosaic-monitoring` | Monitoring infrastructure | All monitoring components |
| `mosaic-backup` | Backup operations | Backup service only |

## Health Check Endpoints

Each service provides health check endpoints for monitoring:

| Service | Health Check URL | Expected Response |
|---------|-----------------|-------------------|
| **Gitea** | `http://localhost:3000/api/v1/version` | JSON with version info |
| **Plane API** | `http://localhost:8000/api/health/` | HTTP 200 OK |
| **BookStack** | `http://localhost:80` | HTTP 200 OK |
| **Portainer** | `http://localhost:9000` | HTTP 200 OK |
| **Grafana** | `http://localhost:3000/api/health` | JSON health status |
| **PostgreSQL** | `pg_isready -U postgres` | "accepting connections" |
| **MariaDB** | `healthcheck.sh --connect` | Exit code 0 |
| **Redis** | `redis-cli ping` | "PONG" |

## API Documentation

### Gitea API
- **Base URL**: `https://git.${DOMAIN}/api/v1`
- **Authentication**: Personal Access Token or Basic Auth
- **Documentation**: `https://git.${DOMAIN}/api/swagger`

### Plane API
- **Base URL**: `https://api-plane.${DOMAIN}/api`
- **Authentication**: API Key in header
- **Documentation**: Available in Plane settings

### Portainer API
- **Base URL**: `https://portainer.${DOMAIN}/api`
- **Authentication**: JWT token
- **Documentation**: `https://portainer.${DOMAIN}/api/docs`

## Security Notes

1. **All external traffic** must go through Traefik for SSL termination
2. **Internal services** should never be exposed directly to the internet
3. **Database ports** (5432, 3306, 6379) must remain internal only
4. **Use strong passwords** for all service accounts
5. **Enable 2FA** where supported (Gitea, Portainer)
6. **Regular backups** are configured to run daily at 3 AM
7. **Monitor logs** via Grafana/Loki for security events

## Port Conflicts to Avoid

When deploying additional services, avoid these commonly used ports:

- 80, 443 (HTTP/HTTPS - used by Traefik)
- 3000 (Common web app port)
- 5432 (PostgreSQL)
- 3306 (MySQL/MariaDB)
- 6379 (Redis)
- 8080 (Common API port)
- 9090 (Prometheus)

## Troubleshooting Connectivity

### Check service is running:
```bash
docker ps | grep <service-name>
```

### Test internal connectivity:
```bash
docker exec <container> ping <target-container>
docker exec <container> curl http://<target-container>:<port>
```

### Check network membership:
```bash
docker network inspect <network-name>
```

### View service logs:
```bash
docker logs <container-name>
```
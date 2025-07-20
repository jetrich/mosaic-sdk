# MosAIc Stack Deployment

This directory contains all deployment configurations and scripts for the MosAIc Stack infrastructure.

## 📁 Directory Structure

```
deployment/
├── docker/                     # Docker configurations
│   ├── docker-compose.mosaicstack-portainer.yml
│   └── PORTAINER-DEPLOYMENT.md
├── infrastructure/             # Infrastructure configurations
│   └── kubernetes/            # K8s manifests (future)
├── services/                  # Service-specific configurations
│   ├── gitea/                # Git repository service
│   ├── bookstack/            # Documentation platform
│   ├── woodpecker/           # CI/CD platform
│   └── plane/                # Project management
├── scripts/                   # Deployment automation scripts
│   ├── init-databases.sh     # Database initialization
│   ├── redis.conf            # Redis configuration
│   └── validate-deployment.sh # Deployment validation
├── agents/                    # Agent deployment scripts
│   └── START_AGENTS.sh       # Agent orchestration
├── backup/                    # Backup configurations
└── docs/                      # Deployment documentation
```

## 🚀 Quick Start

### Local Development

```bash
# Start the stack with Portainer
cd docker
docker-compose -f docker-compose.mosaicstack-portainer.yml up -d

# Initialize databases
cd ../scripts
./init-databases.sh

# Validate deployment
./validate-deployment.sh
```

### Production Deployment

See [docker/PORTAINER-DEPLOYMENT.md](docker/PORTAINER-DEPLOYMENT.md) for detailed production deployment instructions.

## 🔧 Services

### Core Infrastructure
- **PostgreSQL**: Primary database for all services
- **Redis**: Session management and caching
- **Portainer**: Container management UI

### Application Services
- **Gitea**: Git repository hosting
- **Woodpecker CI**: Continuous integration
- **BookStack**: Documentation platform
- **Plane.so**: Project management (optional)

## 📝 Configuration

### Environment Variables

Create a `.env` file based on the template:

```bash
# Core Database
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure_password>
POSTGRES_MULTIPLE_DATABASES=woodpecker_prod,bookstack_prod,plane_prod

# Redis
REDIS_PASSWORD=<secure_password>

# Service Domains
GITEA_DOMAIN=git.mosaicstack.dev
WOODPECKER_DOMAIN=ci.mosaicstack.dev
BOOKSTACK_DOMAIN=docs.mosaicstack.dev
PLANE_DOMAIN=pm.mosaicstack.dev
```

### Service Configuration

Each service has its own configuration in the `services/` directory:
- Gitea setup scripts and webhooks
- Woodpecker agent configuration
- BookStack initialization
- Plane.so authentication setup

## 🔐 Security

- All services use strong passwords
- Redis requires authentication
- Services are isolated in Docker networks
- HTTPS recommended for production (via reverse proxy)

## 🛠️ Maintenance

### Backup Strategy

```bash
# Backup all databases
./scripts/backup-databases.sh

# Backup service data
./scripts/backup-services.sh
```

### Health Checks

```bash
# Check all services
./scripts/check-all-services.sh

# Check specific service
./scripts/check-gitea-db.sh
```

## 📚 Documentation

- [Infrastructure Task Breakdown](INFRASTRUCTURE_TASK_BREAKDOWN.md)
- [Agent Deployment Guide](AGENT_DEPLOYMENT_GUIDE.md)
- [CI/CD Pipeline Documentation](../docs/cicd-pipeline-implementation.md)
- [Complete Deployment Guide](../docs/deployment/complete-deployment-guide.md)

## 🆘 Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Check PostgreSQL is running
   - Verify database credentials
   - Run `./scripts/check-which-db.sh`

2. **Service Not Starting**
   - Check logs: `docker-compose logs <service>`
   - Verify environment variables
   - Check port conflicts

3. **Gitea Issues**
   - See [services/gitea/gitea-admin-tasks.md](services/gitea/gitea-admin-tasks.md)
   - Run admin commands via `./scripts/gitea-admin-commands.sh`

## 🤝 Contributing

When adding new services:
1. Create directory in `services/`
2. Add to docker-compose configuration
3. Update database initialization if needed
4. Document in this README
5. Add health check script

---

Part of the [MosAIc Stack](https://github.com/jetrich/mosaic-sdk) - Enterprise AI Development Platform
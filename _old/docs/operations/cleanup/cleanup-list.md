# MosAIc Stack Deployment - File Cleanup List

## Main Production File to Keep:
✅ **docker-compose.mosaicstack-portainer.yml** - The main deployment file

## Supporting Files to Keep:
✅ **.env.example** - Environment variable template
✅ **PORTAINER-DEPLOYMENT.md** - Deployment guide
✅ **scripts/init-databases.sh** - PostgreSQL init script (for server)
✅ **scripts/redis.conf** - Redis configuration (for server)
✅ **scripts/check-gitea-db.sh** - Database troubleshooting
✅ **scripts/gitea-admin-commands.sh** - Gitea admin reference

## Test/Debug Files (Can be Removed):
- docker-compose.mosaicstack-fixed.yml - Early version with network fixes
- docker-compose.mosaicstack-debug.yml - Debug version for troubleshooting
- docker-compose.mosaicstack-fixed-ssh.yml - SSH fix testing
- docker-compose.mosaicstack-preserve-data.yml - Incomplete version
- docker-compose.mosaicstack-portainer-noplane.yml - Version without Plane.so
- docker-compose.mosaicstack.yml - Original version with issues
- docker-compose.portainer.yml - Original Portainer version

## Configuration Files (Already Moved):
- config/postgres/postgresql.conf - Not needed (using defaults)
- config/postgres/init-databases.sh - Duplicate of scripts version
- config/redis/redis.conf - Duplicate of scripts version

## Documentation (Can Keep for Reference):
- GITEA-TROUBLESHOOTING.md - Useful troubleshooting guide
- AGENT_DEPLOYMENT_GUIDE.md - From previous agent work
- INFRASTRUCTURE_TASK_BREAKDOWN.md - From previous agent work

## Current Service Status:
- ✅ PostgreSQL - Running (using ${POSTGRES_DB} database)
- ✅ Redis - Running with authentication
- ✅ Gitea - Running (data preserved in postgres database)
- ⏸️ Woodpecker - Commented out (ready when needed)
- 🔄 BookStack - Ready to deploy
- 🔄 Plane.so - Ready to deploy (if authentication works)

## Environment Variables Needed:
```bash
# Core Database
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your_password>
POSTGRES_MULTIPLE_DATABASES=woodpecker_prod,bookstack_prod,plane_prod

# Redis
REDIS_PASSWORD=<your_password>

# Gitea
GITEA_DOMAIN=git.mosaicstack.dev
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true

# Woodpecker (when ready)
WOODPECKER_DOMAIN=ci.mosaicstack.dev
WOODPECKER_GITEA_CLIENT=<from_gitea_oauth>
WOODPECKER_GITEA_SECRET=<from_gitea_oauth>
WOODPECKER_AGENT_SECRET=<secure_secret>
WOODPECKER_ADMIN=admin

# BookStack
BOOKSTACK_DOMAIN=docs.mosaicstack.dev
BOOKSTACK_APP_KEY=<32_char_key>

# Plane.so (if using)
PLANE_DOMAIN=pm.mosaicstack.dev
PLANE_SECRET_KEY=<32_char_key>

# Logging
LOG_LEVEL=Info
```
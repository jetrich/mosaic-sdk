# Portainer Deployment Guide for MosAIc Stack

This guide covers deploying the MosAIc development stack using Portainer with bind mounts to `/opt/mosaic/`.

## Prerequisites

- Portainer installed and accessible
- Docker host with sufficient resources (4+ cores, 8+ GB RAM, 100+ GB storage)
- Nginx proxy manager already deployed
- Domain `mosaicstack.dev` with DNS configured for subdomains

## Step 1: Host Filesystem Setup

Before deploying in Portainer, you must set up the host filesystem structure and configuration files.

### Run the Setup Script

On your Docker host, run the filesystem setup script:

```bash
# Download and run the setup script
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/jetrich/mosaic-sdk/main/scripts/setup-host-filesystem.sh)"

# Or if you have the repository locally:
cd /path/to/mosaic-sdk
sudo ./scripts/setup-host-filesystem.sh
```

This script will:
- Create directory structure in `/opt/mosaic/`
- Generate all configuration files
- Set proper permissions (1000:1000)
- Create backup scripts
- Provide environment variable template

### Verify Setup

After running the script, verify the structure:

```bash
ls -la /opt/mosaic/
```

You should see:
```
drwxr-xr-x  9 1000 1000  4096 Jul 18 12:00 .
drwxr-xr-x  3 root root  4096 Jul 18 12:00 ..
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 backups
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 bookstack
-rw-r--r--  1 1000 1000  1234 Jul 18 12:00 environment-template.env
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 gitea
drwxr-xr-x  2 1000 1000  4096 Jul 18 12:00 logs
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 plane
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 postgres
-rw-r--r--  1 1000 1000  2345 Jul 18 12:00 README.md
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 redis
drwxr-xr-x  2 1000 1000  4096 Jul 18 12:00 scripts
drwxr-xr-x  3 1000 1000  4096 Jul 18 12:00 woodpecker
```

## Step 2: Configure Environment Variables

Review the environment template and prepare your variables:

```bash
cat /opt/mosaic/environment-template.env
```

### Required Variables

You'll need to set these in Portainer:

| Variable | Description | Example/Notes |
|----------|-------------|---------------|
| `POSTGRES_PASSWORD` | PostgreSQL master password | Generate strong 32+ char password |
| `REDIS_PASSWORD` | Redis authentication password | Generate strong 32+ char password |
| `WOODPECKER_GITEA_CLIENT` | OAuth client ID from Gitea | Set after Gitea setup |
| `WOODPECKER_GITEA_SECRET` | OAuth client secret from Gitea | Set after Gitea setup |
| `WOODPECKER_AGENT_SECRET` | Woodpecker agent shared secret | Generate random 64+ char string |
| `PLANE_SECRET_KEY` | Django secret key for Plane.so | Generate random 50+ char string |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITEA_DISABLE_REGISTRATION` | `true` | Disable public registration |
| `GITEA_REQUIRE_SIGNIN` | `true` | Require sign-in to view repos |
| `WOODPECKER_ADMIN` | `admin` | Gitea username for Woodpecker admin |

## Step 3: Deploy Stack in Portainer

### Create New Stack

1. **Navigate to Stacks** in Portainer
2. **Add Stack** with name: `mosaicstack`
3. **Build Method**: Repository
4. **Repository URL**: `https://github.com/jetrich/mosaic-sdk`
5. **Repository Reference**: `main`
6. **Compose Path**: `docker-compose.portainer.yml`

### Configure Environment Variables

In the **Environment variables** section, add all required variables:

```
POSTGRES_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here
WOODPECKER_GITEA_CLIENT=your_gitea_oauth_client_id
WOODPECKER_GITEA_SECRET=your_gitea_oauth_client_secret
WOODPECKER_AGENT_SECRET=your_woodpecker_agent_secret
PLANE_SECRET_KEY=your_plane_secret_key_here
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true
WOODPECKER_ADMIN=admin
```

### Deploy Stack

1. **Deploy the stack**
2. **Monitor deployment** in Portainer logs
3. **Verify all services** are healthy

## Step 4: Configure Nginx Proxy Manager

Create proxy hosts for each service. See the [Nginx Proxy Manager Setup Guide](nginx-proxy-manager-setup.md) for detailed configuration.

**Required Proxy Hosts:**
- `git.mosaicstack.dev` → `mosaicstack-gitea:3000`
- `ci.mosaicstack.dev` → `mosaicstack-woodpecker-server:8000`
- `docs.mosaicstack.dev` → `mosaicstack-bookstack:8080`
- `pm.mosaicstack.dev` → `mosaicstack-plane-web:3001`

## Step 5: Initial Service Configuration

### 1. Gitea Setup

1. **Access Gitea**: `https://git.mosaicstack.dev`
2. **Complete initial setup** if prompted
3. **Create admin user** (use username matching `WOODPECKER_ADMIN`)
4. **Create organizations**:
   - `mosaic-org` for MosAIc projects
   - `tony-org` for Tony framework projects

### 2. Woodpecker OAuth Setup

1. **In Gitea**: Settings → Applications → OAuth2 Applications
2. **Create new OAuth2 application**:
   - **Application Name**: `Woodpecker CI`
   - **Redirect URI**: `https://ci.mosaicstack.dev/authorize`
3. **Copy Client ID and Secret** to Portainer environment variables
4. **Restart Woodpecker services** in Portainer

### 3. BookStack Setup

1. **Access BookStack**: `https://docs.mosaicstack.dev`
2. **Default login**: `admin@admin.com` / `password`
3. **Change admin password** immediately
4. **Configure settings** as needed

### 4. Plane.so Setup

1. **Access Plane.so**: `https://pm.mosaicstack.dev`
2. **Create admin account**
3. **Set up workspace**: "MosAIc Development"
4. **Create initial projects**

## Step 6: Verification

### Service Health Checks

```bash
# Check all containers are running
docker ps --filter "name=mosaicstack"

# Check service logs
docker logs mosaicstack-postgres
docker logs mosaicstack-redis
docker logs mosaicstack-gitea
docker logs mosaicstack-woodpecker-server
docker logs mosaicstack-bookstack
docker logs mosaicstack-plane-web
```

### Network Connectivity

```bash
# Test internal connectivity
docker exec mosaicstack-gitea ping -c 1 postgres
docker exec mosaicstack-woodpecker-server ping -c 1 gitea

# Test external access
curl -I https://git.mosaicstack.dev
curl -I https://ci.mosaicstack.dev
curl -I https://docs.mosaicstack.dev
curl -I https://pm.mosaicstack.dev
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Fix ownership
   sudo chown -R 1000:1000 /opt/mosaic
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker logs mosaicstack-postgres
   
   # Verify database creation
   docker exec mosaicstack-postgres psql -U postgres -l
   ```

3. **Redis Connection Issues**
   ```bash
   # Test Redis connectivity
   docker exec mosaicstack-redis redis-cli ping
   ```

4. **Network Issues**
   ```bash
   # Verify nginx proxy manager network
   docker network ls | grep nginx
   
   # Connect services to nginx network if needed
   docker network connect nginx-proxy-manager_default mosaicstack-gitea
   ```

### Log Locations

- **Application logs**: `/opt/mosaic/logs/`
- **PostgreSQL logs**: Inside container `/var/log/postgresql/`
- **Container logs**: `docker logs <container_name>`

## Backup and Maintenance

### Automated Backup

```bash
# Run backup script
sudo /opt/mosaic/scripts/backup.sh

# Schedule with cron (daily at 2 AM)
echo "0 2 * * * /opt/mosaic/scripts/backup.sh" | sudo crontab -
```

### Updates

1. **Update stack** in Portainer (pulls latest images)
2. **Backup before updates**
3. **Monitor service health** after updates

### Monitoring

- **Portainer dashboard** for container status
- **Service-specific monitoring** in each application
- **System resources** on Docker host

## Security Considerations

1. **Firewall Configuration**
   - Only expose ports 80, 443, 2222 (SSH)
   - Block direct access to service ports

2. **SSL Certificates**
   - Auto-renewal via nginx proxy manager
   - Strong SSL configuration

3. **Access Control**
   - Disable public registration in Gitea
   - Use strong passwords for all services
   - Regular security updates

4. **Backup Security**
   - Encrypt backups if storing off-site
   - Secure backup storage location
   - Test backup restoration regularly

## Performance Tuning

1. **Database Optimization**
   - Monitor PostgreSQL performance
   - Adjust `postgresql.conf` as needed
   - Regular VACUUM and ANALYZE

2. **Redis Optimization**
   - Monitor memory usage
   - Adjust `maxmemory` in redis.conf
   - Configure appropriate eviction policy

3. **Container Resources**
   - Set resource limits in docker-compose
   - Monitor container CPU and memory usage
   - Scale services as needed
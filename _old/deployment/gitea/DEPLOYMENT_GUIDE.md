# Gitea Deployment Guide for Mosaic Stack

## 📋 Prerequisites

- Docker and Docker Compose installed on the VM
- Portainer access to the VM
- At least 2GB RAM and 10GB disk space
- Ports 3000 and 2222 available

## 🚀 Quick Start Deployment

### Step 1: Prepare the Environment

1. **Copy files to your VM:**
   ```bash
   # On the VM, create the deployment directory
   mkdir -p /opt/mosaic/gitea
   cd /opt/mosaic/gitea
   
   # Copy the docker-compose.yml and .env.example files
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   
   # Generate secure passwords and keys
   echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
   echo "GITEA_SECRET_KEY=$(openssl rand -hex 32)" >> .env
   echo "GITEA_INTERNAL_TOKEN=$(openssl rand -hex 32)" >> .env
   ```

3. **Update domain (optional):**
   ```bash
   # Edit .env to set your domain
   nano .env
   # Change GITEA_DOMAIN if needed
   ```

### Step 2: Deploy with Portainer

#### Option A: Using Portainer Stacks (Recommended)

1. Open Portainer web UI
2. Navigate to **Stacks** → **Add Stack**
3. Name: `mosaic-gitea`
4. **Build method**: Upload the docker-compose.yml content
5. **Environment variables**: Add from .env file
6. Click **Deploy the stack**

#### Option B: Using Docker Compose CLI

```bash
# Deploy the stack
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f gitea
```

### Step 3: Initial Gitea Configuration

1. **Access Gitea Web UI:**
   - URL: `http://YOUR_VM_IP:3000`
   - First access will show the installation page

2. **Installation Settings (Auto-filled, just verify):**
   - Database Type: PostgreSQL
   - Host: postgres:5432
   - Username: gitea
   - Password: (from your .env)
   - Database Name: gitea

3. **Create Admin Account:**
   - Username: `admin`
   - Password: (choose a secure password)
   - Email: `admin@local.mosaic`

4. **Optional Settings:**
   - Enable LFS: ✓ (Already configured)
   - Disable self-registration: Your choice
   - Require Sign-In to View: Your choice

5. Click **Install Gitea**

### Step 4: Configure GitHub Sync

1. **Create GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens
   - Create token with `repo` scope
   - Save the token securely

2. **In Gitea Admin Panel:**
   ```
   Settings → Integrations → Add GitHub Migration
   ```

3. **Create sync script** (save as `/opt/mosaic/gitea/sync-github.sh`):
   ```bash
   #!/bin/bash
   # GitHub sync script for Gitea
   
   GITEA_URL="http://localhost:3000"
   GITEA_TOKEN="YOUR_GITEA_TOKEN"
   GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
   
   # Add your sync logic here
   # This will be expanded based on your needs
   ```

## 📊 Database Structure

### Core Tables Created by Gitea

```sql
-- Main tables you'll interact with:
- user                  -- User accounts
- repository           -- Git repositories  
- issue                -- Issues/tickets
- pull_request         -- Pull requests
- access               -- Repository permissions
- team                 -- Team management
- organization         -- Organization structure
- webhook              -- Webhook configurations
- action               -- Activity feed
- notice               -- System notices
```

### Useful Database Queries

```sql
-- Get all repositories
SELECT id, owner_id, name, description FROM repository;

-- Get all users
SELECT id, name, email, is_admin FROM user;

-- Check webhook status
SELECT id, repo_id, url, is_active FROM webhook;
```

## 🔧 Maintenance

### Daily Backups

The stack includes an optional backup service. Enable it:

```bash
docker-compose --profile with-backup up -d
```

### Manual Backup

```bash
# Backup database
docker exec mosaic-postgres pg_dump -U gitea gitea > gitea_backup_$(date +%Y%m%d).sql

# Backup Gitea data
tar -czf gitea_data_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/gitea_gitea-data/
```

### Health Monitoring

```bash
# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check Gitea API health
curl http://localhost:3000/api/healthz
```

## 🌐 Network Configuration

### For External Access

1. **Configure reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name git.yourdomain.com;
       
       location / {
           proxy_pass http://YOUR_VM_IP:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Update .env:**
   ```bash
   GITEA_DOMAIN=git.yourdomain.com
   GITEA_EXTERNAL_URL=https://git.yourdomain.com
   ```

## 🔐 Security Hardening

1. **Enable 2FA for admin accounts**
2. **Restrict registration** (if public facing)
3. **Configure fail2ban** for SSH access
4. **Use HTTPS** with reverse proxy
5. **Regular security updates:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Cannot connect to database:**
   - Check postgres container is healthy
   - Verify password in .env matches

2. **Web UI not accessible:**
   - Check firewall rules
   - Verify port 3000 is not in use

3. **SSH git clone fails:**
   - Use port 2222 instead of 22
   - Format: `git@YOUR_VM_IP:2222:username/repo.git`

### Debug Commands

```bash
# Check logs
docker logs mosaic-gitea
docker logs mosaic-postgres

# Enter container
docker exec -it mosaic-gitea bash

# Test database connection
docker exec mosaic-postgres psql -U gitea -d gitea -c "SELECT version();"
```

## 📈 Next Steps

Once Gitea is running:

1. **Create organizations** for Tony, Mosaic projects
2. **Import repositories** from GitHub
3. **Setup webhooks** for CI/CD integration
4. **Configure automated sync** with GitHub
5. **Add Woodpecker CI** (Phase 2)

## 🆘 Support

- Gitea Documentation: https://docs.gitea.io
- Report issues in: jetrich/mosaic-mcp
- Docker logs: `docker-compose logs -f`

---

**Note:** This deployment is designed for internal/development use. For production, consider additional security measures and monitoring.
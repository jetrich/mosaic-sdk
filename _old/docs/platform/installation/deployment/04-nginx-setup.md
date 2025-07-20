---
title: "04 Nginx Setup"
order: 04
category: "deployment"
tags: ["deployment", "installation", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Nginx Proxy Manager Configuration for MosAIc Stack

This guide covers setting up nginx proxy manager proxy hosts for the MosAIc development stack services.

## Prerequisites

- Nginx Proxy Manager already deployed and accessible
- MosAIc stack deployed via Portainer using `docker-compose.mosaicstack.yml`
- DNS records configured for `*.mosaicstack.dev` pointing to your server
- All services running and healthy

## Required Proxy Hosts

You need to create 4 proxy hosts in nginx proxy manager:

### 1. Gitea - git.mosaicstack.dev

**Proxy Host Configuration:**
- **Domain Names**: `git.mosaicstack.dev`
- **Scheme**: `http`
- **Forward Hostname/IP**: `mosaicstack-gitea` (container name) or your server's internal IP
- **Forward Port**: `3000`
- **Cache Assets**: ✅ Enabled
- **Block Common Exploits**: ✅ Enabled
- **Websockets Support**: ✅ Enabled

**SSL Configuration:**
- **SSL Certificate**: Request a new SSL certificate
- **Force SSL**: ✅ Enabled
- **HTTP/2 Support**: ✅ Enabled
- **HSTS Enabled**: ✅ Enabled
- **HSTS Subdomains**: ✅ Enabled

**Advanced Configuration:**
```nginx
# Handle Gitea-specific headers
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;

# Increase timeouts for Git operations
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;

# Handle large Git pushes
client_max_body_size 0;
```

### 2. Woodpecker CI - ci.mosaicstack.dev

**Proxy Host Configuration:**
- **Domain Names**: `ci.mosaicstack.dev`
- **Scheme**: `http`
- **Forward Hostname/IP**: `mosaicstack-woodpecker-server` (container name) or your server's internal IP
- **Forward Port**: `8000`
- **Cache Assets**: ✅ Enabled
- **Block Common Exploits**: ✅ Enabled
- **Websockets Support**: ✅ Enabled (Required for real-time build logs)

**SSL Configuration:**
- **SSL Certificate**: Request a new SSL certificate
- **Force SSL**: ✅ Enabled
- **HTTP/2 Support**: ✅ Enabled
- **HSTS Enabled**: ✅ Enabled

**Advanced Configuration:**
```nginx
# WebSocket support for build logs
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Longer timeouts for build operations
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

### 3. BookStack - docs.mosaicstack.dev

**Proxy Host Configuration:**
- **Domain Names**: `docs.mosaicstack.dev`
- **Scheme**: `http`
- **Forward Hostname/IP**: `mosaicstack-bookstack` (container name) or your server's internal IP
- **Forward Port**: `8080`
- **Cache Assets**: ✅ Enabled
- **Block Common Exploits**: ✅ Enabled
- **Websockets Support**: ❌ Not required

**SSL Configuration:**
- **SSL Certificate**: Request a new SSL certificate
- **Force SSL**: ✅ Enabled
- **HTTP/2 Support**: ✅ Enabled
- **HSTS Enabled**: ✅ Enabled

**Advanced Configuration:**
```nginx
# Standard headers for BookStack
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# File upload support
client_max_body_size 100M;
```

### 4. Plane.so - pm.mosaicstack.dev

**Proxy Host Configuration:**
- **Domain Names**: `pm.mosaicstack.dev`
- **Scheme**: `http`
- **Forward Hostname/IP**: `mosaicstack-plane-web` (container name) or your server's internal IP
- **Forward Port**: `3001`
- **Cache Assets**: ✅ Enabled
- **Block Common Exploits**: ✅ Enabled
- **Websockets Support**: ✅ Enabled (Required for real-time updates)

**SSL Configuration:**
- **SSL Certificate**: Request a new SSL certificate
- **Force SSL**: ✅ Enabled
- **HTTP/2 Support**: ✅ Enabled
- **HSTS Enabled**: ✅ Enabled

**Advanced Configuration:**
```nginx
# WebSocket support for real-time updates
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Handle file uploads
client_max_body_size 50M;
```

## Network Configuration

### Docker Network Access

If nginx proxy manager is running in a different Docker network, you'll need to:

1. **Connect nginx proxy manager to the MosAIc network:**
   ```bash
   docker network connect mosaicstack-internal <nginx-proxy-manager-container>
   ```

2. **Or use IP addresses instead of container names:**
   - Find your server's internal IP: `ip route get 1 | head -1 | cut -d' ' -f7`
   - Use this IP as the Forward Hostname/IP in proxy host configurations

### Firewall Considerations

Ensure these ports are accessible from nginx proxy manager to the MosAIc containers:
- Port 3000 (Gitea)
- Port 8000 (Woodpecker)
- Port 8080 (BookStack)
- Port 3001 (Plane.so)

## Testing Configuration

After creating all proxy hosts:

1. **Test Gitea**: Navigate to `https://git.mosaicstack.dev`
2. **Test Woodpecker**: Navigate to `https://ci.mosaicstack.dev`
3. **Test BookStack**: Navigate to `https://docs.mosaicstack.dev`
4. **Test Plane.so**: Navigate to `https://pm.mosaicstack.dev`

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if services are running: `docker ps | grep mosaicstack`
   - Verify network connectivity between nginx proxy manager and services
   - Check container logs: `docker logs <container-name>`

2. **SSL Certificate Issues**
   - Ensure DNS records are properly configured
   - Check that ports 80 and 443 are accessible from the internet
   - Verify nginx proxy manager can reach Let's Encrypt servers

3. **WebSocket Connection Issues (Woodpecker/Plane)**
   - Ensure WebSocket support is enabled in proxy host
   - Check that `Upgrade` and `Connection` headers are properly set
   - Verify no intermediate proxies are stripping WebSocket headers

4. **Large File Upload Issues (Gitea/BookStack)**
   - Increase `client_max_body_size` in advanced configuration
   - Check Docker container resource limits
   - Verify storage space availability

### Verification Commands

```bash
# Check service status
docker ps --filter "name=mosaicstack"

# Check network connectivity
docker exec nginx-proxy-manager curl -f http://mosaicstack-gitea:3000/api/healthz

# View service logs
docker logs mosaicstack-gitea
docker logs mosaicstack-woodpecker-server
docker logs mosaicstack-bookstack
docker logs mosaicstack-plane-web
```

## Security Considerations

1. **Access Lists**: Consider creating access lists in nginx proxy manager for administrative interfaces
2. **Rate Limiting**: Configure rate limiting for public-facing services
3. **SSL Configuration**: Ensure strong SSL/TLS configuration with modern cipher suites
4. **Header Security**: Add security headers like `X-Frame-Options`, `X-Content-Type-Options`, etc.

## Next Steps

After configuring nginx proxy manager:

1. Complete initial service setup (Gitea admin user, Woodpecker OAuth, etc.)
2. Configure service integrations (Woodpecker ↔ Gitea OAuth)
3. Set up organizations and repositories in Gitea
4. Configure CI/CD pipelines in Woodpecker
5. Import documentation into BookStack
6. Set up projects and teams in Plane.so
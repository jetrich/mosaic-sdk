# MosAIc Stack Security Hardening Checklist

## Pre-Deployment Security

### Environment Configuration
- [ ] Generate all passwords with minimum 16 characters using `openssl rand -base64 32`
- [ ] Store `.env` file with restrictive permissions: `chmod 600 .env`
- [ ] Never commit `.env` files to version control
- [ ] Use different passwords for each service
- [ ] Rotate all default passwords before first deployment

### SSL/TLS Configuration
- [ ] Verify domain DNS records point to server
- [ ] Configure valid email for Let's Encrypt notifications
- [ ] Enable HSTS headers in Traefik configuration
- [ ] Set minimum TLS version to 1.2
- [ ] Disable weak cipher suites

## Network Security

### Firewall Rules
- [ ] Only expose ports 80 and 443 to internet
- [ ] Block all other ports at firewall level
- [ ] Whitelist specific IPs for SSH access
- [ ] Enable fail2ban for SSH protection
- [ ] Configure rate limiting for public endpoints

### Docker Network Isolation
- [ ] Verify services use appropriate isolated networks
- [ ] Ensure databases are not on proxy network
- [ ] Check no unnecessary port mappings in docker-compose
- [ ] Validate internal services cannot be accessed externally
- [ ] Review `docker network ls` for orphaned networks

## Authentication & Authorization

### Service Accounts
- [ ] Change all default admin passwords
- [ ] Enable 2FA for Gitea admin accounts
- [ ] Enable 2FA for Portainer admin
- [ ] Disable default admin accounts where possible
- [ ] Create service-specific accounts (no shared credentials)

### API Security
- [ ] Generate secure API keys for all services
- [ ] Rotate API keys quarterly
- [ ] Implement API rate limiting
- [ ] Log all API access
- [ ] Use API keys instead of passwords where possible

### Access Control
- [ ] Implement RBAC for all services
- [ ] Follow principle of least privilege
- [ ] Regular audit of user permissions
- [ ] Remove inactive user accounts
- [ ] Document access control matrix

## Database Security

### PostgreSQL Hardening
- [ ] Change default postgres password
- [ ] Create application-specific database users
- [ ] Restrict database user permissions
- [ ] Enable SSL for database connections
- [ ] Configure pg_hba.conf for strict access control
- [ ] Enable logging of all connections

### MariaDB Hardening
- [ ] Run mysql_secure_installation equivalent
- [ ] Remove anonymous users
- [ ] Disable remote root login
- [ ] Remove test database
- [ ] Create application-specific users with limited privileges
- [ ] Enable binary logging for audit trail

### Redis Security
- [ ] Set strong Redis password
- [ ] Bind Redis to localhost only
- [ ] Disable dangerous commands (FLUSHDB, FLUSHALL, CONFIG)
- [ ] Enable Redis ACL if using Redis 6+
- [ ] Configure maxmemory policy
- [ ] Enable Redis persistence

## Application Security

### Gitea Security
- [ ] Disable self-registration or require admin approval
- [ ] Configure webhook secrets
- [ ] Enable signed commits
- [ ] Set repository upload size limits
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates

### Plane Security
- [ ] Disable public signup
- [ ] Configure secure session settings
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
- [ ] Configure Content Security Policy
- [ ] Regular dependency updates

### BookStack Security
- [ ] Change default admin email/password
- [ ] Configure secure session lifetime
- [ ] Enable MFA support
- [ ] Restrict file upload types
- [ ] Set maximum upload sizes
- [ ] Configure backup encryption

## Container Security

### Image Security
- [ ] Use specific version tags (not :latest)
- [ ] Scan images for vulnerabilities
- [ ] Use official or verified images only
- [ ] Regular image updates
- [ ] Implement image signing
- [ ] Maintain image allowlist

### Runtime Security
- [ ] Run containers as non-root where possible
- [ ] Use read-only root filesystems
- [ ] Drop unnecessary capabilities
- [ ] Implement resource limits
- [ ] Enable Docker content trust
- [ ] Use security profiles (AppArmor/SELinux)

### Volume Security
- [ ] Encrypt sensitive volumes
- [ ] Set appropriate volume permissions
- [ ] Regular volume backups
- [ ] Secure backup storage
- [ ] Test backup restoration
- [ ] Implement backup encryption

## Monitoring & Logging

### Security Monitoring
- [ ] Enable comprehensive logging for all services
- [ ] Configure centralized log collection (Loki)
- [ ] Set up security alerts in Prometheus
- [ ] Monitor failed login attempts
- [ ] Track privilege escalations
- [ ] Alert on configuration changes

### Audit Logging
- [ ] Enable audit logs for all services
- [ ] Log all authentication attempts
- [ ] Track authorization failures
- [ ] Monitor API usage
- [ ] Retain logs for compliance period
- [ ] Secure log storage

### Intrusion Detection
- [ ] Monitor for unusual network traffic
- [ ] Alert on port scanning attempts
- [ ] Track file integrity changes
- [ ] Monitor container behavior
- [ ] Set up honeypots if needed
- [ ] Regular security scans

## Backup & Recovery

### Backup Security
- [ ] Encrypt all backups at rest
- [ ] Secure backup transmission
- [ ] Test backup restoration regularly
- [ ] Store backups off-site
- [ ] Implement backup access controls
- [ ] Document recovery procedures

### Disaster Recovery
- [ ] Create disaster recovery plan
- [ ] Document RTO/RPO requirements
- [ ] Regular DR drills
- [ ] Maintain runbooks
- [ ] Keep configuration backups
- [ ] Version control infrastructure code

## Compliance & Maintenance

### Security Updates
- [ ] Subscribe to security advisories
- [ ] Regular OS patching schedule
- [ ] Container image updates
- [ ] Application security patches
- [ ] Monitor CVE databases
- [ ] Implement patch testing process

### Security Audits
- [ ] Quarterly security reviews
- [ ] Annual penetration testing
- [ ] Regular vulnerability scans
- [ ] Configuration audits
- [ ] Access control reviews
- [ ] Compliance checks

### Documentation
- [ ] Maintain security documentation
- [ ] Document incident response procedures
- [ ] Keep network diagrams updated
- [ ] Track configuration changes
- [ ] Maintain contact lists
- [ ] Regular training updates

## Quick Security Commands

### Generate secure passwords:
```bash
openssl rand -base64 32
```

### Check exposed ports:
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Scan for secrets in code:
```bash
docker run --rm -v $(pwd):/code trufflesecurity/trufflehog filesystem /code
```

### Check SSL configuration:
```bash
docker run --rm -it drwetter/testssl.sh https://your-domain.com
```

### Audit Docker security:
```bash
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock docker/docker-bench-security
```

## Emergency Response

### In case of breach:
1. Isolate affected systems
2. Preserve evidence (logs, memory dumps)
3. Reset all credentials
4. Review access logs
5. Patch vulnerabilities
6. Notify stakeholders
7. Document lessons learned

### Security Contacts:
- Security Team: [Configure in .env]
- On-call: [Configure in .env]
- Management: [Configure in .env]
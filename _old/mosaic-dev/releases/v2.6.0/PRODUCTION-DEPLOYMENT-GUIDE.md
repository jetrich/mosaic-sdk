# Tony Framework v2.6.0 Production Deployment Guide

**Version**: 2.6.0  
**Status**: Production Ready  
**Last Updated**: July 13, 2025  

## 🎯 Overview

This guide provides step-by-step instructions for deploying Tony Framework v2.6.0 in production environments. The framework has passed comprehensive QA validation and is ready for enterprise deployment.

## ✅ Pre-Deployment Checklist

### System Requirements
- **Node.js**: v18.0.0 or higher (v22.17.0 recommended)
- **npm**: v8.0.0 or higher
- **TypeScript**: v5.0.0 or higher
- **Git**: v2.30.0 or higher
- **OS**: Linux, macOS, or Windows with WSL2

### Environment Verification
```bash
# Verify Node.js version
node --version  # Should be v18+

# Verify npm version
npm --version   # Should be v8+

# Verify TypeScript
npx tsc --version  # Should be v5+

# Verify Git
git --version   # Should be v2.30+
```

## 🚀 Installation Methods

### Method 1: Direct Installation (Recommended)
```bash
# Clone the repository
git clone https://github.com/jetrich/tony-ng.git
cd tony-ng/tony

# Install dependencies
npm install

# Build the framework
npm run build

# Verify installation
npm test
```

### Method 2: npm Package Installation
```bash
# Install as a global package
npm install -g @tony/core@2.6.0

# Or install locally
npm install @tony/core@2.6.0
```

### Method 3: Docker Deployment
```bash
# Build Docker image
docker build -t tony-framework:2.6.0 .

# Run container
docker run -d --name tony-framework \
  -v /path/to/projects:/workspace \
  tony-framework:2.6.0
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set Tony home directory
export TONY_HOME="/opt/tony"

# Optional: Set log level
export TONY_LOG_LEVEL="info"

# Optional: Set default model
export TONY_DEFAULT_MODEL="sonnet"

# Optional: Set timeout
export TONY_TIMEOUT="1800"
```

### Configuration Files
```bash
# Create Tony configuration directory
mkdir -p ~/.tony

# Copy default configuration
cp templates/config/default.json ~/.tony/config.json

# Edit configuration as needed
nano ~/.tony/config.json
```

## 🏗️ Production Setup

### 1. Directory Structure
```
/opt/tony/                    # Production installation
├── bin/                      # Executable scripts
├── lib/                      # Core libraries
├── plugins/                  # Plugin directory
├── config/                   # Configuration files
├── logs/                     # Log files
├── temp/                     # Temporary files
└── projects/                 # Project workspace
```

### 2. Service Configuration
```bash
# Create systemd service (Linux)
sudo tee /etc/systemd/system/tony-framework.service > /dev/null <<EOF
[Unit]
Description=Tony Framework Service
After=network.target

[Service]
Type=simple
User=tony
WorkingDirectory=/opt/tony
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=TONY_HOME=/opt/tony

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable tony-framework
sudo systemctl start tony-framework
```

### 3. Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name tony.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔐 Security Configuration

### 1. User Permissions
```bash
# Create dedicated user
sudo useradd -r -s /bin/false tony

# Set ownership
sudo chown -R tony:tony /opt/tony

# Set permissions
sudo chmod 755 /opt/tony
sudo chmod 644 /opt/tony/config/*
sudo chmod 700 /opt/tony/logs
```

### 2. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. SSL/TLS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d tony.yourdomain.com
```

## 📊 Monitoring & Logging

### 1. Log Configuration
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/tony-framework > /dev/null <<EOF
/opt/tony/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 tony tony
    postrotate
        systemctl reload tony-framework
    endscript
}
EOF
```

### 2. Health Monitoring
```bash
# Create health check script
cat > /opt/tony/bin/health-check.sh <<EOF
#!/bin/bash
curl -f http://localhost:3000/health || exit 1
EOF

chmod +x /opt/tony/bin/health-check.sh
```

### 3. Monitoring Integration
```bash
# Prometheus metrics endpoint
# Available at: http://localhost:3000/metrics

# Grafana dashboard
# Import dashboard ID: 12345 (Tony Framework Dashboard)
```

## 🧪 Testing Production Deployment

### 1. Smoke Tests
```bash
# Test basic functionality
./scripts/spawn-agent.sh --context templates/test-context.json --agent-type test-agent

# Test plugin system
npm run test:plugins

# Test hot-reload
npm run test:hot-reload
```

### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run tests/load/basic-load-test.yml
```

### 3. Integration Tests
```bash
# Run full integration test suite
npm run test:integration

# Test with real projects
npm run test:real-world
```

## 🔄 Updates & Maintenance

### 1. Update Procedure
```bash
# Backup current installation
cp -r /opt/tony /opt/tony-backup-$(date +%Y%m%d)

# Download new version
git pull origin main

# Install dependencies
npm install

# Build new version
npm run build

# Run tests
npm test

# Restart service
sudo systemctl restart tony-framework
```

### 2. Rollback Procedure
```bash
# Stop service
sudo systemctl stop tony-framework

# Restore backup
rm -rf /opt/tony
mv /opt/tony-backup-YYYYMMDD /opt/tony

# Start service
sudo systemctl start tony-framework
```

### 3. Maintenance Tasks
```bash
# Weekly maintenance script
cat > /opt/tony/bin/weekly-maintenance.sh <<EOF
#!/bin/bash
# Clean temporary files
find /opt/tony/temp -type f -mtime +7 -delete

# Compress old logs
find /opt/tony/logs -name "*.log" -mtime +1 -exec gzip {} \;

# Update dependencies (if configured)
cd /opt/tony && npm audit fix

# Restart service
systemctl restart tony-framework
EOF

# Schedule with cron
echo "0 2 * * 0 /opt/tony/bin/weekly-maintenance.sh" | sudo crontab -
```

## 🚨 Troubleshooting

### Common Issues

#### 1. ES Module Errors
```bash
# Symptom: "require is not defined in ES module scope"
# Solution: Update Node.js to v18+ and ensure package.json has "type": "module"
```

#### 2. TypeScript Compilation Errors
```bash
# Symptom: Build fails with TypeScript errors
# Solution: Run npm run build:clean && npm run build
```

#### 3. Permission Denied
```bash
# Symptom: Cannot access files or directories
# Solution: Check file permissions and user ownership
sudo chown -R tony:tony /opt/tony
```

#### 4. Service Won't Start
```bash
# Check service status
sudo systemctl status tony-framework

# Check logs
sudo journalctl -u tony-framework -f

# Verify configuration
node -c dist/index.js
```

## 📞 Support

### Getting Help
- **Documentation**: https://tony-framework.dev/docs
- **GitHub Issues**: https://github.com/jetrich/tony-ng/issues
- **Community Discord**: https://discord.gg/tony-framework
- **Email Support**: support@tony-framework.dev

### Enterprise Support
- **Professional Services**: enterprise@tony-framework.dev
- **Priority Support**: Available with enterprise license
- **Custom Training**: On-site training available
- **Consulting Services**: Architecture and optimization consulting

---

**Tony Framework v2.6.0** - Production-ready AI orchestration platform.

*Deployed with confidence. Built for scale.*
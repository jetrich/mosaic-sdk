# Gitea Administration Tasks

## 🔐 1. Access Token Setup

### Create Personal Access Token
1. Log in as admin
2. Go to: **Settings** → **Applications** 
3. Under "Manage Access Tokens", enter:
   - Token Name: `CLI Access` or `Migration Token`
   - Select scopes:
     - ✅ repo (Full repository access)
     - ✅ admin:org (Organization management)
     - ✅ user (User info)
4. Click "Generate Token"
5. **SAVE THE TOKEN** - it won't be shown again!

### Configure Git CLI Access
```bash
# Option 1: Using credential helper
git config --global credential.helper store
git config --global url."http://admin:<TOKEN>@localhost:3000/".insteadOf "http://localhost:3000/"

# Option 2: Using .netrc file
echo "machine localhost login admin password <TOKEN>" >> ~/.netrc
chmod 600 ~/.netrc
```

## 👥 2. User Management

### Create Developer Accounts
For each team member:
1. Go to: **Site Administration** → **User Accounts** → **Create User Account**
2. Fill in:
   - Username: developer username
   - Email: developer email
   - Password: temporary password
   - ✅ Require password change on first login
3. Add to organizations as needed

### Organization Permissions
For each organization (`mosaic`, `dyor-foundation`):
1. Go to organization page
2. **Teams** → **Owners** → **Add Team Member**
3. Add appropriate developers

## 🔧 3. System Configuration

### SSH Configuration
1. Go to: **Site Administration** → **Configuration**
2. Verify SSH settings:
   - SSH Port: 2222 (as configured)
   - SSH Domain: your-server-domain

### Email Configuration (Optional)
If you want email notifications:
1. Edit `/opt/mosaic/gitea/data/gitea/conf/app.ini`
2. Add under `[mailer]`:
   ```ini
   [mailer]
   ENABLED = true
   SMTP_ADDR = smtp.gmail.com
   SMTP_PORT = 587
   FROM = gitea@yourdomain.com
   USER = your-email@gmail.com
   PASSWD = your-app-password
   ```
3. Restart Gitea container

## 🚀 4. Repository Settings

### Default Branch Protection
For each repository:
1. Go to: **Settings** → **Branches**
2. Add Rule for `main`:
   - ✅ Protect branch
   - ✅ Require pull request reviews
   - ✅ Dismiss stale reviews
   - ✅ Require status checks

### Repository Templates
Create template repositories:
1. Create new repo: `mosaic/templates-nodejs`
2. Add standard files:
   - `.gitignore`
   - `README.md`
   - `.eslintrc`
   - `package.json`
3. In Settings → Mark as Template

## 📊 5. Monitoring & Backup

### Health Monitoring
Check Gitea health:
```bash
curl http://localhost:3000/api/healthz
```

### Backup Strategy
Daily backups are handled by the backup container, but also:
1. **Database**: Automated via backup container
2. **Repositories**: `/opt/mosaic/gitea/data/git/`
3. **Configuration**: `/opt/mosaic/gitea/data/gitea/conf/`
4. **LFS Data**: `/opt/mosaic/gitea/data/git/lfs/`

### Manual Backup Command
```bash
# Full Gitea backup
docker exec -u git mosaicstack-gitea gitea dump -c /data/gitea/conf/app.ini -w /data/gitea --file /data/gitea-dump.zip
```

## 🔗 6. Integration Points

### Woodpecker CI Integration
1. In Gitea: **Settings** → **Applications** → **OAuth2 Applications**
2. Create new application:
   - Name: `Woodpecker CI`
   - Redirect URI: `http://localhost:8000/authorize`
3. Save Client ID and Secret for Woodpecker config

### API Access Examples
```bash
# List all organizations
curl -H "Authorization: token YOUR_TOKEN" http://localhost:3000/api/v1/orgs

# List repositories in organization
curl -H "Authorization: token YOUR_TOKEN" http://localhost:3000/api/v1/orgs/mosaic/repos

# Create repository via API
curl -X POST -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"new-repo","description":"Test repo","private":false}' \
  http://localhost:3000/api/v1/orgs/mosaic/repos
```

## 🛡️ 7. Security Hardening

### Two-Factor Authentication
1. Enable for admin account: **Settings** → **Security** → **Two-Factor Authentication**
2. Require for organization members

### API Rate Limiting
Edit `/opt/mosaic/gitea/data/gitea/conf/app.ini`:
```ini
[security]
LOGIN_RATE_LIMIT_DURATION = 10m
LOGIN_RATE_LIMIT_COUNT = 5
```

### Audit Logging
Monitor security events:
```bash
docker logs mosaicstack-gitea | grep -i "security\|auth\|failed"
```
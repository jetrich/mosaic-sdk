# Verdaccio Local NPM Registry Configuration

## Overview

The MosAIc SDK uses Verdaccio as a local NPM registry for testing package publishing before releasing to the public NPM registry. This ensures packages work correctly and allows for integration testing in a controlled environment.

## Configuration Details

### Location

- **Config File**: `conf/development/verdaccio/config.yaml`
- **Storage**: `./storage` (relative to Verdaccio working directory)
- **Auth File**: `conf/development/verdaccio/htpasswd`
- **PID File**: `.verdaccio.pid`
- **Port**: 4873
- **URL**: http://localhost:4873/

### Authentication

Verdaccio uses htpasswd file authentication with the following settings:

- **Method**: Apache htpasswd (APR1 hash format)
- **Max Users**: 1000
- **Default User**: `claude`
- **Default Password**: `REnv@^VRs7B9@^q9ecf*sKR!`
- **Email**: `claude@mosaicstack.dev`

**Note**: The password contains special characters and should be quoted when used in scripts.

### Package Access Configuration

```yaml
packages:
  "@mosaicstack/*":
    access: $all # Anyone can read
    publish: $authenticated # Must be logged in to publish
    unpublish: $authenticated
    proxy: npmjs # Proxy to public npm if not found locally

  "@dyorfoundation/*":
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
```

### Starting Verdaccio

```bash
# Start Verdaccio with custom config
verdaccio --config conf/development/verdaccio/config.yaml &

# The process ID is saved to .verdaccio.pid
```

### Stopping Verdaccio

```bash
# Read PID and stop the process
kill $(cat .verdaccio.pid)
```

### NPM Configuration

To use the local registry, configure `.npmrc`:

```ini
@mosaicstack:registry=http://localhost:4873/
registry=http://localhost:4873/
```

### Authentication Process

1. **Login to Verdaccio**:

   ```bash
   npm login --registry http://localhost:4873
   # Username: claude
   # Password: REnv@^VRs7B9@^q9ecf*sKR!
   # Email: claude@mosaicstack.dev
   ```

   Or use npm-cli-login for non-interactive login:

   ```bash
   npm-cli-login -u claude -p 'REnv@^VRs7B9@^q9ecf*sKR!' -e claude@mosaicstack.dev -r http://localhost:4873
   ```

2. **Verify Authentication**:

   ```bash
   npm whoami --registry http://localhost:4873
   ```

3. **Logout** (if needed):
   ```bash
   npm logout --registry http://localhost:4873
   ```

### Publishing Packages

```bash
# Single package
cd packages/config
npm publish --registry http://localhost:4873

# All packages using the publish script
npm run publish:packages
```

### Resetting Password

If you need to reset the password:

1. **Option 1: Remove htpasswd and create new user**:

   ```bash
   # Stop Verdaccio
   kill $(cat .verdaccio.pid)

   # Remove htpasswd file
   rm conf/development/verdaccio/htpasswd

   # Restart Verdaccio
   verdaccio --config conf/development/verdaccio/config.yaml &

   # Create new user
   npm-cli-login -u claude -p 'REnv@^VRs7B9@^q9ecf*sKR!' -e claude@mosaicstack.dev -r http://localhost:4873
   ```

2. **Option 2: Generate new password hash**:

   ```bash
   # Online generator: https://www.web2generators.com/apache-tools/htpasswd-generator
   # Enter your username and new password to get the hash

   # Update htpasswd file with the generated hash
   echo 'username:$apr1$...' > conf/development/verdaccio/htpasswd
   ```

3. **Update htpasswd file**:

   ```bash
   echo 'testuser:$apr1$rBiWx4oZ$dJNHRwW3VLSa0aU3Xkzaa.' > conf/development/verdaccio/htpasswd
   ```

4. **Restart Verdaccio**:
   ```bash
   kill $(cat .verdaccio.pid)
   verdaccio --config conf/development/verdaccio/config.yaml &
   ```

### Troubleshooting

**Authentication Errors**:

- Check if Verdaccio is running: `lsof -i :4873`
- Verify htpasswd file exists and has correct permissions
- Try logging out and logging in again

**Publishing Errors**:

- Ensure you're logged in: `npm whoami --registry http://localhost:4873`
- Check package.json has correct name and version
- Verify no duplicate versions exist in the registry

**Registry Not Responding**:

- Check if process is running: `ps -p $(cat .verdaccio.pid)`
- Check logs: `tail -f verdaccio.log`
- Restart if needed

### Security Notes

- The local registry is only accessible from localhost
- Authentication tokens expire after 60 days
- All packages are stored locally in the storage directory
- The registry proxies to npmjs.org for packages not found locally

### Integration with CI/CD

For automated testing, you can set the auth token directly:

```bash
# Get token after login (stored in ~/.npmrc)
npm config get //localhost:4873/:_authToken

# Set in CI environment
npm config set //localhost:4873/:_authToken "your-token-here"
```

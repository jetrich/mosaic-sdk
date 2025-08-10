#!/bin/bash

# Script to login to local Verdaccio registry
# This uses expect-like functionality with bash

REGISTRY="http://localhost:4873"
USERNAME="testuser"
PASSWORD="testpass123"
EMAIL="test@example.com"

echo "Logging into Verdaccio at $REGISTRY..."

# Create a temporary expect script
cat > /tmp/npm-login.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 10
set registry [lindex $argv 0]
set username [lindex $argv 1]
set password [lindex $argv 2]
set email [lindex $argv 3]

spawn npm login --registry $registry

expect "Username:"
send "$username\r"

expect "Password:"
send "$password\r"

expect "Email:"
send "$email\r"

expect eof
EOF

# Check if expect is available
if command -v expect &> /dev/null; then
    chmod +x /tmp/npm-login.exp
    /tmp/npm-login.exp "$REGISTRY" "$USERNAME" "$PASSWORD" "$EMAIL"
    rm -f /tmp/npm-login.exp
else
    echo "expect not found, trying alternative method..."
    
    # Alternative: Use npm-cli-login if available
    if command -v npm-cli-login &> /dev/null; then
        npm-cli-login -u "$USERNAME" -p "$PASSWORD" -e "$EMAIL" -r "$REGISTRY"
    else
        echo "Manual login required. Please run:"
        echo "npm login --registry $REGISTRY"
        echo "Username: $USERNAME"
        echo "Password: $PASSWORD"
        echo "Email: $EMAIL"
        exit 1
    fi
fi

# Verify login
if npm whoami --registry "$REGISTRY" &> /dev/null; then
    echo "✅ Successfully logged in as: $(npm whoami --registry $REGISTRY)"
else
    echo "❌ Login failed"
    exit 1
fi
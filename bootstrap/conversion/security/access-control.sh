#!/bin/bash

# Tony Framework - Role-Based Access Control (RBAC)
# Enterprise-grade access control with audit logging

set -euo pipefail

SECURITY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SECURITY_ROOT/../scripts/shared/logging-utils.sh"

# Load security configuration
SECURITY_CONFIG="$SECURITY_ROOT/config/security-config.json"
RBAC_DB="$SECURITY_ROOT/config/rbac.json"
ACCESS_LOG="$SECURITY_ROOT/logs/access/access.log"

# Initialize RBAC system
init_rbac() {
    log_info "Initializing RBAC system..."
    
    # Create RBAC database if it doesn't exist
    if [ ! -f "$RBAC_DB" ]; then
        cat > "$RBAC_DB" << 'RBAC_EOF'
{
  "users": {},
  "roles": {
    "admin": {
      "permissions": ["*"],
      "resources": ["*"],
      "conditions": ["mfa_required"]
    },
    "developer": {
      "permissions": ["read", "write", "execute"],
      "resources": ["code/*", "docs/*", "tests/*", "scripts/*"],
      "conditions": ["authenticated"]
    },
    "agent": {
      "permissions": ["read", "execute"],
      "resources": ["tasks/*", "logs/read/*"],
      "conditions": ["authenticated", "rate_limited"]
    },
    "readonly": {
      "permissions": ["read"],
      "resources": ["docs/*", "reports/*"],
      "conditions": ["authenticated"]
    }
  },
  "sessions": {}
}
RBAC_EOF
    fi
    
    log_success "RBAC system initialized"
}

# Check access permissions
check_access() {
    local user="$1"
    local resource="$2"
    local permission="$3"
    local session_id="${4:-}"
    
    # Log access attempt
    log_access_attempt "$user" "$resource" "$permission" "$session_id"
    
    # Validate session if provided
    if [ -n "$session_id" ]; then
        if ! validate_session "$session_id"; then
            log_security_event "INVALID_SESSION" "$user" "$resource" "$session_id"
            return 1
        fi
    fi
    
    # Get user role
    local user_role
    user_role=$(get_user_role "$user")
    
    if [ -z "$user_role" ]; then
        log_security_event "USER_NOT_FOUND" "$user" "$resource" ""
        return 1
    fi
    
    # Check role permissions
    if check_role_permission "$user_role" "$resource" "$permission"; then
        log_access_granted "$user" "$resource" "$permission"
        return 0
    else
        log_access_denied "$user" "$resource" "$permission"
        return 1
    fi
}

# Validate session
validate_session() {
    local session_id="$1"
    local session_data
    
    # Check if session exists and is valid
    session_data=$(jq -r ".sessions[\"$session_id\"]" "$RBAC_DB" 2>/dev/null || echo "null")
    
    if [ "$session_data" = "null" ]; then
        return 1
    fi
    
    # Check session expiry
    local expiry
    expiry=$(echo "$session_data" | jq -r '.expiry')
    local current_time
    current_time=$(date +%s)
    
    if [ "$current_time" -gt "$expiry" ]; then
        # Remove expired session
        jq "del(.sessions[\"$session_id\"])" "$RBAC_DB" > "$RBAC_DB.tmp" && mv "$RBAC_DB.tmp" "$RBAC_DB"
        return 1
    fi
    
    return 0
}

# Get user role
get_user_role() {
    local user="$1"
    jq -r ".users[\"$user\"].role // empty" "$RBAC_DB" 2>/dev/null
}

# Check role permission
check_role_permission() {
    local role="$1"
    local resource="$2"
    local permission="$3"
    
    # Get role data
    local role_data
    role_data=$(jq -r ".roles[\"$role\"]" "$RBAC_DB" 2>/dev/null)
    
    if [ "$role_data" = "null" ]; then
        return 1
    fi
    
    # Check if permission is allowed
    local has_permission
    has_permission=$(echo "$role_data" | jq -r ".permissions[] | select(. == \"$permission\" or . == \"*\")" | head -1)
    
    if [ -z "$has_permission" ]; then
        return 1
    fi
    
    # Check if resource is allowed
    local resource_allowed=false
    while IFS= read -r allowed_resource; do
        if [[ "$resource" == $allowed_resource ]]; then
            resource_allowed=true
            break
        fi
    done < <(echo "$role_data" | jq -r '.resources[]')
    
    if [ "$resource_allowed" = false ]; then
        return 1
    fi
    
    return 0
}

# Log access attempt
log_access_attempt() {
    local user="$1"
    local resource="$2"
    local permission="$3"
    local session_id="$4"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    echo "[$timestamp] ACCESS_ATTEMPT user=$user resource=$resource permission=$permission session=$session_id" >> "$ACCESS_LOG"
}

# Log access granted
log_access_granted() {
    local user="$1"
    local resource="$2"
    local permission="$3"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    echo "[$timestamp] ACCESS_GRANTED user=$user resource=$resource permission=$permission" >> "$ACCESS_LOG"
}

# Log access denied
log_access_denied() {
    local user="$1"
    local resource="$2"
    local permission="$3"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    echo "[$timestamp] ACCESS_DENIED user=$user resource=$resource permission=$permission" >> "$ACCESS_LOG"
}

# Log security event
log_security_event() {
    local event_type="$1"
    local user="$2"
    local resource="$3"
    local details="$4"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    echo "[$timestamp] SECURITY_EVENT type=$event_type user=$user resource=$resource details=$details" >> "$ACCESS_LOG"
}

# Initialize RBAC on script load
init_rbac

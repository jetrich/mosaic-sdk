#!/bin/bash

# Tony Framework - Security Audit Script
# Comprehensive security analysis and vulnerability assessment

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"

# Configuration
MODE="full-audit"
THREAT_MODEL=false
VERBOSE=false
OUTPUT_DIR="docs/audit/security"
REPORT_DATE=$(date '+%Y-%m-%d')

# Display usage information
show_usage() {
    show_banner "Tony Security Audit Script" "Comprehensive security analysis and threat modeling"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --full-audit          Complete security assessment (default)"
    echo "  --quick-scan          Fast security check"
    echo "  --vulnerability-scan  Vulnerability assessment only"
    echo "  --code-security       Code security review only"
    echo "  --dependencies        Dependency security audit only"
    echo "  --secrets-scan        Secrets detection only"
    echo "  --threat-model        Generate threat model"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --full-audit --threat-model    # Complete security audit"
    echo "  $0 --quick-scan                   # Fast security check"
    echo "  $0 --secrets-scan --verbose       # Find exposed secrets"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full-audit)
                MODE="full-audit"
                ;;
            --quick-scan)
                MODE="quick-scan"
                ;;
            --vulnerability-scan)
                MODE="vulnerability-scan"
                ;;
            --code-security)
                MODE="code-security"
                ;;
            --dependencies)
                MODE="dependencies"
                ;;
            --secrets-scan)
                MODE="secrets-scan"
                ;;
            --threat-model)
                THREAT_MODEL=true
                ;;
            --verbose)
                VERBOSE=true
                enable_verbose
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
}

# Initialize security analysis
init_security_analysis() {
    log_info "Initializing security analysis for $(basename $(pwd))"
    
    # Create output directories
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/reports"
    mkdir -p "$OUTPUT_DIR/vulnerabilities"
    mkdir -p "$OUTPUT_DIR/threat-models"
    mkdir -p "$OUTPUT_DIR/secrets"
    
    # Initialize tracking
    SECURITY_TEMP_DIR="/tmp/tony-security-$$"
    mkdir -p "$SECURITY_TEMP_DIR"
    
    # Initialize counters
    CRITICAL_ISSUES=0
    HIGH_ISSUES=0
    MEDIUM_ISSUES=0
    LOW_ISSUES=0
    TOTAL_SCORE=100  # Start with perfect score, deduct for issues
}

# Detect project security context
detect_security_context() {
    local project_type="unknown"
    local web_app=false
    local api_endpoints=false
    local database_usage=false
    local authentication=false
    
    # Detect project type and security context
    if [ -f "package.json" ]; then
        project_type="node"
        
        # Check for web frameworks
        if grep -q -E "(express|koa|fastify|nestjs)" package.json 2>/dev/null; then
            web_app=true
            api_endpoints=true
        fi
        
        # Check for database libraries
        if grep -q -E "(mongoose|sequelize|prisma|typeorm)" package.json 2>/dev/null; then
            database_usage=true
        fi
        
        # Check for authentication libraries
        if grep -q -E "(passport|jwt|oauth|auth)" package.json 2>/dev/null; then
            authentication=true
        fi
        
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        project_type="python"
        
        # Check for web frameworks
        if grep -q -E "(django|flask|fastapi|tornado)" requirements.txt pyproject.toml 2>/dev/null; then
            web_app=true
            api_endpoints=true
        fi
        
        # Check for database libraries
        if grep -q -E "(sqlalchemy|django.db|pymongo)" requirements.txt pyproject.toml 2>/dev/null; then
            database_usage=true
        fi
        
    elif [ -f "go.mod" ]; then
        project_type="go"
        
        # Check for web frameworks
        if grep -q -E "(gin|echo|fiber|gorilla)" go.mod 2>/dev/null; then
            web_app=true
            api_endpoints=true
        fi
        
    elif [ -f "Cargo.toml" ]; then
        project_type="rust"
        
        # Check for web frameworks
        if grep -q -E "(actix|warp|rocket|axum)" Cargo.toml 2>/dev/null; then
            web_app=true
            api_endpoints=true
        fi
    fi
    
    # Store security context
    echo "project_type:$project_type" > "$SECURITY_TEMP_DIR/context"
    echo "web_app:$web_app" >> "$SECURITY_TEMP_DIR/context"
    echo "api_endpoints:$api_endpoints" >> "$SECURITY_TEMP_DIR/context"
    echo "database_usage:$database_usage" >> "$SECURITY_TEMP_DIR/context"
    echo "authentication:$authentication" >> "$SECURITY_TEMP_DIR/context"
    
    log_info "Security context: $project_type"
    [ "$web_app" = true ] && log_debug "Web application detected"
    [ "$api_endpoints" = true ] && log_debug "API endpoints detected"
    [ "$database_usage" = true ] && log_debug "Database usage detected"
    [ "$authentication" = true ] && log_debug "Authentication system detected"
}

# Scan for vulnerabilities in dependencies
scan_dependency_vulnerabilities() {
    print_subsection "Dependency Vulnerability Scan"
    
    local project_type
    project_type=$(grep "project_type:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    
    local vulnerabilities=0
    
    case "$project_type" in
        "node")
            if command -v npm >/dev/null 2>&1; then
                log_info "Running npm audit..."
                if npm audit --json > "$SECURITY_TEMP_DIR/npm_audit.json" 2>/dev/null; then
                    # Parse npm audit results
                    vulnerabilities=$(grep -o '"total":[0-9]*' "$SECURITY_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' | head -1 || echo "0")
                    
                    # Count by severity
                    local critical high moderate low
                    critical=$(grep -o '"critical":[0-9]*' "$SECURITY_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' || echo "0")
                    high=$(grep -o '"high":[0-9]*' "$SECURITY_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' || echo "0")
                    moderate=$(grep -o '"moderate":[0-9]*' "$SECURITY_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' || echo "0")
                    low=$(grep -o '"low":[0-9]*' "$SECURITY_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' || echo "0")
                    
                    CRITICAL_ISSUES=$((CRITICAL_ISSUES + critical))
                    HIGH_ISSUES=$((HIGH_ISSUES + high))
                    MEDIUM_ISSUES=$((MEDIUM_ISSUES + moderate))
                    LOW_ISSUES=$((LOW_ISSUES + low))
                    
                    log_info "NPM vulnerabilities: Critical=$critical, High=$high, Medium=$moderate, Low=$low"
                fi
            fi
            ;;
        "python")
            if command -v safety >/dev/null 2>&1; then
                log_info "Running safety check..."
                if safety check --json > "$SECURITY_TEMP_DIR/safety_check.json" 2>/dev/null; then
                    vulnerabilities=$(grep -c '"vulnerability_id"' "$SECURITY_TEMP_DIR/safety_check.json" || echo "0")
                    HIGH_ISSUES=$((HIGH_ISSUES + vulnerabilities))
                    log_info "Python vulnerabilities found: $vulnerabilities"
                fi
            else
                log_warning "safety not installed - install with: pip install safety"
            fi
            ;;
        "go")
            if command -v govulncheck >/dev/null 2>&1; then
                log_info "Running govulncheck..."
                if govulncheck ./... > "$SECURITY_TEMP_DIR/go_vulns.txt" 2>&1; then
                    vulnerabilities=$(grep -c "Vulnerability" "$SECURITY_TEMP_DIR/go_vulns.txt" || echo "0")
                    HIGH_ISSUES=$((HIGH_ISSUES + vulnerabilities))
                    log_info "Go vulnerabilities found: $vulnerabilities"
                fi
            else
                log_warning "govulncheck not installed - install with: go install golang.org/x/vuln/cmd/govulncheck@latest"
            fi
            ;;
    esac
    
    echo "dependency_vulnerabilities:$vulnerabilities" > "$SECURITY_TEMP_DIR/metrics"
}

# Scan for secrets and sensitive data
scan_secrets() {
    print_subsection "Secrets Detection Scan"
    
    local secrets_found=0
    local potential_secrets=()
    
    # Common secret patterns
    local patterns=(
        'api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'
        'secret[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'
        'password["\s]*[:=]["\s]*[a-zA-Z0-9_-]{8,}'
        'token["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'
        'aws[_-]?access[_-]?key["\s]*[:=]["\s]*[A-Z0-9]{20}'
        'AKIA[0-9A-Z]{16}'
        'sk_live_[0-9a-zA-Z]{24}'
        'pk_live_[0-9a-zA-Z]{24}'
        'AIza[0-9A-Za-z_-]{35}'
        'ya29\.[0-9A-Za-z_-]+'
        'sk-[a-zA-Z0-9]{48}'
        'xox[baprs]-[0-9a-zA-Z-]+'
    )
    
    # Files to exclude from secret scanning
    local exclude_patterns=(
        "*.git/*"
        "node_modules/*"
        "*.log"
        "*.lock"
        "*.min.js"
        "*.min.css"
    )
    
    # Build find command with exclusions
    local find_cmd="find . -type f"
    for pattern in "${exclude_patterns[@]}"; do
        find_cmd="$find_cmd ! -path '$pattern'"
    done
    
    # Scan for secrets
    log_info "Scanning for exposed secrets and sensitive data..."
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            for pattern in "${patterns[@]}"; do
                if grep -q -E "$pattern" "$file" 2>/dev/null; then
                    potential_secrets+=("$file:$(grep -n -E "$pattern" "$file" | head -1)")
                    ((secrets_found++))
                fi
            done
        fi
    done < <(eval "$find_cmd")
    
    # Check for common config files with potential secrets
    local config_files=(
        ".env"
        ".env.local"
        ".env.production"
        "config.json"
        "secrets.json"
        ".aws/credentials"
        ".ssh/id_rsa"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            log_warning "Sensitive config file found: $config_file"
            ((secrets_found++))
            potential_secrets+=("$config_file:Sensitive configuration file")
        fi
    done
    
    # Save results
    printf '%s\n' "${potential_secrets[@]}" > "$SECURITY_TEMP_DIR/secrets_found"
    
    if [ "$secrets_found" -gt 0 ]; then
        HIGH_ISSUES=$((HIGH_ISSUES + secrets_found))
        log_warning "Potential secrets found: $secrets_found"
    else
        log_success "No obvious secrets detected"
    fi
    
    echo "secrets_found:$secrets_found" >> "$SECURITY_TEMP_DIR/metrics"
}

# Analyze code security patterns
analyze_code_security() {
    print_subsection "Code Security Analysis"
    
    local security_issues=0
    local project_type
    project_type=$(grep "project_type:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    
    # Common security anti-patterns
    log_info "Scanning for security anti-patterns..."
    
    case "$project_type" in
        "node")
            # JavaScript/TypeScript security patterns
            local js_patterns=(
                'eval\s*\('
                'Function\s*\('
                'innerHTML\s*='
                'document\.write\s*\('
                'dangerouslySetInnerHTML'
                'exec\s*\('
                'child_process'
                'process\.env\.[A-Z_]+\s*\+'
            )
            
            for pattern in "${js_patterns[@]}"; do
                local matches
                matches=$(find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | xargs grep -l -E "$pattern" 2>/dev/null | wc -l)
                if [ "$matches" -gt 0 ]; then
                    security_issues=$((security_issues + matches))
                    log_warning "Potential security issue: $pattern found in $matches files"
                fi
            done
            ;;
        "python")
            # Python security patterns
            local py_patterns=(
                'eval\s*\('
                'exec\s*\('
                'os\.system\s*\('
                'subprocess\.call\s*\('
                'pickle\.loads\s*\('
                'yaml\.load\s*\('
                'shell=True'
            )
            
            for pattern in "${py_patterns[@]}"; do
                local matches
                matches=$(find . -name "*.py" | xargs grep -l -E "$pattern" 2>/dev/null | wc -l)
                if [ "$matches" -gt 0 ]; then
                    security_issues=$((security_issues + matches))
                    log_warning "Potential security issue: $pattern found in $matches files"
                fi
            done
            ;;
    esac
    
    # Check for SQL injection patterns
    local sql_patterns=(
        'SELECT.*\+.*\+'
        'WHERE.*\+.*\+'
        'INSERT.*\+.*\+'
        'UPDATE.*\+.*\+'
        'DELETE.*\+.*\+'
    )
    
    for pattern in "${sql_patterns[@]}"; do
        local matches
        matches=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" \) | xargs grep -l -E "$pattern" 2>/dev/null | wc -l)
        if [ "$matches" -gt 0 ]; then
            security_issues=$((security_issues + matches))
            log_warning "Potential SQL injection: $pattern found in $matches files"
        fi
    done
    
    # Categorize issues by severity
    if [ "$security_issues" -gt 10 ]; then
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    elif [ "$security_issues" -gt 5 ]; then
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    elif [ "$security_issues" -gt 0 ]; then
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
    fi
    
    echo "code_security_issues:$security_issues" >> "$SECURITY_TEMP_DIR/metrics"
    log_info "Code security issues found: $security_issues"
}

# Analyze configuration security
analyze_config_security() {
    print_subsection "Configuration Security Analysis"
    
    local config_issues=0
    
    # Check for insecure configurations
    log_info "Analyzing security configurations..."
    
    # Check for HTTPS enforcement
    if grep -r -i "http://" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v localhost | grep -q .; then
        config_issues=$((config_issues + 1))
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
        log_warning "HTTP URLs found - consider using HTTPS"
    fi
    
    # Check for debug/development settings in production
    local debug_patterns=(
        'debug.*=.*true'
        'DEBUG.*=.*True'
        'NODE_ENV.*=.*development'
        'RAILS_ENV.*=.*development'
    )
    
    for pattern in "${debug_patterns[@]}"; do
        if grep -r -E "$pattern" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -q .; then
            config_issues=$((config_issues + 1))
            MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
            log_warning "Debug settings found: $pattern"
        fi
    done
    
    # Check for weak session configurations
    if grep -r -i "session.*secure.*false\|session.*httponly.*false" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -q .; then
        config_issues=$((config_issues + 1))
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
        log_warning "Insecure session configuration found"
    fi
    
    # Check for CORS misconfigurations
    if grep -r -E "Access-Control-Allow-Origin.*\*" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -q .; then
        config_issues=$((config_issues + 1))
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
        log_warning "Permissive CORS configuration found"
    fi
    
    echo "config_security_issues:$config_issues" >> "$SECURITY_TEMP_DIR/metrics"
    log_info "Configuration security issues: $config_issues"
}

# Generate threat model
generate_threat_model() {
    if [ "$THREAT_MODEL" != true ]; then
        return 0
    fi
    
    print_subsection "Generating Threat Model"
    
    local threat_model_file="$OUTPUT_DIR/threat-models/threat-model-$REPORT_DATE.md"
    local project_name
    project_name=$(basename "$(pwd)")
    
    # Read security context
    local web_app api_endpoints database_usage authentication
    web_app=$(grep "web_app:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    api_endpoints=$(grep "api_endpoints:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    database_usage=$(grep "database_usage:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    authentication=$(grep "authentication:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)
    
    cat > "$threat_model_file" << EOF
# Threat Model: $project_name

**Generated**: $REPORT_DATE  
**Application Type**: $(grep "project_type:" "$SECURITY_TEMP_DIR/context" | cut -d: -f2)  
**Assessment**: Automated threat modeling analysis  

## Application Profile

### Components
- **Web Application**: $web_app
- **API Endpoints**: $api_endpoints  
- **Database**: $database_usage
- **Authentication**: $authentication

### Attack Surface

#### Entry Points
EOF

    if [ "$web_app" = true ]; then
        echo "- **Web Interface**: User-facing web application" >> "$threat_model_file"
        echo "  - *Threats*: XSS, CSRF, Session hijacking" >> "$threat_model_file"
    fi
    
    if [ "$api_endpoints" = true ]; then
        echo "- **API Endpoints**: REST/GraphQL APIs" >> "$threat_model_file"
        echo "  - *Threats*: Injection attacks, unauthorized access, data exposure" >> "$threat_model_file"
    fi
    
    if [ "$database_usage" = true ]; then
        echo "- **Database Layer**: Data storage and retrieval" >> "$threat_model_file"
        echo "  - *Threats*: SQL injection, data breaches, privilege escalation" >> "$threat_model_file"
    fi
    
    cat >> "$threat_model_file" << EOF

### Trust Boundaries
- **External Users** → Web Application
- **Web Application** → API Layer
- **API Layer** → Database
- **Application** → External Services

## STRIDE Analysis

### Spoofing
EOF

    if [ "$authentication" = true ]; then
        echo "- **Risk**: MEDIUM - Authentication system present but may have weaknesses" >> "$threat_model_file"
        echo "- **Mitigations**: Strong password policies, MFA, session management" >> "$threat_model_file"
    else
        echo "- **Risk**: HIGH - No authentication system detected" >> "$threat_model_file"
        echo "- **Mitigations**: Implement authentication and authorization" >> "$threat_model_file"
    fi
    
    cat >> "$threat_model_file" << EOF

### Tampering
- **Risk**: MEDIUM - Data integrity concerns
- **Mitigations**: Input validation, checksums, audit logging

### Repudiation
- **Risk**: MEDIUM - Limited audit trail
- **Mitigations**: Comprehensive logging, digital signatures

### Information Disclosure
EOF

    local secrets_count
    secrets_count=$(grep "secrets_found:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    if [ "$secrets_count" -gt 0 ]; then
        echo "- **Risk**: HIGH - $secrets_count potential secrets found" >> "$threat_model_file"
    else
        echo "- **Risk**: MEDIUM - No obvious secrets detected" >> "$threat_model_file"
    fi
    
    cat >> "$threat_model_file" << EOF
- **Mitigations**: Encryption, access controls, secure storage

### Denial of Service
- **Risk**: MEDIUM - Resource exhaustion possible
- **Mitigations**: Rate limiting, resource monitoring, load balancing

### Elevation of Privilege
EOF

    local code_issues
    code_issues=$(grep "code_security_issues:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    if [ "$code_issues" -gt 0 ]; then
        echo "- **Risk**: HIGH - $code_issues code security issues found" >> "$threat_model_file"
    else
        echo "- **Risk**: LOW - No obvious privilege escalation vectors" >> "$threat_model_file"
    fi
    
    cat >> "$threat_model_file" << EOF
- **Mitigations**: Principle of least privilege, secure coding practices

## Risk Assessment

### High Priority Threats
1. **Data Breach** - Unauthorized access to sensitive information
2. **Code Injection** - Malicious code execution
3. **Authentication Bypass** - Unauthorized system access

### Medium Priority Threats
1. **Session Hijacking** - Unauthorized session takeover
2. **CSRF Attacks** - Cross-site request forgery
3. **Configuration Exposure** - Sensitive config data disclosure

### Low Priority Threats
1. **Information Leakage** - Minor data exposure
2. **Availability Issues** - Service disruption
3. **Audit Trail Gaps** - Insufficient logging

## Recommendations

### Immediate Actions
EOF

    if [ "$CRITICAL_ISSUES" -gt 0 ] || [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "- Address $CRITICAL_ISSUES critical and $HIGH_ISSUES high severity vulnerabilities" >> "$threat_model_file"
    fi
    
    if [ "$secrets_count" -gt 0 ]; then
        echo "- Remove or secure $secrets_count exposed secrets" >> "$threat_model_file"
    fi
    
    cat >> "$threat_model_file" << EOF
- Implement security headers (CSP, HSTS, X-Frame-Options)
- Enable HTTPS everywhere
- Implement proper input validation

### Long-term Security Strategy
- Regular security assessments
- Penetration testing
- Security awareness training
- Incident response planning

---

**Threat Model Version**: 1.0  
**Next Review**: $(date -d "+3 months" +"%Y-%m-%d")  
**Tool**: Tony Framework Security Analysis v2.0
EOF

    log_success "Threat model generated: $threat_model_file"
}

# Generate security report
generate_security_report() {
    print_subsection "Generating Security Report"
    
    local report_file="$OUTPUT_DIR/security-audit-$REPORT_DATE.md"
    local project_name
    project_name=$(basename "$(pwd)")
    
    # Calculate risk level
    local total_issues=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))
    local risk_level
    
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        risk_level="CRITICAL RISK"
    elif [ "$HIGH_ISSUES" -gt 5 ]; then
        risk_level="HIGH RISK"
    elif [ "$HIGH_ISSUES" -gt 0 ] || [ "$MEDIUM_ISSUES" -gt 10 ]; then
        risk_level="MEDIUM RISK"
    elif [ "$MEDIUM_ISSUES" -gt 0 ] || [ "$LOW_ISSUES" -gt 10 ]; then
        risk_level="LOW RISK"
    else
        risk_level="MINIMAL RISK"
    fi
    
    # Calculate security score
    local security_score=$((TOTAL_SCORE - (CRITICAL_ISSUES * 25) - (HIGH_ISSUES * 10) - (MEDIUM_ISSUES * 5) - (LOW_ISSUES * 1)))
    if [ "$security_score" -lt 0 ]; then
        security_score=0
    fi
    
    cat > "$report_file" << EOF
# Security Audit Report

**Project**: $project_name  
**Date**: $REPORT_DATE  
**Risk Level**: $risk_level  
**Security Score**: $security_score/100  

## Executive Summary

🛡️  **Security Assessment Complete**

This automated security audit analyzed the codebase for common vulnerabilities, security anti-patterns, and configuration issues. The assessment covers dependency vulnerabilities, secrets exposure, code security patterns, and configuration security.

**Overall Risk Assessment**: $risk_level

## Findings Summary

🚨 **Issue Breakdown**:
- **Critical**: $CRITICAL_ISSUES issues
- **High**: $HIGH_ISSUES issues  
- **Medium**: $MEDIUM_ISSUES issues
- **Low**: $LOW_ISSUES issues

**Total Issues**: $total_issues

## Detailed Analysis

### Dependency Vulnerabilities
EOF

    local dep_vulns
    dep_vulns=$(grep "dependency_vulnerabilities:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    echo "- **Known Vulnerabilities**: $dep_vulns" >> "$report_file"
    
    cat >> "$report_file" << EOF
- **Recommendation**: Update vulnerable dependencies immediately
- **Tools**: npm audit, safety, govulncheck

### Secrets and Sensitive Data
EOF

    local secrets
    secrets=$(grep "secrets_found:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    echo "- **Potential Secrets Found**: $secrets" >> "$report_file"
    
    if [ "$secrets" -gt 0 ]; then
        cat >> "$report_file" << EOF
- **Critical Action Required**: Remove secrets from code
- **Locations**: 
EOF
        if [ -f "$SECURITY_TEMP_DIR/secrets_found" ]; then
            head -10 "$SECURITY_TEMP_DIR/secrets_found" | sed 's/^/  - /' >> "$report_file"
        fi
    fi
    
    cat >> "$report_file" << EOF

### Code Security Issues
EOF

    local code_issues
    code_issues=$(grep "code_security_issues:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    echo "- **Security Anti-patterns**: $code_issues" >> "$report_file"
    
    cat >> "$report_file" << EOF
- **Common Issues**: eval() usage, innerHTML assignments, shell execution
- **Recommendation**: Implement secure coding practices

### Configuration Security
EOF

    local config_issues
    config_issues=$(grep "config_security_issues:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    
    cat >> "$report_file" << EOF
- **Configuration Issues**: $config_issues
- **Focus Areas**: HTTPS enforcement, session security, CORS policies
- **Recommendation**: Review and harden security configurations

## Priority Actions

### 🚨 Immediate (Fix within 24 hours)
EOF

    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        echo "- Address $CRITICAL_ISSUES critical security vulnerabilities" >> "$report_file"
    fi
    
    if [ "$secrets" -gt 0 ]; then
        echo "- Remove $secrets exposed secrets from codebase" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### 🔥 High Priority (Fix within 1 week)
EOF

    if [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "- Resolve $HIGH_ISSUES high-severity security issues" >> "$report_file"
    fi
    
    if [ "$dep_vulns" -gt 0 ]; then
        echo "- Update dependencies with known vulnerabilities" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### ⚠️  Medium Priority (Fix within 1 month)
EOF

    if [ "$MEDIUM_ISSUES" -gt 0 ]; then
        echo "- Address $MEDIUM_ISSUES medium-severity issues" >> "$report_file"
    fi
    
    echo "- Implement security headers and HTTPS enforcement" >> "$report_file"
    echo "- Review and update security configurations" >> "$report_file"
    
    cat >> "$report_file" << EOF

## Security Recommendations

### Foundation Security
1. **Dependency Management**
   - Regularly audit dependencies for vulnerabilities
   - Implement automated dependency scanning
   - Keep all packages up to date

2. **Secrets Management**
   - Use environment variables for sensitive data
   - Implement proper secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Never commit secrets to version control

3. **Input Validation**
   - Validate all user inputs
   - Use parameterized queries for database operations
   - Implement proper data sanitization

### Application Security
1. **Authentication & Authorization**
   - Implement strong authentication mechanisms
   - Use multi-factor authentication
   - Follow principle of least privilege

2. **Session Management**
   - Use secure session configurations
   - Implement proper session timeout
   - Protect against session hijacking

3. **Communication Security**
   - Enforce HTTPS everywhere
   - Implement proper certificate validation
   - Use secure communication protocols

### Infrastructure Security
1. **Configuration Hardening**
   - Remove debug/development settings from production
   - Implement security headers
   - Configure proper CORS policies

2. **Monitoring & Logging**
   - Implement comprehensive security logging
   - Set up intrusion detection
   - Monitor for suspicious activities

## Compliance Considerations

### Data Protection
- **GDPR**: Ensure proper data handling and user consent
- **CCPA**: Implement data access and deletion capabilities
- **PCI DSS**: If handling payment data, ensure compliance

### Industry Standards
- **OWASP Top 10**: Address common web application vulnerabilities
- **SANS Top 25**: Focus on most dangerous software errors
- **ISO 27001**: Implement information security management

## Next Steps

1. **Immediate Remediation**: Address critical and high-priority issues
2. **Security Testing**: Implement automated security testing in CI/CD
3. **Penetration Testing**: Conduct regular professional security assessments
4. **Security Training**: Provide security awareness training for development team
5. **Incident Response**: Develop and test incident response procedures

---

**Report Generated**: $(date)  
**Security Analyst**: Tony Framework Security Analysis v2.0  
**Next Assessment**: $(date -d "+1 month" +"%Y-%m-%d")  
**Threat Model**: $([ "$THREAT_MODEL" = true ] && echo "Generated" || echo "Not generated")
EOF

    log_success "Security report generated: $report_file"
}

# Display security summary
display_security_summary() {
    print_section "Security Analysis Complete"
    
    local total_issues=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))
    local security_score=$((TOTAL_SCORE - (CRITICAL_ISSUES * 25) - (HIGH_ISSUES * 10) - (MEDIUM_ISSUES * 5) - (LOW_ISSUES * 1)))
    if [ "$security_score" -lt 0 ]; then
        security_score=0
    fi
    
    # Determine risk level and icon
    local risk_icon risk_level
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        risk_icon="🔴"
        risk_level="CRITICAL RISK"
    elif [ "$HIGH_ISSUES" -gt 5 ]; then
        risk_icon="🔴"
        risk_level="HIGH RISK"
    elif [ "$HIGH_ISSUES" -gt 0 ] || [ "$MEDIUM_ISSUES" -gt 10 ]; then
        risk_icon="🟠"
        risk_level="MEDIUM RISK"
    elif [ "$MEDIUM_ISSUES" -gt 0 ] || [ "$LOW_ISSUES" -gt 10 ]; then
        risk_icon="🟡"
        risk_level="LOW RISK"
    else
        risk_icon="🟢"
        risk_level="MINIMAL RISK"
    fi
    
    echo "🛡️  Tony Security Audit Complete"
    echo ""
    echo "$risk_icon Security Status: $risk_level"
    echo "🎯 Security Score: $security_score/100"
    echo ""
    echo "📊 Issue Breakdown:"
    echo "  🚨 Critical: $CRITICAL_ISSUES issues"
    echo "  🔥 High: $HIGH_ISSUES issues"
    echo "  ⚠️  Medium: $MEDIUM_ISSUES issues"
    echo "  ℹ️  Low: $LOW_ISSUES issues"
    echo ""
    
    # Display key findings
    local secrets dep_vulns
    secrets=$(grep "secrets_found:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    dep_vulns=$(grep "dependency_vulnerabilities:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    
    echo "🔍 Key Findings:"
    echo "  🔐 Secrets Found: $secrets"
    echo "  📦 Vulnerable Dependencies: $dep_vulns"
    echo "  ⚙️  Configuration Issues: $(grep "config_security_issues:" "$SECURITY_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")"
    echo ""
    
    # Priority actions
    if [ "$CRITICAL_ISSUES" -gt 0 ] || [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "🚨 Immediate Actions Required:"
        [ "$CRITICAL_ISSUES" -gt 0 ] && echo "  1. Fix $CRITICAL_ISSUES critical vulnerabilities"
        [ "$secrets" -gt 0 ] && echo "  2. Remove $secrets exposed secrets"
        [ "$dep_vulns" -gt 0 ] && echo "  3. Update $dep_vulns vulnerable dependencies"
        echo ""
    fi
    
    # Report locations
    echo "📁 Reports Generated:"
    echo "  📄 Security Audit: $OUTPUT_DIR/security-audit-$REPORT_DATE.md"
    [ "$THREAT_MODEL" = true ] && echo "  🎯 Threat Model: $OUTPUT_DIR/threat-models/threat-model-$REPORT_DATE.md"
}

# Cleanup function
cleanup_security() {
    if [ -n "${SECURITY_TEMP_DIR:-}" ] && [ -d "$SECURITY_TEMP_DIR" ]; then
        rm -rf "$SECURITY_TEMP_DIR"
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Initialize
    init_security_analysis
    
    # Show banner
    show_banner "Tony Security Analysis" "Comprehensive security audit and threat assessment"
    
    # Detect security context
    detect_security_context
    
    # Run analysis based on mode
    case "$MODE" in
        "full-audit")
            scan_dependency_vulnerabilities
            scan_secrets
            analyze_code_security
            analyze_config_security
            ;;
        "quick-scan")
            scan_dependency_vulnerabilities
            scan_secrets
            ;;
        "vulnerability-scan")
            scan_dependency_vulnerabilities
            ;;
        "code-security")
            analyze_code_security
            ;;
        "dependencies")
            scan_dependency_vulnerabilities
            ;;
        "secrets-scan")
            scan_secrets
            ;;
    esac
    
    # Generate threat model if requested
    generate_threat_model
    
    # Generate security report
    generate_security_report
    
    # Display summary
    display_security_summary
    
    # Cleanup
    cleanup_security
    
    # Exit with appropriate code based on risk level
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        exit 3  # Critical risk
    elif [ "$HIGH_ISSUES" -gt 0 ]; then
        exit 2  # High risk
    elif [ "$MEDIUM_ISSUES" -gt 0 ]; then
        exit 1  # Medium risk
    else
        exit 0  # Low/minimal risk
    fi
}

# Trap for cleanup
trap cleanup_security EXIT

# Execute main function with all arguments
main "$@"
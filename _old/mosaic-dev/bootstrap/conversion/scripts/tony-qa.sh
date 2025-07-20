#!/bin/bash

# Tony Framework - Quality Assurance Audit Script
# Comprehensive QA analysis with automated reporting

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"

# Configuration
MODE="comprehensive"
GENERATE_REPORT=false
VERBOSE=false
OUTPUT_DIR="docs/audit/qa"
REPORT_DATE=$(date '+%Y-%m-%d')

# Display usage information
show_usage() {
    show_banner "Tony QA Audit Script" "Comprehensive quality assurance analysis"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --comprehensive       Complete QA analysis (default)"
    echo "  --quick               Quick quality check"
    echo "  --code-quality        Code quality analysis only"
    echo "  --test-coverage       Test coverage analysis only"
    echo "  --dependencies        Dependency audit only"
    echo "  --documentation       Documentation review only"
    echo "  --generate-report     Generate detailed QA report"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --comprehensive --generate-report    # Full QA audit with report"
    echo "  $0 --quick                             # Fast quality check"
    echo "  $0 --test-coverage --verbose           # Focus on test coverage"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --comprehensive)
                MODE="comprehensive"
                ;;
            --quick)
                MODE="quick"
                ;;
            --code-quality)
                MODE="code-quality"
                ;;
            --test-coverage)
                MODE="test-coverage"
                ;;
            --dependencies)
                MODE="dependencies"
                ;;
            --documentation)
                MODE="documentation"
                ;;
            --generate-report)
                GENERATE_REPORT=true
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

# Initialize QA analysis
init_qa_analysis() {
    log_info "Initializing QA analysis for $(basename $(pwd))"
    
    # Create output directories
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/reports"
    mkdir -p "$OUTPUT_DIR/metrics"
    
    # Initialize metrics tracking
    QA_TEMP_DIR="/tmp/tony-qa-$$"
    mkdir -p "$QA_TEMP_DIR"
    
    # Initialize counters
    TOTAL_SCORE=0
    MAX_SCORE=0
    ISSUES_COUNT=0
    WARNINGS_COUNT=0
}

# Detect project type and tools
detect_project_type() {
    local project_type="unknown"
    local package_managers=()
    local test_frameworks=()
    local linters=()
    
    # Detect project type
    if [ -f "package.json" ]; then
        project_type="node"
        package_managers+=("npm")
        [ -f "yarn.lock" ] && package_managers+=("yarn")
        [ -f "pnpm-lock.yaml" ] && package_managers+=("pnpm")
        
        # Detect test frameworks
        if command -v jest >/dev/null 2>&1 || grep -q "jest" package.json 2>/dev/null; then
            test_frameworks+=("jest")
        fi
        if command -v mocha >/dev/null 2>&1 || grep -q "mocha" package.json 2>/dev/null; then
            test_frameworks+=("mocha")
        fi
        if command -v vitest >/dev/null 2>&1 || grep -q "vitest" package.json 2>/dev/null; then
            test_frameworks+=("vitest")
        fi
        
        # Detect linters
        if command -v eslint >/dev/null 2>&1 || grep -q "eslint" package.json 2>/dev/null; then
            linters+=("eslint")
        fi
        if command -v prettier >/dev/null 2>&1 || grep -q "prettier" package.json 2>/dev/null; then
            linters+=("prettier")
        fi
        
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        project_type="python"
        package_managers+=("pip")
        [ -f "pyproject.toml" ] && package_managers+=("poetry")
        [ -f "Pipfile" ] && package_managers+=("pipenv")
        
        # Detect test frameworks
        if command -v pytest >/dev/null 2>&1; then
            test_frameworks+=("pytest")
        fi
        if command -v unittest >/dev/null 2>&1; then
            test_frameworks+=("unittest")
        fi
        
        # Detect linters
        if command -v flake8 >/dev/null 2>&1; then
            linters+=("flake8")
        fi
        if command -v pylint >/dev/null 2>&1; then
            linters+=("pylint")
        fi
        if command -v black >/dev/null 2>&1; then
            linters+=("black")
        fi
        
    elif [ -f "go.mod" ]; then
        project_type="go"
        package_managers+=("go")
        test_frameworks+=("go-test")
        linters+=("golint" "go-vet")
        
    elif [ -f "Cargo.toml" ]; then
        project_type="rust"
        package_managers+=("cargo")
        test_frameworks+=("cargo-test")
        linters+=("clippy" "rustfmt")
    fi
    
    # Store detection results
    echo "project_type:$project_type" > "$QA_TEMP_DIR/project_info"
    printf '%s\n' "${package_managers[@]}" > "$QA_TEMP_DIR/package_managers"
    printf '%s\n' "${test_frameworks[@]}" > "$QA_TEMP_DIR/test_frameworks"
    printf '%s\n' "${linters[@]}" > "$QA_TEMP_DIR/linters"
    
    log_info "Project type detected: $project_type"
    log_debug "Package managers: ${package_managers[*]}"
    log_debug "Test frameworks: ${test_frameworks[*]}"
    log_debug "Linters: ${linters[*]}"
}

# Analyze code quality
analyze_code_quality() {
    print_subsection "Code Quality Analysis"
    
    local project_type
    project_type=$(grep "project_type:" "$QA_TEMP_DIR/project_info" | cut -d: -f2)
    
    local quality_score=0
    local max_quality_score=100
    
    # File structure analysis
    local total_files
    total_files=$(find . -type f -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | wc -l)
    
    # Calculate code complexity
    local avg_file_size
    if [ "$total_files" -gt 0 ]; then
        avg_file_size=$(find . -type f -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -exec wc -l {} \; | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
    else
        avg_file_size=0
    fi
    
    # File size scoring (prefer smaller files)
    if [ "$(echo "$avg_file_size < 100" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        quality_score=$((quality_score + 25))
    elif [ "$(echo "$avg_file_size < 200" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        quality_score=$((quality_score + 20))
    elif [ "$(echo "$avg_file_size < 500" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        quality_score=$((quality_score + 15))
    else
        quality_score=$((quality_score + 5))
    fi
    
    # Linter analysis
    local linter_score=0
    if [ -f "$QA_TEMP_DIR/linters" ]; then
        while IFS= read -r linter; do
            case "$linter" in
                "eslint")
                    if eslint . --format=json > "$QA_TEMP_DIR/eslint_results.json" 2>/dev/null; then
                        local eslint_errors
                        eslint_errors=$(grep -o '"errorCount":[0-9]*' "$QA_TEMP_DIR/eslint_results.json" | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
                        if [ "$eslint_errors" -eq 0 ]; then
                            linter_score=$((linter_score + 25))
                        elif [ "$eslint_errors" -lt 10 ]; then
                            linter_score=$((linter_score + 15))
                        else
                            linter_score=$((linter_score + 5))
                        fi
                        log_debug "ESLint errors: $eslint_errors"
                    fi
                    ;;
                "flake8")
                    if flake8 . --count --exit-zero > "$QA_TEMP_DIR/flake8_results.txt" 2>/dev/null; then
                        local flake8_errors
                        flake8_errors=$(tail -1 "$QA_TEMP_DIR/flake8_results.txt" || echo "0")
                        if [ "$flake8_errors" -eq 0 ]; then
                            linter_score=$((linter_score + 25))
                        elif [ "$flake8_errors" -lt 10 ]; then
                            linter_score=$((linter_score + 15))
                        else
                            linter_score=$((linter_score + 5))
                        fi
                        log_debug "Flake8 errors: $flake8_errors"
                    fi
                    ;;
                "go-vet")
                    if go vet ./... > "$QA_TEMP_DIR/go_vet_results.txt" 2>&1; then
                        linter_score=$((linter_score + 25))
                        log_debug "Go vet: no issues"
                    else
                        local vet_issues
                        vet_issues=$(wc -l < "$QA_TEMP_DIR/go_vet_results.txt")
                        linter_score=$((linter_score + 10))
                        log_debug "Go vet issues: $vet_issues"
                    fi
                    ;;
            esac
        done < "$QA_TEMP_DIR/linters"
    fi
    
    quality_score=$((quality_score + linter_score))
    
    # Cap the score at max
    if [ "$quality_score" -gt "$max_quality_score" ]; then
        quality_score=$max_quality_score
    fi
    
    echo "code_quality_score:$quality_score" >> "$QA_TEMP_DIR/metrics"
    echo "code_quality_max:$max_quality_score" >> "$QA_TEMP_DIR/metrics"
    
    log_info "Code quality score: $quality_score/$max_quality_score"
}

# Analyze test coverage
analyze_test_coverage() {
    print_subsection "Test Coverage Analysis"
    
    local coverage_score=0
    local max_coverage_score=100
    local coverage_percentage=0
    
    # Check if test frameworks are present
    if [ -f "$QA_TEMP_DIR/test_frameworks" ]; then
        while IFS= read -r framework; do
            case "$framework" in
                "jest")
                    if command -v jest >/dev/null 2>&1; then
                        if jest --coverage --coverageReporters=text-summary --passWithNoTests > "$QA_TEMP_DIR/jest_coverage.txt" 2>&1; then
                            coverage_percentage=$(grep -o '[0-9]*\.[0-9]*%' "$QA_TEMP_DIR/jest_coverage.txt" | head -1 | sed 's/%//' || echo "0")
                            log_debug "Jest coverage: $coverage_percentage%"
                        fi
                    fi
                    ;;
                "pytest")
                    if command -v pytest >/dev/null 2>&1 && command -v coverage >/dev/null 2>&1; then
                        if coverage run -m pytest > "$QA_TEMP_DIR/pytest_coverage.txt" 2>&1; then
                            coverage report | grep "TOTAL" > "$QA_TEMP_DIR/coverage_summary.txt" 2>/dev/null || true
                            coverage_percentage=$(grep -o '[0-9]*%' "$QA_TEMP_DIR/coverage_summary.txt" | sed 's/%//' || echo "0")
                            log_debug "Pytest coverage: $coverage_percentage%"
                        fi
                    fi
                    ;;
                "go-test")
                    if go test -coverprofile=coverage.out ./... > "$QA_TEMP_DIR/go_test.txt" 2>&1; then
                        if go tool cover -func=coverage.out | tail -1 > "$QA_TEMP_DIR/go_coverage.txt" 2>/dev/null; then
                            coverage_percentage=$(grep -o '[0-9]*\.[0-9]*%' "$QA_TEMP_DIR/go_coverage.txt" | sed 's/%//' || echo "0")
                            rm -f coverage.out
                            log_debug "Go test coverage: $coverage_percentage%"
                        fi
                    fi
                    ;;
            esac
        done < "$QA_TEMP_DIR/test_frameworks"
    fi
    
    # Convert coverage percentage to score
    if [ "$(echo "$coverage_percentage >= 90" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        coverage_score=100
    elif [ "$(echo "$coverage_percentage >= 80" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        coverage_score=85
    elif [ "$(echo "$coverage_percentage >= 70" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        coverage_score=70
    elif [ "$(echo "$coverage_percentage >= 50" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        coverage_score=50
    else
        coverage_score=25
    fi
    
    echo "test_coverage_score:$coverage_score" >> "$QA_TEMP_DIR/metrics"
    echo "test_coverage_percentage:$coverage_percentage" >> "$QA_TEMP_DIR/metrics"
    echo "test_coverage_max:$max_coverage_score" >> "$QA_TEMP_DIR/metrics"
    
    log_info "Test coverage: $coverage_percentage% (Score: $coverage_score/$max_coverage_score)"
}

# Analyze documentation
analyze_documentation() {
    print_subsection "Documentation Analysis"
    
    local doc_score=0
    local max_doc_score=100
    
    # Check for README
    if [ -f "README.md" ] || [ -f "README.rst" ] || [ -f "README.txt" ]; then
        doc_score=$((doc_score + 25))
        log_debug "README file found"
    else
        log_warning "README file missing"
        ((ISSUES_COUNT++))
    fi
    
    # Check for CHANGELOG
    if [ -f "CHANGELOG.md" ] || [ -f "CHANGELOG.rst" ] || [ -f "HISTORY.md" ]; then
        doc_score=$((doc_score + 15))
        log_debug "Changelog found"
    else
        log_warning "Changelog missing"
        ((WARNINGS_COUNT++))
    fi
    
    # Check for LICENSE
    if [ -f "LICENSE" ] || [ -f "LICENSE.md" ] || [ -f "LICENSE.txt" ]; then
        doc_score=$((doc_score + 15))
        log_debug "License file found"
    else
        log_warning "License file missing"
        ((WARNINGS_COUNT++))
    fi
    
    # Check for docs directory
    if [ -d "docs" ]; then
        local doc_files
        doc_files=$(find docs -name "*.md" -o -name "*.rst" | wc -l)
        if [ "$doc_files" -gt 5 ]; then
            doc_score=$((doc_score + 25))
        elif [ "$doc_files" -gt 2 ]; then
            doc_score=$((doc_score + 15))
        elif [ "$doc_files" -gt 0 ]; then
            doc_score=$((doc_score + 10))
        fi
        log_debug "Documentation files: $doc_files"
    fi
    
    # Check for API documentation
    if [ -f "docs/api.md" ] || [ -f "docs/API.md" ] || find . -name "*api*.md" | grep -q .; then
        doc_score=$((doc_score + 20))
        log_debug "API documentation found"
    else
        log_warning "API documentation missing"
        ((WARNINGS_COUNT++))
    fi
    
    # Check for deprecated docker compose usage
    local deprecated_docker_files
    deprecated_docker_files=$(find . -type f \( -name "*.sh" -o -name "*.bash" -o -name "*.zsh" -o -name "Makefile" -o -name "*.mk" \) -exec grep -l "docker compose" {} \; 2>/dev/null | wc -l)
    if [ "$deprecated_docker_files" -gt 0 ]; then
        doc_score=$((doc_score - 10))
        log_warning "Deprecated 'docker compose' usage found in $deprecated_docker_files file(s)"
        log_warning "Use 'docker compose' (v2) instead"
        ((WARNINGS_COUNT++))
    else
        log_debug "No deprecated docker compose usage found"
    fi
    
    echo "documentation_score:$doc_score" >> "$QA_TEMP_DIR/metrics"
    echo "documentation_max:$max_doc_score" >> "$QA_TEMP_DIR/metrics"
    
    log_info "Documentation score: $doc_score/$max_doc_score"
}

# Analyze dependencies
analyze_dependencies() {
    print_subsection "Dependencies Analysis"
    
    local dep_score=100  # Start with perfect score and deduct
    local max_dep_score=100
    local vulnerabilities=0
    local outdated_packages=0
    
    local project_type
    project_type=$(grep "project_type:" "$QA_TEMP_DIR/project_info" | cut -d: -f2)
    
    case "$project_type" in
        "node")
            # Check for vulnerabilities
            if command -v npm >/dev/null 2>&1; then
                if npm audit --json > "$QA_TEMP_DIR/npm_audit.json" 2>/dev/null; then
                    vulnerabilities=$(grep -o '"total":[0-9]*' "$QA_TEMP_DIR/npm_audit.json" | grep -o '[0-9]*' | head -1 || echo "0")
                fi
                
                # Check for outdated packages
                if npm outdated --json > "$QA_TEMP_DIR/npm_outdated.json" 2>/dev/null; then
                    outdated_packages=$(wc -l < "$QA_TEMP_DIR/npm_outdated.json" || echo "0")
                fi
            fi
            ;;
        "python")
            # Check for vulnerabilities using safety if available
            if command -v safety >/dev/null 2>&1; then
                if safety check --json > "$QA_TEMP_DIR/safety_check.json" 2>/dev/null; then
                    vulnerabilities=$(grep -c '"vulnerability_id"' "$QA_TEMP_DIR/safety_check.json" || echo "0")
                fi
            fi
            
            # Check for outdated packages
            if command -v pip >/dev/null 2>&1; then
                if pip list --outdated --format=json > "$QA_TEMP_DIR/pip_outdated.json" 2>/dev/null; then
                    outdated_packages=$(grep -c '"name"' "$QA_TEMP_DIR/pip_outdated.json" || echo "0")
                fi
            fi
            ;;
        "go")
            # Check for vulnerabilities using govulncheck if available
            if command -v govulncheck >/dev/null 2>&1; then
                if govulncheck ./... > "$QA_TEMP_DIR/go_vulns.txt" 2>&1; then
                    vulnerabilities=$(grep -c "Vulnerability" "$QA_TEMP_DIR/go_vulns.txt" || echo "0")
                fi
            fi
            ;;
    esac
    
    # Deduct points for issues
    if [ "$vulnerabilities" -gt 0 ]; then
        local vuln_deduction=$((vulnerabilities * 10))
        dep_score=$((dep_score - vuln_deduction))
        ((ISSUES_COUNT += vulnerabilities))
        log_warning "Security vulnerabilities found: $vulnerabilities"
    fi
    
    if [ "$outdated_packages" -gt 0 ]; then
        local outdated_deduction=$((outdated_packages * 2))
        dep_score=$((dep_score - outdated_deduction))
        ((WARNINGS_COUNT += outdated_packages))
        log_warning "Outdated packages found: $outdated_packages"
    fi
    
    # Ensure score doesn't go below 0
    if [ "$dep_score" -lt 0 ]; then
        dep_score=0
    fi
    
    echo "dependencies_score:$dep_score" >> "$QA_TEMP_DIR/metrics"
    echo "dependencies_vulnerabilities:$vulnerabilities" >> "$QA_TEMP_DIR/metrics"
    echo "dependencies_outdated:$outdated_packages" >> "$QA_TEMP_DIR/metrics"
    echo "dependencies_max:$max_dep_score" >> "$QA_TEMP_DIR/metrics"
    
    log_info "Dependencies score: $dep_score/$max_dep_score"
    log_info "Vulnerabilities: $vulnerabilities, Outdated: $outdated_packages"
}

# Generate QA report
generate_qa_report() {
    if [ "$GENERATE_REPORT" != true ]; then
        return 0
    fi
    
    print_subsection "Generating QA Report"
    
    local report_file="$OUTPUT_DIR/qa-report-$REPORT_DATE.md"
    local project_name
    project_name=$(basename "$(pwd)")
    
    # Calculate overall score
    local total_score=0
    local max_total=0
    
    while IFS=: read -r metric value; do
        case "$metric" in
            *_score)
                total_score=$((total_score + value))
                ;;
            *_max)
                max_total=$((max_total + value))
                ;;
        esac
    done < "$QA_TEMP_DIR/metrics"
    
    local overall_percentage
    if [ "$max_total" -gt 0 ]; then
        overall_percentage=$((total_score * 100 / max_total))
    else
        overall_percentage=0
    fi
    
    # Generate report
    cat > "$report_file" << EOF
# QA Analysis Report

**Project**: $project_name  
**Date**: $REPORT_DATE  
**Analysis Type**: $MODE  
**Overall Score**: $total_score/$max_total ($overall_percentage%)  

## Executive Summary

$(if [ "$overall_percentage" -ge 90 ]; then echo "🟢 **EXCELLENT** - Project demonstrates exceptional quality standards"; elif [ "$overall_percentage" -ge 80 ]; then echo "🟢 **GOOD** - Project meets high quality standards with minor improvements needed"; elif [ "$overall_percentage" -ge 70 ]; then echo "🟡 **ACCEPTABLE** - Project meets basic quality standards but has room for improvement"; elif [ "$overall_percentage" -ge 60 ]; then echo "🟠 **NEEDS IMPROVEMENT** - Project has significant quality issues that should be addressed"; else echo "🔴 **POOR** - Project has serious quality issues requiring immediate attention"; fi)

**Issues Found**: $ISSUES_COUNT critical, $WARNINGS_COUNT warnings

## Quality Metrics

### Code Quality
EOF

    # Add individual metrics
    while IFS=: read -r metric value; do
        case "$metric" in
            "code_quality_score")
                local code_max
                code_max=$(grep "code_quality_max:" "$QA_TEMP_DIR/metrics" | cut -d: -f2)
                echo "- **Score**: $value/$code_max" >> "$report_file"
                ;;
            "test_coverage_percentage")
                echo "- **Coverage**: $value%" >> "$report_file"
                ;;
            "documentation_score")
                local doc_max
                doc_max=$(grep "documentation_max:" "$QA_TEMP_DIR/metrics" | cut -d: -f2)
                echo "- **Documentation**: $value/$doc_max" >> "$report_file"
                ;;
            "dependencies_vulnerabilities")
                echo "- **Security Vulnerabilities**: $value" >> "$report_file"
                ;;
            "dependencies_outdated")
                echo "- **Outdated Dependencies**: $value" >> "$report_file"
                ;;
        esac
    done < "$QA_TEMP_DIR/metrics"
    
    cat >> "$report_file" << EOF

## Recommendations

### High Priority
EOF

    if [ "$ISSUES_COUNT" -gt 0 ]; then
        echo "- Address $ISSUES_COUNT critical issues identified during analysis" >> "$report_file"
    fi
    
    local coverage_pct
    coverage_pct=$(grep "test_coverage_percentage:" "$QA_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    if [ "$(echo "$coverage_pct < 80" | bc 2>/dev/null || echo 1)" -eq 1 ]; then
        echo "- Increase test coverage to at least 80% (current: $coverage_pct%)" >> "$report_file"
    fi
    
    local vulns
    vulns=$(grep "dependencies_vulnerabilities:" "$QA_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    if [ "$vulns" -gt 0 ]; then
        echo "- Fix $vulns security vulnerabilities in dependencies" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### Medium Priority
EOF

    if [ "$WARNINGS_COUNT" -gt 0 ]; then
        echo "- Address $WARNINGS_COUNT warnings for improved code quality" >> "$report_file"
    fi
    
    local outdated
    outdated=$(grep "dependencies_outdated:" "$QA_TEMP_DIR/metrics" | cut -d: -f2 || echo "0")
    if [ "$outdated" -gt 0 ]; then
        echo "- Update $outdated outdated dependencies" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Detailed Analysis

### Code Quality Metrics
- **Total Files Analyzed**: $(find . -type f -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | wc -l)
- **Average File Size**: Lines per file analyzed
- **Linting Results**: See individual linter outputs

### Test Coverage Details
- **Test Framework**: $(head -1 "$QA_TEMP_DIR/test_frameworks" 2>/dev/null || echo "None detected")
- **Coverage Percentage**: $coverage_pct%
- **Target Coverage**: 80-90%

### Documentation Review
- **README**: $([ -f "README.md" ] && echo "✅ Present" || echo "❌ Missing")
- **CHANGELOG**: $([ -f "CHANGELOG.md" ] && echo "✅ Present" || echo "❌ Missing")
- **LICENSE**: $([ -f "LICENSE" ] && echo "✅ Present" || echo "❌ Missing")
- **API Documentation**: $([ -f "docs/api.md" ] && echo "✅ Present" || echo "❌ Missing")

### Dependencies Analysis
- **Security Vulnerabilities**: $vulns
- **Outdated Packages**: $outdated
- **Package Manager**: $(head -1 "$QA_TEMP_DIR/package_managers" 2>/dev/null || echo "Unknown")

---

**Report Generated**: $(date)  
**Tool**: Tony Framework QA Analysis v2.0  
**Next Review**: $(date -d "+1 week" +"%Y-%m-%d")
EOF

    log_success "QA report generated: $report_file"
}

# Display QA summary
display_qa_summary() {
    print_section "QA Analysis Complete"
    
    # Calculate overall score
    local total_score=0
    local max_total=0
    
    while IFS=: read -r metric value; do
        case "$metric" in
            *_score)
                total_score=$((total_score + value))
                ;;
            *_max)
                max_total=$((max_total + value))
                ;;
        esac
    done < "$QA_TEMP_DIR/metrics"
    
    local overall_percentage
    if [ "$max_total" -gt 0 ]; then
        overall_percentage=$((total_score * 100 / max_total))
    else
        overall_percentage=0
    fi
    
    # Determine status
    local status_icon status_text
    if [ "$overall_percentage" -ge 90 ]; then
        status_icon="🟢" 
        status_text="EXCELLENT"
    elif [ "$overall_percentage" -ge 80 ]; then
        status_icon="🟢"
        status_text="GOOD"
    elif [ "$overall_percentage" -ge 70 ]; then
        status_icon="🟡"
        status_text="ACCEPTABLE"
    elif [ "$overall_percentage" -ge 60 ]; then
        status_icon="🟠"
        status_text="NEEDS IMPROVEMENT"
    else
        status_icon="🔴"
        status_text="POOR"
    fi
    
    echo "🔍 Tony QA Analysis Complete"
    echo ""
    echo "📊 Quality Metrics:"
    
    # Display individual metrics
    while IFS=: read -r metric value; do
        case "$metric" in
            "code_quality_score")
                local code_max
                code_max=$(grep "code_quality_max:" "$QA_TEMP_DIR/metrics" | cut -d: -f2)
                local code_pct=$((value * 100 / code_max))
                if [ "$code_pct" -ge 80 ]; then
                    echo "  ✅ Code Quality: $value/$code_max ($code_pct%)"
                elif [ "$code_pct" -ge 60 ]; then
                    echo "  ⚠️  Code Quality: $value/$code_max ($code_pct%)"
                else
                    echo "  ❌ Code Quality: $value/$code_max ($code_pct%)"
                fi
                ;;
            "test_coverage_percentage")
                if [ "$(echo "$value >= 80" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
                    echo "  ✅ Test Coverage: $value% (Target: 80%)"
                elif [ "$(echo "$value >= 60" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
                    echo "  ⚠️  Test Coverage: $value% (Target: 80%)"
                else
                    echo "  ❌ Test Coverage: $value% (Target: 80%)"
                fi
                ;;
            "dependencies_vulnerabilities")
                if [ "$value" -eq 0 ]; then
                    echo "  ✅ Security: No vulnerabilities found"
                else
                    echo "  ❌ Security: $value vulnerabilities found"
                fi
                ;;
        esac
    done < "$QA_TEMP_DIR/metrics"
    
    echo ""
    echo "$status_icon Overall Quality: $status_text ($overall_percentage%)"
    
    # Display issues summary
    if [ "$ISSUES_COUNT" -gt 0 ] || [ "$WARNINGS_COUNT" -gt 0 ]; then
        echo ""
        echo "📋 Issues Summary:"
        [ "$ISSUES_COUNT" -gt 0 ] && echo "  🚨 Critical Issues: $ISSUES_COUNT"
        [ "$WARNINGS_COUNT" -gt 0 ] && echo "  ⚠️  Warnings: $WARNINGS_COUNT"
    fi
    
    # Display report location
    if [ "$GENERATE_REPORT" = true ]; then
        echo ""
        echo "📁 Detailed Report: $OUTPUT_DIR/qa-report-$REPORT_DATE.md"
    fi
}

# Cleanup function
cleanup_qa() {
    if [ -n "${QA_TEMP_DIR:-}" ] && [ -d "$QA_TEMP_DIR" ]; then
        rm -rf "$QA_TEMP_DIR"
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Initialize
    init_qa_analysis
    
    # Show banner
    show_banner "Tony QA Analysis" "Comprehensive quality assurance audit"
    
    # Detect project environment
    detect_project_type
    
    # Run analysis based on mode
    case "$MODE" in
        "comprehensive")
            analyze_code_quality
            analyze_test_coverage
            analyze_documentation
            analyze_dependencies
            ;;
        "quick")
            analyze_code_quality
            analyze_test_coverage
            ;;
        "code-quality")
            analyze_code_quality
            ;;
        "test-coverage")
            analyze_test_coverage
            ;;
        "documentation")
            analyze_documentation
            ;;
        "dependencies")
            analyze_dependencies
            ;;
    esac
    
    # Generate report if requested
    generate_qa_report
    
    # Display summary
    display_qa_summary
    
    # Cleanup
    cleanup_qa
    
    # Exit with appropriate code
    if [ "$ISSUES_COUNT" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Trap for cleanup
trap cleanup_qa EXIT

# Execute main function with all arguments
main "$@"
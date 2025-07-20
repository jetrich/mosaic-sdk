#!/usr/bin/env python3
"""
Analyze old documentation and create consolidation plan
"""

import os
from pathlib import Path
from collections import defaultdict
import yaml

def analyze_docs(old_docs_path: str):
    """Analyze documentation in _old folder"""
    
    # Categories for consolidation
    categories = {
        'deployment': {
            'files': [],
            'target': 'platform/installation/deployment',
            'description': 'Installation and deployment guides'
        },
        'cicd': {
            'files': [],
            'target': 'engineering/cicd-handbook',
            'description': 'CI/CD pipelines and workflows'
        },
        'operations': {
            'files': [],
            'target': 'platform/operations',
            'description': 'Operational procedures and runbooks'
        },
        'architecture': {
            'files': [],
            'target': 'projects/architecture',
            'description': 'Architecture and design documents'
        },
        'api': {
            'files': [],
            'target': 'engineering/api-documentation',
            'description': 'API documentation'
        },
        'development': {
            'files': [],
            'target': 'engineering/getting-started',
            'description': 'Development guides and workflows'
        },
        'services': {
            'files': [],
            'target': 'platform/services',
            'description': 'Service-specific documentation'
        },
        'epics': {
            'files': [],
            'target': 'projects/project-management/active-epics',
            'description': 'Epic and task tracking'
        },
        'migration': {
            'files': [],
            'target': 'projects/migrations',
            'description': 'Migration guides'
        },
        'mcp': {
            'files': [],
            'target': 'engineering/api-documentation/mcp-protocol',
            'description': 'MCP integration documentation'
        },
        'troubleshooting': {
            'files': [],
            'target': 'learning/troubleshooting',
            'description': 'Troubleshooting guides'
        }
    }
    
    # Walk through old docs
    old_path = Path(old_docs_path)
    for md_file in old_path.rglob("*.md"):
        if '_moved' in str(md_file):
            continue
            
        rel_path = md_file.relative_to(old_path)
        content = md_file.read_text()
        
        # Categorize based on path and content
        categorized = False
        
        # Path-based categorization
        if 'deployment' in str(rel_path) or 'nginx' in str(rel_path) or 'portainer' in str(rel_path):
            categories['deployment']['files'].append(str(rel_path))
            categorized = True
        elif 'ci-cd' in str(rel_path) or 'cicd' in str(rel_path) or 'pipeline' in str(rel_path).lower():
            categories['cicd']['files'].append(str(rel_path))
            categorized = True
        elif 'operations' in str(rel_path) or 'backup' in str(rel_path) or 'incident' in str(rel_path):
            categories['operations']['files'].append(str(rel_path))
            categorized = True
        elif 'architecture' in str(rel_path) or 'design' in str(rel_path):
            categories['architecture']['files'].append(str(rel_path))
            categorized = True
        elif 'api' in str(rel_path):
            categories['api']['files'].append(str(rel_path))
            categorized = True
        elif 'development' in str(rel_path) or 'git' in str(rel_path) or 'workflow' in str(rel_path):
            categories['development']['files'].append(str(rel_path))
            categorized = True
        elif 'services' in str(rel_path) or 'gitea' in str(rel_path) or 'postgres' in str(rel_path):
            categories['services']['files'].append(str(rel_path))
            categorized = True
        elif 'E055' in str(rel_path) or 'E057' in str(rel_path) or 'epic' in str(rel_path).lower():
            categories['epics']['files'].append(str(rel_path))
            categorized = True
        elif 'migration' in str(rel_path) or 'tony-sdk' in str(rel_path):
            categories['migration']['files'].append(str(rel_path))
            categorized = True
        elif 'mcp' in str(rel_path).lower():
            categories['mcp']['files'].append(str(rel_path))
            categorized = True
        elif 'troubleshoot' in str(rel_path) or 'common-issues' in str(rel_path):
            categories['troubleshooting']['files'].append(str(rel_path))
            categorized = True
        
        # Content-based categorization for uncategorized files
        if not categorized:
            content_lower = content.lower()
            if 'deploy' in content_lower or 'install' in content_lower:
                categories['deployment']['files'].append(str(rel_path))
            elif 'pipeline' in content_lower or 'ci/cd' in content_lower:
                categories['cicd']['files'].append(str(rel_path))
            elif 'backup' in content_lower or 'restore' in content_lower:
                categories['operations']['files'].append(str(rel_path))
            elif 'architecture' in content_lower or 'design' in content_lower:
                categories['architecture']['files'].append(str(rel_path))
            elif 'api' in content_lower or 'endpoint' in content_lower:
                categories['api']['files'].append(str(rel_path))
            else:
                # Default to development
                categories['development']['files'].append(str(rel_path))
    
    return categories

def generate_consolidation_plan(categories: dict):
    """Generate consolidation plan"""
    
    plan = ["# Documentation Consolidation Plan\n"]
    plan.append("## Summary")
    
    total_files = sum(len(cat['files']) for cat in categories.values())
    plan.append(f"Total files to consolidate: {total_files}\n")
    
    plan.append("## Consolidation Strategy\n")
    
    for cat_name, cat_data in categories.items():
        if not cat_data['files']:
            continue
            
        plan.append(f"### {cat_name.title()} ({len(cat_data['files'])} files)")
        plan.append(f"**Target**: `{cat_data['target']}`")
        plan.append(f"**Description**: {cat_data['description']}\n")
        plan.append("**Files to consolidate**:")
        
        for file in sorted(cat_data['files']):
            plan.append(f"- `{file}`")
        
        plan.append("\n**Consolidation approach**:")
        
        # Specific strategies per category
        if cat_name == 'deployment':
            plan.append("- Merge all deployment guides into comprehensive installation guide")
            plan.append("- Create separate pages for Docker, Portainer, and NPM setup")
            plan.append("- Extract prerequisites into planning chapter")
        elif cat_name == 'cicd':
            plan.append("- Organize by complexity: basic → advanced → best practices")
            plan.append("- Extract pipeline templates into reusable examples")
            plan.append("- Create troubleshooting section from CI/CD issues")
        elif cat_name == 'operations':
            plan.append("- Group by frequency: routine → backup/restore → incident")
            plan.append("- Create runbook format for consistency")
            plan.append("- Extract disaster recovery into separate comprehensive guide")
        elif cat_name == 'epics':
            plan.append("- One page per epic with current status")
            plan.append("- Extract completed work to archive")
            plan.append("- Create summary dashboard page")
        elif cat_name == 'mcp':
            plan.append("- Create comprehensive MCP integration guide")
            plan.append("- Extract quick reference as separate page")
            plan.append("- Document migration path from non-MCP to MCP")
        
        plan.append("")
    
    return "\n".join(plan)

if __name__ == "__main__":
    import sys
    
    old_docs_path = sys.argv[1] if len(sys.argv) > 1 else "docs/_old"
    
    # Analyze
    categories = analyze_docs(old_docs_path)
    
    # Generate plan
    plan = generate_consolidation_plan(categories)
    
    # Save plan
    with open("consolidation-plan.md", "w") as f:
        f.write(plan)
    
    print("Consolidation plan saved to consolidation-plan.md")
    print(f"\nSummary:")
    for cat_name, cat_data in categories.items():
        if cat_data['files']:
            print(f"  {cat_name}: {len(cat_data['files'])} files → {cat_data['target']}")
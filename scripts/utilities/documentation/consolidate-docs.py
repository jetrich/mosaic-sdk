#!/usr/bin/env python3
"""
Consolidate documentation from _old to new structure
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
import re

def create_frontmatter(title: str, category: str, order: int = 1, tags: list = None):
    """Create BookStack-compatible frontmatter"""
    
    if tags is None:
        tags = [category, "documentation"]
    
    frontmatter = f"""---
title: "{title}"
order: {order:02d}
category: "{category}"
tags: {tags}
last_updated: "{datetime.now().strftime('%Y-%m-%d')}"
author: "consolidation"
version: "1.0"
status: "published"
---

"""
    return frontmatter

def consolidate_category(category_name: str, files: list, target_path: str, strategy: dict):
    """Consolidate files in a category"""
    
    target_dir = Path(target_path)
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Create _moved directory
    moved_dir = Path("docs/_old/_moved") / category_name
    moved_dir.mkdir(parents=True, exist_ok=True)
    
    consolidated_files = []
    
    # Process based on strategy
    if strategy.get('type') == 'merge':
        # Merge multiple files into one
        page_name = strategy.get('page_name', f"01-{category_name}-guide")
        page_title = strategy.get('page_title', f"{category_name.title()} Guide")
        
        merged_content = create_frontmatter(
            title=page_title,
            category=target_dir.name,
            order=1,
            tags=strategy.get('tags', [category_name])
        )
        
        merged_content += f"# {page_title}\n\n"
        
        # Add merged content
        for i, file_path in enumerate(sorted(files)):
            src_file = Path("docs/_old") / file_path
            if src_file.exists():
                content = src_file.read_text()
                
                # Extract title from content or filename
                title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                section_title = title_match.group(1) if title_match else src_file.stem.replace('-', ' ').title()
                
                # Add as section
                merged_content += f"\n## {section_title}\n\n"
                
                # Remove existing title and add content
                content_without_title = re.sub(r'^#\s+.+\n', '', content, count=1)
                merged_content += content_without_title
                
                # Move to _moved
                shutil.move(str(src_file), str(moved_dir / src_file.name))
                consolidated_files.append(str(file_path))
        
        # Write merged file
        target_file = target_dir / f"{page_name}.md"
        target_file.write_text(merged_content)
        print(f"Created merged file: {target_file}")
        
    elif strategy.get('type') == 'separate':
        # Keep files separate but reorganize
        for i, file_path in enumerate(sorted(files)):
            src_file = Path("docs/_old") / file_path
            if src_file.exists():
                content = src_file.read_text()
                
                # Extract title
                title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                title = title_match.group(1) if title_match else src_file.stem.replace('-', ' ').title()
                
                # Add frontmatter if missing
                if not content.startswith('---'):
                    content = create_frontmatter(
                        title=title,
                        category=target_dir.name,
                        order=i + 1,
                        tags=strategy.get('tags', [category_name])
                    ) + content
                
                # Create new filename with number prefix
                new_name = f"{i+1:02d}-{src_file.stem}.md"
                target_file = target_dir / new_name
                
                # Write file
                target_file.write_text(content)
                print(f"Created: {target_file}")
                
                # Move to _moved
                shutil.move(str(src_file), str(moved_dir / src_file.name))
                consolidated_files.append(str(file_path))
    
    return consolidated_files

# Define consolidation strategies
consolidation_strategies = {
    'cicd': {
        'type': 'separate',
        'tags': ['cicd', 'pipelines', 'automation']
    },
    'operations': {
        'type': 'separate', 
        'tags': ['operations', 'runbooks', 'procedures']
    },
    'architecture': {
        'type': 'merge',
        'page_name': '01-system-architecture',
        'page_title': 'System Architecture Overview',
        'tags': ['architecture', 'design', 'system']
    },
    'api': {
        'type': 'merge',
        'page_name': '01-api-overview',
        'page_title': 'API Documentation Overview',
        'tags': ['api', 'rest', 'integration']
    },
    'epics': {
        'type': 'separate',
        'tags': ['epics', 'project-management', 'tracking']
    },
    'mcp': {
        'type': 'merge',
        'page_name': '01-mcp-integration',
        'page_title': 'MCP Integration Guide',
        'tags': ['mcp', 'integration', 'protocol']
    }
}

def main():
    # Example consolidation for CI/CD
    cicd_files = [
        'ci-cd/CI-CD-BEST-PRACTICES.md',
        'ci-cd/CI-CD-TROUBLESHOOTING.md', 
        'ci-cd/CI-CD-WORKFLOWS.md',
        'ci-cd/PIPELINE-TEMPLATES.md'
    ]
    
    print("Consolidating CI/CD documentation...")
    consolidated = consolidate_category(
        'cicd',
        cicd_files,
        'docs/engineering/cicd-handbook/pipeline-setup',
        consolidation_strategies['cicd']
    )
    
    print(f"\nConsolidated {len(consolidated)} files")
    
    # Continue with other categories...

if __name__ == "__main__":
    main()
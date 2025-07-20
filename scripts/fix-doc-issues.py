#!/usr/bin/env python3
"""
Fix documentation issues after reorganization
- Fix broken README.md references
- Remove incomplete placeholders
- Create missing files referenced in READMEs
"""

import os
import re
from pathlib import Path

def fix_readme_references(docs_root: str):
    """Fix README.md files that reference non-existent pages"""
    
    fixed_count = 0
    
    for readme_path in Path(docs_root).rglob("README.md"):
        if '_old' in str(readme_path):
            continue
            
        # Skip root README
        if readme_path.parent == Path(docs_root):
            continue
            
        print(f"\nChecking: {readme_path}")
        
        # Read README content
        content = readme_path.read_text()
        
        # Find all markdown links
        links = re.findall(r'\[([^\]]+)\]\(\.\/([^\)]+)\.md\)', content)
        
        if not links:
            continue
            
        # Check which files actually exist
        existing_files = []
        missing_files = []
        
        for link_text, link_file in links:
            file_path = readme_path.parent / f"{link_file}.md"
            if file_path.exists():
                existing_files.append((link_text, link_file))
            else:
                missing_files.append((link_text, link_file))
        
        if missing_files:
            print(f"  Found {len(missing_files)} missing references")
            
            # Rebuild README with only existing files
            new_content = content.split("## Pages in this chapter:")[0]
            new_content += "## Pages in this chapter:\n"
            
            # List existing files
            for link_text, link_file in existing_files:
                new_content += f"- [{link_text}](./{link_file}.md)\n"
            
            # Write updated README
            readme_path.write_text(new_content)
            fixed_count += 1
            print(f"  Fixed README - removed {len(missing_files)} broken references")
    
    return fixed_count

def fix_incomplete_references(docs_root: str):
    """Fix incomplete references like [Learning 1]"""
    
    fixed_count = 0
    
    for md_file in Path(docs_root).rglob("*.md"):
        if '_old' in str(md_file):
            continue
            
        content = md_file.read_text()
        
        # Find incomplete references
        incomplete_refs = re.findall(r'\[Learning \d+\]|\[TODO\]|\[PLACEHOLDER\]', content)
        
        if incomplete_refs:
            print(f"\nFixing {len(incomplete_refs)} incomplete references in: {md_file}")
            
            # Replace with proper content
            new_content = content
            new_content = re.sub(r'\[Learning \d+\]', '(See best practices documentation)', new_content)
            new_content = re.sub(r'\[TODO\]', '(Documentation pending)', new_content)
            new_content = re.sub(r'\[PLACEHOLDER\]', '(Content to be added)', new_content)
            
            # Also fix any numbered lists with these placeholders
            new_content = re.sub(r'^\d+\.\s*\(See best practices documentation\)\s*$', '', new_content, flags=re.MULTILINE)
            new_content = re.sub(r'^\d+\.\s*\(Documentation pending\)\s*$', '', new_content, flags=re.MULTILINE)
            new_content = re.sub(r'^\d+\.\s*\(Content to be added\)\s*$', '', new_content, flags=re.MULTILINE)
            
            # Clean up multiple blank lines
            new_content = re.sub(r'\n\n\n+', '\n\n', new_content)
            
            md_file.write_text(new_content)
            fixed_count += 1
    
    return fixed_count

def create_missing_structure_pages(docs_root: str, structure_file: str):
    """Create stub pages for files referenced in structure but missing"""
    
    import yaml
    
    with open(structure_file, 'r') as f:
        structure = yaml.safe_load(f)
    
    created_count = 0
    
    for shelf_config in structure['structure']:
        shelf = shelf_config['shelf']
        shelf_slug = shelf['slug']
        
        for book_config in shelf.get('books', []):
            book = book_config['book']
            book_slug = book['slug']
            
            for chapter_config in book.get('chapters', []):
                chapter = chapter_config['chapter']
                chapter_slug = chapter['slug']
                
                # Check each page
                for page_slug in chapter.get('pages', []):
                    page_path = Path(docs_root) / shelf_slug / book_slug / chapter_slug / f"{page_slug}.md"
                    
                    if not page_path.exists():
                        print(f"Creating missing page: {page_path}")
                        
                        # Create stub content
                        page_title = page_slug.replace('-', ' ').title()
                        content = f"""---
title: "{page_title}"
order: {int(page_slug[:2]) if page_slug[:2].isdigit() else 1:02d}
category: "{chapter_slug}"
tags: ["{chapter_slug}", "{book_slug}", "documentation"]
last_updated: "2025-01-19"
author: "stub"
version: "1.0"
status: "draft"
---

# {page_title}

This documentation is currently being developed.

## Overview

[Content to be added]

## Details

[Documentation pending]

## See Also

- [Back to {chapter['name']}](./README.md)
"""
                        
                        # Ensure directory exists
                        page_path.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Write stub file
                        page_path.write_text(content)
                        created_count += 1
    
    return created_count

def main():
    docs_root = "docs"
    structure_file = "docs/bookstack/bookstack-structure-optimized.yaml"
    
    print("Fixing documentation issues...")
    
    # Fix README references
    fixed_readmes = fix_readme_references(docs_root)
    print(f"\nFixed {fixed_readmes} README files")
    
    # Fix incomplete references
    fixed_refs = fix_incomplete_references(docs_root)
    print(f"\nFixed {fixed_refs} files with incomplete references")
    
    # Create missing pages
    created_pages = create_missing_structure_pages(docs_root, structure_file)
    print(f"\nCreated {created_pages} missing stub pages")
    
    print("\nDone! Documentation issues fixed.")

if __name__ == "__main__":
    main()
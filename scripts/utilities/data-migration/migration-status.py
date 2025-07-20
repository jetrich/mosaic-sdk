#!/usr/bin/env python3
"""
Show current migration status
"""

import os
from pathlib import Path
from collections import defaultdict

def get_status():
    old_docs = Path("docs/_old")
    new_docs = Path("docs")
    moved_docs = Path("docs/_old/_moved")
    
    # Count files
    old_files = list(old_docs.rglob("*.md"))
    old_files = [f for f in old_files if '_moved' not in str(f)]
    moved_files = list(moved_docs.rglob("*.md"))
    
    # Count by category
    old_by_category = defaultdict(int)
    for f in old_files:
        parts = f.relative_to(old_docs).parts
        if parts:
            category = parts[0]
            old_by_category[category] += 1
    
    # Count new docs
    new_files = list(new_docs.rglob("*.md"))
    new_files = [f for f in new_files if '_old' not in str(f) and 'bookstack' not in str(f)]
    
    # Count stubs vs real content
    stubs = []
    real_content = []
    for f in new_files:
        content = f.read_text()
        if 'status: "draft"' in content:
            stubs.append(f)
        else:
            real_content.append(f)
    
    print("=== Documentation Migration Status ===\n")
    
    print(f"Original files: {len(old_files) + len(moved_files)}")
    print(f"Already moved: {len(moved_files)}")
    print(f"Remaining in _old: {len(old_files)}")
    print()
    
    print("Remaining by category:")
    for category, count in sorted(old_by_category.items()):
        print(f"  {category}: {count}")
    print()
    
    print(f"New structure files: {len(new_files)}")
    print(f"  With real content: {len(real_content)}")
    print(f"  Still stubs: {len(stubs)}")
    print()
    
    # Show sample of remaining files
    print("Sample of remaining files to migrate:")
    for f in sorted(old_files)[:10]:
        print(f"  - {f.relative_to(old_docs)}")
    
    if len(old_files) > 10:
        print(f"  ... and {len(old_files) - 10} more")

if __name__ == "__main__":
    get_status()
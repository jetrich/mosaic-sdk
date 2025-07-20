#!/usr/bin/env python3
"""
List all valid documentation paths based on bookstack-structure.yaml
Helps agents know where to place new documentation
"""

import yaml
from pathlib import Path
import argparse

def load_structure(structure_file: str) -> dict:
    """Load the BookStack structure definition"""
    with open(structure_file, 'r') as f:
        return yaml.safe_load(f)

def list_valid_paths(structure: dict, docs_root: str = "docs") -> list:
    """Generate all valid documentation paths"""
    paths = []
    
    for shelf_config in structure['structure']:
        shelf = shelf_config['shelf']
        shelf_slug = shelf['slug']
        shelf_name = shelf['name']
        
        for book_config in shelf.get('books', []):
            book = book_config['book']
            book_slug = book['slug']
            book_name = book['name']
            
            for chapter_config in book.get('chapters', []):
                chapter = chapter_config['chapter']
                chapter_slug = chapter['slug']
                chapter_name = chapter['name']
                
                # Full path for this chapter
                full_path = f"{docs_root}/{shelf_slug}/{book_slug}/{chapter_slug}/"
                
                paths.append({
                    'path': full_path,
                    'shelf': shelf_name,
                    'book': book_name,
                    'chapter': chapter_name,
                    'description': f"{shelf_name} > {book_name} > {chapter_name}"
                })
    
    return paths

def print_paths_tree(paths: list):
    """Print paths in a tree structure"""
    print("📚 Valid Documentation Paths\n")
    print("=" * 80)
    
    current_shelf = None
    current_book = None
    
    for path_info in paths:
        if path_info['shelf'] != current_shelf:
            current_shelf = path_info['shelf']
            print(f"\n📗 {current_shelf}")
            current_book = None
        
        if path_info['book'] != current_book:
            current_book = path_info['book']
            print(f"  📘 {current_book}")
        
        print(f"    📄 {path_info['chapter']}")
        print(f"       Path: {path_info['path']}")

def print_paths_list(paths: list):
    """Print paths as a simple list"""
    print("Valid paths for new documentation:\n")
    
    for path_info in paths:
        print(f"{path_info['path']}")
        print(f"  Purpose: {path_info['description']}")
        print()

def print_quick_reference(paths: list):
    """Print a quick reference guide"""
    print("🚀 Quick Reference Guide\n")
    print("=" * 80)
    
    categories = {
        'setup': [],
        'config': [],
        'api': [],
        'troubleshooting': [],
        'backup': [],
        'monitoring': [],
        'planning': [],
        'services': []
    }
    
    for path_info in paths:
        path = path_info['path'].lower()
        for category in categories:
            if category in path:
                categories[category].append(path_info)
                break
    
    for category, items in categories.items():
        if items:
            print(f"\n{category.upper()} Documentation:")
            for item in items:
                print(f"  - {item['path']}")

def main():
    parser = argparse.ArgumentParser(
        description='List valid documentation paths'
    )
    parser.add_argument(
        '--structure',
        default='docs/bookstack/bookstack-structure.yaml',
        help='Path to structure definition'
    )
    parser.add_argument(
        '--format',
        choices=['tree', 'list', 'quick'],
        default='tree',
        help='Output format'
    )
    parser.add_argument(
        '--category',
        help='Filter by category keyword'
    )
    
    args = parser.parse_args()
    
    # Load structure
    structure = load_structure(args.structure)
    paths = list_valid_paths(structure)
    
    # Filter if category specified
    if args.category:
        paths = [p for p in paths if args.category.lower() in p['path'].lower()]
    
    # Display based on format
    if args.format == 'tree':
        print_paths_tree(paths)
    elif args.format == 'list':
        print_paths_list(paths)
    elif args.format == 'quick':
        print_quick_reference(paths)
    
    print(f"\nTotal valid paths: {len(paths)}")
    print("\nTo create a new document:")
    print("1. Choose the appropriate path from above")
    print("2. Create your .md file with number prefix (01-, 02-, etc.)")
    print("3. Include all required frontmatter")
    print("4. Run validation before committing")

if __name__ == '__main__':
    main()
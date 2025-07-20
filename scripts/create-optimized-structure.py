#!/usr/bin/env python3
"""
Create optimized documentation structure from YAML definition
"""

import yaml
import os
from pathlib import Path

def create_structure(yaml_file: str, docs_root: str):
    """Create directory structure from YAML definition"""
    
    # Load structure
    with open(yaml_file, 'r') as f:
        config = yaml.safe_load(f)
    
    created_dirs = []
    
    # Create directories
    for shelf_config in config['structure']:
        shelf = shelf_config['shelf']
        shelf_slug = shelf['slug']
        
        for book_config in shelf.get('books', []):
            book = book_config['book']
            book_slug = book['slug']
            
            for chapter_config in book.get('chapters', []):
                chapter = chapter_config['chapter']
                chapter_slug = chapter['slug']
                
                # Create chapter directory
                dir_path = Path(docs_root) / shelf_slug / book_slug / chapter_slug
                dir_path.mkdir(parents=True, exist_ok=True)
                created_dirs.append(str(dir_path))
                
                # Create README.md for the chapter
                readme_path = dir_path / "README.md"
                if not readme_path.exists():
                    readme_content = f"""# {chapter['name']}

This chapter contains documentation about {chapter['name'].lower()}.

## Pages in this chapter:
"""
                    for page in chapter.get('pages', []):
                        readme_content += f"- [{page}](./{page}.md)\n"
                    
                    readme_path.write_text(readme_content)
    
    print(f"Created {len(created_dirs)} directories")
    return created_dirs

if __name__ == "__main__":
    import sys
    yaml_file = sys.argv[1] if len(sys.argv) > 1 else "docs/bookstack/bookstack-structure-optimized.yaml"
    docs_root = sys.argv[2] if len(sys.argv) > 2 else "docs"
    
    dirs = create_structure(yaml_file, docs_root)
    print("\nCreated directories:")
    for d in sorted(dirs):
        print(f"  {d}")
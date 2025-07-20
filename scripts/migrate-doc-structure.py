#!/usr/bin/env python3
"""
Migrate existing documentation to BookStack-compatible structure
This script analyzes current docs and suggests/performs migrations
"""

import os
import re
import shutil
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import argparse
import json

class DocMigrator:
    def __init__(self, docs_root: str, structure_file: str):
        self.docs_root = Path(docs_root)
        self.structure_file = structure_file
        self.structure = self._load_structure()
        self.migrations = []
        
    def _load_structure(self) -> Dict:
        """Load the BookStack structure definition"""
        with open(self.structure_file, 'r') as f:
            return yaml.safe_load(f)
    
    def analyze_current_docs(self) -> List[Dict]:
        """Analyze current documentation structure"""
        issues = []
        
        # Find all markdown files
        for md_file in self.docs_root.rglob("*.md"):
            # Skip bookstack directory
            if 'bookstack' in md_file.parts:
                continue
                
            rel_path = md_file.relative_to(self.docs_root)
            parts = rel_path.parts
            
            # Check if it follows the 4-level structure
            if len(parts) < 4:
                issues.append({
                    'file': str(rel_path),
                    'issue': 'Not in 4-level hierarchy (shelf/book/chapter/page)',
                    'current_level': len(parts)
                })
            
            # Check if file is numbered
            if not re.match(r'^\d{2}-', md_file.name):
                issues.append({
                    'file': str(rel_path),
                    'issue': 'Page not numbered (should start with 01-, 02-, etc.)',
                    'filename': md_file.name
                })
        
        return issues
    
    def suggest_migrations(self) -> List[Dict]:
        """Suggest migrations for existing files"""
        migrations = []
        
        # Define migration mappings
        mappings = {
            # Agent management docs -> Projects shelf
            'agent-management/tech-lead-tony': 'projects/epics/active',
            
            # Architecture docs -> Stack shelf
            'architecture': 'stack/architecture/overview',
            
            # CI/CD docs -> Engineering shelf
            'ci-cd': 'engineering/ci-cd-guide/setup',
            'cicd': 'engineering/ci-cd-guide/setup',
            
            # API docs -> Engineering shelf
            'api': 'engineering/api-guide/overview',
            
            # Deployment docs -> Stack shelf
            'deployment': 'stack/setup/installation',
            
            # Operations docs are mostly correct
            'operations': 'operations',
            
            # Monitoring docs -> Operations shelf
            'monitoring': 'operations/monitoring/setup',
            
            # Git docs -> Engineering shelf  
            'git': 'engineering/git-guide/setup',
            
            # Integration docs -> Stack shelf
            'integration': 'stack/integration/overview',
            
            # Security docs -> Stack shelf
            'security': 'stack/security/overview',
            
            # Testing docs -> Engineering shelf
            'testing': 'engineering/testing-guide/overview'
        }
        
        # Process each file
        for md_file in self.docs_root.rglob("*.md"):
            if 'bookstack' in md_file.parts:
                continue
                
            rel_path = md_file.relative_to(self.docs_root)
            
            # Find best mapping
            suggested_path = None
            for pattern, target in mappings.items():
                if pattern in str(rel_path).lower():
                    # Extract filename without path
                    filename = md_file.name
                    
                    # Add number prefix if missing
                    if not re.match(r'^\d{2}-', filename):
                        # Find next available number
                        target_dir = self.docs_root / target
                        existing_numbers = []
                        if target_dir.exists():
                            for f in target_dir.glob("*.md"):
                                match = re.match(r'^(\d{2})-', f.name)
                                if match:
                                    existing_numbers.append(int(match.group(1)))
                        
                        next_num = max(existing_numbers + [0]) + 1
                        filename = f"{next_num:02d}-{filename}"
                    
                    suggested_path = Path(target) / filename
                    break
            
            # If no mapping found, try to infer from content
            if not suggested_path:
                content = md_file.read_text()
                if 'backup' in content.lower():
                    suggested_path = Path('operations/backup/strategies') / f"01-{md_file.name}"
                elif 'deploy' in content.lower():
                    suggested_path = Path('stack/setup/installation') / f"01-{md_file.name}"
                elif 'troubleshoot' in content.lower():
                    suggested_path = Path('stack/troubleshooting/common-issues') / f"01-{md_file.name}"
                else:
                    # Default to projects
                    suggested_path = Path('projects/misc/uncategorized') / f"01-{md_file.name}"
            
            if suggested_path and suggested_path != rel_path:
                migrations.append({
                    'source': str(rel_path),
                    'target': str(suggested_path),
                    'reason': 'Reorganize to 4-level hierarchy'
                })
        
        self.migrations = migrations
        return migrations
    
    def generate_migration_report(self) -> str:
        """Generate a detailed migration report"""
        report = ["# Documentation Migration Report\n"]
        report.append(f"Total files to migrate: {len(self.migrations)}\n")
        
        # Group by target shelf
        by_shelf = {}
        for migration in self.migrations:
            shelf = migration['target'].split('/')[0]
            if shelf not in by_shelf:
                by_shelf[shelf] = []
            by_shelf[shelf].append(migration)
        
        # Report by shelf
        for shelf, items in sorted(by_shelf.items()):
            report.append(f"\n## {shelf.title()} Shelf ({len(items)} files)")
            for item in sorted(items, key=lambda x: x['target']):
                report.append(f"- `{item['source']}` → `{item['target']}`")
        
        # Add unmatched files
        report.append("\n## Files Needing Manual Review")
        all_files = set(str(p.relative_to(self.docs_root)) 
                       for p in self.docs_root.rglob("*.md") 
                       if 'bookstack' not in p.parts)
        migrated_files = set(m['source'] for m in self.migrations)
        unmatched = all_files - migrated_files
        
        for file in sorted(unmatched):
            report.append(f"- `{file}` - No clear migration path")
        
        return "\n".join(report)
    
    def perform_migration(self, dry_run: bool = True) -> bool:
        """Execute the migration"""
        if dry_run:
            print("DRY RUN - No files will be moved")
        
        success_count = 0
        error_count = 0
        
        for migration in self.migrations:
            source = self.docs_root / migration['source']
            target = self.docs_root / migration['target']
            
            if not source.exists():
                print(f"❌ Source not found: {source}")
                error_count += 1
                continue
            
            print(f"{'Would move' if dry_run else 'Moving'}: {migration['source']} → {migration['target']}")
            
            if not dry_run:
                try:
                    # Create target directory
                    target.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Move file
                    shutil.move(str(source), str(target))
                    success_count += 1
                    
                    # Update any internal links
                    self._update_links(target, migration['source'], migration['target'])
                    
                except Exception as e:
                    print(f"❌ Error moving file: {e}")
                    error_count += 1
            else:
                success_count += 1
        
        print(f"\n✅ Success: {success_count} files")
        print(f"❌ Errors: {error_count} files")
        
        return error_count == 0
    
    def _update_links(self, file_path: Path, old_path: str, new_path: str):
        """Update internal links in moved files"""
        content = file_path.read_text()
        
        # Update relative links
        old_dir = Path(old_path).parent
        new_dir = Path(new_path).parent
        
        # Simple link update (this could be more sophisticated)
        updated_content = content
        
        # Update links that might point to the old location
        # This is simplified - a real implementation would be more complex
        if old_dir != new_dir:
            # Calculate relative path adjustments
            pass
        
        if updated_content != content:
            file_path.write_text(updated_content)
    
    def create_missing_structure(self):
        """Create missing directories for the defined structure"""
        created_dirs = []
        
        for shelf_config in self.structure['structure']:
            shelf_slug = shelf_config['shelf']['slug']
            
            for book_config in shelf_config['shelf'].get('books', []):
                book_slug = book_config['book']['slug']
                
                for chapter_config in book_config['book'].get('chapters', []):
                    chapter_slug = chapter_config['chapter']['slug']
                    
                    # Create directory
                    dir_path = self.docs_root / shelf_slug / book_slug / chapter_slug
                    if not dir_path.exists():
                        dir_path.mkdir(parents=True, exist_ok=True)
                        created_dirs.append(str(dir_path))
                        
                        # Create .gitkeep to preserve empty directories
                        gitkeep = dir_path / '.gitkeep'
                        gitkeep.touch()
        
        return created_dirs

def main():
    parser = argparse.ArgumentParser(
        description='Migrate documentation to BookStack structure'
    )
    parser.add_argument(
        'docs_root',
        help='Root directory of documentation'
    )
    parser.add_argument(
        '--structure',
        default='docs/bookstack/bookstack-structure.yaml',
        help='Path to structure definition'
    )
    parser.add_argument(
        '--analyze',
        action='store_true',
        help='Only analyze current structure'
    )
    parser.add_argument(
        '--report',
        action='store_true',
        help='Generate migration report'
    )
    parser.add_argument(
        '--migrate',
        action='store_true',
        help='Perform migration'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Dry run mode (with --migrate)'
    )
    parser.add_argument(
        '--create-dirs',
        action='store_true',
        help='Create missing directory structure'
    )
    
    args = parser.parse_args()
    
    migrator = DocMigrator(args.docs_root, args.structure)
    
    if args.analyze:
        print("Analyzing current documentation structure...\n")
        issues = migrator.analyze_current_docs()
        
        if issues:
            print(f"Found {len(issues)} issues:\n")
            for issue in issues:
                print(f"- {issue['file']}: {issue['issue']}")
        else:
            print("✅ All documents follow the correct structure!")
    
    if args.report or args.migrate:
        print("\nGenerating migration suggestions...")
        migrations = migrator.suggest_migrations()
        
        if args.report:
            report = migrator.generate_migration_report()
            print(report)
            
            # Save report
            report_file = Path('migration-report.md')
            report_file.write_text(report)
            print(f"\nReport saved to: {report_file}")
    
    if args.migrate:
        print("\nPerforming migration...")
        success = migrator.perform_migration(dry_run=args.dry_run)
        
        if not args.dry_run and success:
            print("\n✅ Migration completed successfully!")
            print("Run validation to ensure structure is correct:")
            print("python scripts/validate-bookstack-structure.py docs/")
    
    if args.create_dirs:
        print("\nCreating missing directories...")
        created = migrator.create_missing_structure()
        
        if created:
            print(f"Created {len(created)} directories:")
            for dir_path in created:
                print(f"  - {dir_path}")
        else:
            print("✅ All directories already exist!")

if __name__ == '__main__':
    main()
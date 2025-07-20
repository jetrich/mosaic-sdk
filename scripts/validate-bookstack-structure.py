#!/usr/bin/env python3
"""
BookStack Structure Validator
Validates documentation structure against bookstack-structure.yaml
Part of Epic E.058: BookStack Documentation Structure Implementation
"""

import os
import sys
import yaml
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from datetime import datetime

# ANSI color codes
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

@dataclass
class ValidationError:
    """Represents a validation error"""
    severity: str  # error, warning, info
    rule: str
    path: str
    message: str
    line: int = 0

class BookStackStructureValidator:
    """Validates documentation structure against defined schema"""
    
    def __init__(self, structure_file: str, docs_root: str):
        self.structure_file = structure_file
        self.docs_root = Path(docs_root)
        self.structure = None
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []
        self.slug_registry: Dict[str, str] = {}
        
    def load_structure(self) -> bool:
        """Load the structure definition from YAML"""
        try:
            with open(self.structure_file, 'r') as f:
                self.structure = yaml.safe_load(f)
            print(f"{Colors.GREEN}✓ Loaded structure definition from {self.structure_file}{Colors.RESET}")
            return True
        except Exception as e:
            print(f"{Colors.RED}✗ Failed to load structure: {e}{Colors.RESET}")
            return False
    
    def validate(self) -> bool:
        """Main validation entry point"""
        if not self.load_structure():
            return False
        
        print(f"\n{Colors.CYAN}Starting BookStack structure validation...{Colors.RESET}")
        print(f"Documentation root: {self.docs_root}")
        print(f"Structure version: {self.structure.get('version', 'unknown')}")
        
        # Run all validation checks
        self._validate_structure_definition()
        self._validate_filesystem_structure()
        self._validate_naming_conventions()
        self._validate_frontmatter()
        self._validate_unique_slugs()
        self._check_orphaned_files()
        
        # Report results
        return self._report_results()
    
    def _validate_structure_definition(self):
        """Validate the structure definition itself"""
        print(f"\n{Colors.BLUE}Validating structure definition...{Colors.RESET}")
        
        if 'structure' not in self.structure:
            self._add_error('structure_definition', '', 'Missing structure definition')
            return
        
        for shelf in self.structure['structure']:
            if 'shelf' not in shelf:
                self._add_error('structure_definition', '', 'Invalid shelf definition')
                continue
                
            shelf_data = shelf['shelf']
            self._validate_shelf(shelf_data)
    
    def _validate_shelf(self, shelf: Dict[str, Any]):
        """Validate a shelf definition"""
        required = ['name', 'slug', 'books']
        for field in required:
            if field not in shelf:
                self._add_error('missing_field', shelf.get('name', 'unknown'), 
                              f"Shelf missing required field: {field}")
        
        if 'books' in shelf:
            for book in shelf['books']:
                if 'book' in book:
                    self._validate_book(book['book'], shelf['slug'])
    
    def _validate_book(self, book: Dict[str, Any], shelf_slug: str):
        """Validate a book definition"""
        required = ['name', 'slug', 'chapters']
        for field in required:
            if field not in book:
                self._add_error('missing_field', f"{shelf_slug}/{book.get('name', 'unknown')}", 
                              f"Book missing required field: {field}")
        
        if 'chapters' in book:
            for chapter in book['chapters']:
                if 'chapter' in chapter:
                    self._validate_chapter(chapter['chapter'], shelf_slug, book['slug'])
    
    def _validate_chapter(self, chapter: Dict[str, Any], shelf_slug: str, book_slug: str):
        """Validate a chapter definition"""
        required = ['name', 'slug', 'pages']
        path = f"{shelf_slug}/{book_slug}/{chapter.get('name', 'unknown')}"
        
        for field in required:
            if field not in chapter:
                self._add_error('missing_field', path, f"Chapter missing required field: {field}")
        
        if 'pages' in chapter and len(chapter['pages']) == 0:
            self._add_error('required_pages', path, "Chapter must have at least one page")
    
    def _validate_filesystem_structure(self):
        """Validate that filesystem matches the defined structure"""
        print(f"\n{Colors.BLUE}Validating filesystem structure...{Colors.RESET}")
        
        for shelf in self.structure['structure']:
            shelf_data = shelf['shelf']
            shelf_path = self.docs_root / shelf_data['slug']
            
            if not shelf_path.exists():
                self._add_warning('missing_directory', str(shelf_path), 
                                 f"Shelf directory not found: {shelf_data['name']}")
                continue
            
            for book in shelf_data.get('books', []):
                book_data = book['book']
                book_path = shelf_path / book_data['slug']
                
                if not book_path.exists():
                    self._add_warning('missing_directory', str(book_path), 
                                     f"Book directory not found: {book_data['name']}")
                    continue
                
                for chapter in book_data.get('chapters', []):
                    chapter_data = chapter['chapter']
                    chapter_path = book_path / chapter_data['slug']
                    
                    if not chapter_path.exists():
                        self._add_warning('missing_directory', str(chapter_path), 
                                         f"Chapter directory not found: {chapter_data['name']}")
                        continue
                    
                    # Check for required pages
                    for page_slug in chapter_data.get('pages', []):
                        page_file = chapter_path / f"{page_slug}.md"
                        if not page_file.exists():
                            self._add_warning('missing_page', str(page_file), 
                                            f"Page file not found: {page_slug}")
    
    def _validate_naming_conventions(self):
        """Validate naming conventions"""
        print(f"\n{Colors.BLUE}Validating naming conventions...{Colors.RESET}")
        
        conventions = self.structure.get('conventions', {})
        
        # Check page naming convention (00-kebab-case)
        page_pattern = re.compile(r'^\d{2}-[a-z]+(-[a-z]+)*$')
        
        for md_file in self.docs_root.rglob('*.md'):
            rel_path = md_file.relative_to(self.docs_root)
            parts = rel_path.parts
            
            # Skip files in root or special directories
            if len(parts) < 4:  # shelf/book/chapter/page.md
                continue
            
            page_name = md_file.stem
            if not page_pattern.match(page_name):
                self._add_error('naming_convention', str(md_file), 
                              f"Page name '{page_name}' doesn't match pattern '00-kebab-case'")
    
    def _validate_frontmatter(self):
        """Validate that all markdown files have required frontmatter"""
        print(f"\n{Colors.BLUE}Validating frontmatter...{Colors.RESET}")
        
        required_fields = ['title', 'order', 'category', 'tags', 'last_updated', 'author']
        
        for md_file in self.docs_root.rglob('*.md'):
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for frontmatter
                if not content.startswith('---'):
                    self._add_error('frontmatter_required', str(md_file), 
                                  "Missing frontmatter section")
                    continue
                
                # Extract frontmatter
                parts = content.split('---', 2)
                if len(parts) < 3:
                    self._add_error('frontmatter_required', str(md_file), 
                                  "Invalid frontmatter format")
                    continue
                
                try:
                    frontmatter = yaml.safe_load(parts[1])
                    if not frontmatter:
                        self._add_error('frontmatter_required', str(md_file), 
                                      "Empty frontmatter")
                        continue
                    
                    # Check required fields
                    for field in required_fields:
                        if field not in frontmatter:
                            self._add_error('frontmatter_field', str(md_file), 
                                          f"Missing required frontmatter field: {field}")
                    
                    # Validate date format
                    if 'last_updated' in frontmatter:
                        try:
                            datetime.strptime(str(frontmatter['last_updated']), '%Y-%m-%d')
                        except:
                            self._add_error('frontmatter_format', str(md_file), 
                                          "Invalid date format for last_updated (use YYYY-MM-DD)")
                    
                except yaml.YAMLError as e:
                    self._add_error('frontmatter_parse', str(md_file), 
                                  f"Failed to parse frontmatter: {e}")
                    
            except Exception as e:
                self._add_error('file_read', str(md_file), f"Failed to read file: {e}")
    
    def _validate_unique_slugs(self):
        """Validate that all slugs are unique within their scope"""
        print(f"\n{Colors.BLUE}Validating unique slugs...{Colors.RESET}")
        
        # Build slug registry
        for shelf in self.structure['structure']:
            shelf_data = shelf['shelf']
            shelf_slug = shelf_data['slug']
            
            # Check shelf-level uniqueness
            if shelf_slug in self.slug_registry:
                self._add_error('unique_slugs', shelf_slug, 
                              f"Duplicate shelf slug: {shelf_slug}")
            self.slug_registry[shelf_slug] = 'shelf'
            
            book_slugs = set()
            for book in shelf_data.get('books', []):
                book_data = book['book']
                book_slug = book_data['slug']
                
                if book_slug in book_slugs:
                    self._add_error('unique_slugs', f"{shelf_slug}/{book_slug}", 
                                  f"Duplicate book slug within shelf: {book_slug}")
                book_slugs.add(book_slug)
                
                chapter_slugs = set()
                for chapter in book_data.get('chapters', []):
                    chapter_data = chapter['chapter']
                    chapter_slug = chapter_data['slug']
                    
                    if chapter_slug in chapter_slugs:
                        self._add_error('unique_slugs', 
                                      f"{shelf_slug}/{book_slug}/{chapter_slug}", 
                                      f"Duplicate chapter slug within book: {chapter_slug}")
                    chapter_slugs.add(chapter_slug)
    
    def _check_orphaned_files(self):
        """Check for files that don't match the structure"""
        print(f"\n{Colors.BLUE}Checking for orphaned files...{Colors.RESET}")
        
        # Build set of expected paths
        expected_paths = set()
        for shelf in self.structure['structure']:
            shelf_data = shelf['shelf']
            for book in shelf_data.get('books', []):
                book_data = book['book']
                for chapter in book_data.get('chapters', []):
                    chapter_data = chapter['chapter']
                    for page_slug in chapter_data.get('pages', []):
                        path = Path(shelf_data['slug']) / book_data['slug'] / \
                               chapter_data['slug'] / f"{page_slug}.md"
                        expected_paths.add(path)
        
        # Check all markdown files
        for md_file in self.docs_root.rglob('*.md'):
            rel_path = md_file.relative_to(self.docs_root)
            
            # Skip special directories
            if any(part.startswith('.') for part in rel_path.parts):
                continue
            if any(part in ['drafts', 'archive'] for part in rel_path.parts):
                continue
            
            if rel_path not in expected_paths:
                self._add_warning('orphaned_file', str(md_file), 
                                "File not defined in structure")
    
    def _add_error(self, rule: str, path: str, message: str):
        """Add a validation error"""
        self.errors.append(ValidationError('error', rule, path, message))
    
    def _add_warning(self, rule: str, path: str, message: str):
        """Add a validation warning"""
        self.warnings.append(ValidationError('warning', rule, path, message))
    
    def _report_results(self) -> bool:
        """Report validation results"""
        print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Validation Results{Colors.RESET}")
        print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")
        
        if not self.errors and not self.warnings:
            print(f"\n{Colors.GREEN}✓ All validation checks passed!{Colors.RESET}")
            return True
        
        # Report errors
        if self.errors:
            print(f"\n{Colors.RED}Errors ({len(self.errors)}):{Colors.RESET}")
            for error in self.errors:
                print(f"  {Colors.RED}✗ [{error.rule}] {error.path}{Colors.RESET}")
                print(f"    {error.message}")
        
        # Report warnings
        if self.warnings:
            print(f"\n{Colors.YELLOW}Warnings ({len(self.warnings)}):{Colors.RESET}")
            for warning in self.warnings:
                print(f"  {Colors.YELLOW}⚠ [{warning.rule}] {warning.path}{Colors.RESET}")
                print(f"    {warning.message}")
        
        # Summary
        print(f"\n{Colors.CYAN}Summary:{Colors.RESET}")
        print(f"  Errors: {len(self.errors)}")
        print(f"  Warnings: {len(self.warnings)}")
        
        # Generate report file
        self._generate_report()
        
        return len(self.errors) == 0
    
    def _generate_report(self):
        """Generate a detailed validation report"""
        report_path = Path('validation-report.json')
        report = {
            'timestamp': datetime.now().isoformat(),
            'structure_file': self.structure_file,
            'docs_root': str(self.docs_root),
            'version': self.structure.get('version', 'unknown'),
            'summary': {
                'errors': len(self.errors),
                'warnings': len(self.warnings),
                'passed': len(self.errors) == 0
            },
            'errors': [
                {
                    'severity': e.severity,
                    'rule': e.rule,
                    'path': e.path,
                    'message': e.message
                } for e in self.errors
            ],
            'warnings': [
                {
                    'severity': w.severity,
                    'rule': w.rule,
                    'path': w.path,
                    'message': w.message
                } for w in self.warnings
            ]
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_path}")

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Usage: {sys.argv[0]} <docs_root> [structure_file]{Colors.RESET}")
        print(f"  docs_root: Path to documentation root directory")
        print(f"  structure_file: Path to bookstack-structure.yaml (optional)")
        sys.exit(1)
    
    docs_root = sys.argv[1]
    structure_file = sys.argv[2] if len(sys.argv) > 2 else 'docs/bookstack/bookstack-structure-optimized.yaml'
    
    # Validate paths exist
    if not os.path.exists(docs_root):
        print(f"{Colors.RED}Error: Documentation root not found: {docs_root}{Colors.RESET}")
        sys.exit(1)
    
    if not os.path.exists(structure_file):
        print(f"{Colors.RED}Error: Structure file not found: {structure_file}{Colors.RESET}")
        sys.exit(1)
    
    # Run validation
    validator = BookStackStructureValidator(structure_file, docs_root)
    success = validator.validate()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
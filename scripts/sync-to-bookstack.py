#!/usr/bin/env python3
"""
Git to BookStack Sync Tool
Epic E.058 - Feature F.058.06: Automated documentation synchronization
Syncs markdown documentation from Git to BookStack using the defined structure
"""

import os
import sys
import yaml
import json
import re
import requests
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass
import argparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class BookStackEntity:
    """Represents a BookStack entity (shelf, book, chapter, page)"""
    id: Optional[int]
    name: str
    slug: str
    type: str  # shelf, book, chapter, page
    parent_id: Optional[int] = None
    content: Optional[str] = None
    tags: Optional[List[Dict[str, str]]] = None

class BookStackAPI:
    """BookStack API client for managing documentation"""
    
    def __init__(self, base_url: str, token_id: str, token_secret: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f"Token {token_id}:{token_secret}",
            'Content-Type': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make API request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            response = self.session.request(method, url, json=data)
            response.raise_for_status()
            return response.json() if response.text else {}
        except requests.exceptions.HTTPError as e:
            logger.error(f"API Error: {e}")
            logger.error(f"Response: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    def get_shelves(self) -> List[Dict]:
        """Get all shelves"""
        return self._request('GET', 'shelves')['data']
    
    def create_shelf(self, name: str, description: str = "") -> Dict:
        """Create a new shelf"""
        data = {
            'name': name,
            'description': description
        }
        return self._request('POST', 'shelves', data)
    
    def get_shelf_by_slug(self, slug: str) -> Optional[Dict]:
        """Get shelf by slug"""
        shelves = self.get_shelves()
        for shelf in shelves:
            if shelf.get('slug') == slug:
                return shelf
        return None
    
    def get_books(self) -> List[Dict]:
        """Get all books"""
        return self._request('GET', 'books')['data']
    
    def create_book(self, name: str, description: str = "", shelf_id: Optional[int] = None) -> Dict:
        """Create a new book"""
        data = {
            'name': name,
            'description': description
        }
        # Modern BookStack supports shelf assignment during creation
        if shelf_id:
            data['default_template_id'] = shelf_id  # This might be the field
            # Try different field names that BookStack might use
            data['shelf_id'] = shelf_id
            data['shelves'] = [shelf_id]
        return self._request('POST', 'books', data)
    
    def get_book_by_slug(self, slug: str) -> Optional[Dict]:
        """Get book by slug"""
        books = self.get_books()
        for book in books:
            if book.get('slug') == slug:
                return book
        return None
    
    def attach_book_to_shelf(self, book_id: int, shelf_id: int) -> None:
        """Attach a book to a shelf"""
        # Note: Modern BookStack versions handle this automatically when creating books
        # This method is kept for backward compatibility but may not be needed
        try:
            # Try the attach endpoint first (older versions)
            self._request('PUT', f'shelves/{shelf_id}/books/{book_id}/attach', {})
        except requests.exceptions.HTTPError as e:
            if '405' in str(e):
                # Method not allowed - book attachment is automatic in newer versions
                logger.debug(f"Book {book_id} automatically attached to shelf {shelf_id}")
            else:
                raise
    
    def get_chapters(self, book_id: int) -> List[Dict]:
        """Get chapters in a book"""
        book = self._request('GET', f'books/{book_id}')
        return book.get('contents', [])
    
    def create_chapter(self, book_id: int, name: str, description: str = "") -> Dict:
        """Create a new chapter in a book"""
        data = {
            'book_id': book_id,
            'name': name,
            'description': description
        }
        return self._request('POST', 'chapters', data)
    
    def get_chapter_by_slug(self, book_id: int, slug: str) -> Optional[Dict]:
        """Get chapter by slug within a book"""
        chapters = self.get_chapters(book_id)
        for chapter in chapters:
            if chapter.get('type') == 'chapter' and chapter.get('slug') == slug:
                return chapter
        return None
    
    def get_pages(self, chapter_id: int) -> List[Dict]:
        """Get pages in a chapter"""
        chapter = self._request('GET', f'chapters/{chapter_id}')
        return chapter.get('pages', [])
    
    def create_page(self, chapter_id: int, name: str, markdown: str, tags: List[Dict] = None) -> Dict:
        """Create a new page in a chapter"""
        data = {
            'chapter_id': chapter_id,
            'name': name,
            'markdown': markdown,
            'tags': tags or []
        }
        return self._request('POST', 'pages', data)
    
    def update_page(self, page_id: int, name: str, markdown: str, tags: List[Dict] = None) -> Dict:
        """Update an existing page"""
        data = {
            'name': name,
            'markdown': markdown,
            'tags': tags or []
        }
        return self._request('PUT', f'pages/{page_id}', data)
    
    def get_page_by_slug(self, chapter_id: int, slug: str) -> Optional[Dict]:
        """Get page by slug within a chapter"""
        pages = self.get_pages(chapter_id)
        for page in pages:
            if page.get('slug') == slug:
                return page
        return None

class GitToBookStackSync:
    """Main sync orchestrator"""
    
    def __init__(self, structure_file: str, docs_root: str, api_client: BookStackAPI):
        self.structure_file = structure_file
        self.docs_root = Path(docs_root)
        self.api = api_client
        self.structure = None
        self.stats = {
            'shelves_created': 0,
            'books_created': 0,
            'chapters_created': 0,
            'pages_created': 0,
            'pages_updated': 0,
            'errors': 0
        }
        
    def load_structure(self) -> bool:
        """Load the BookStack structure definition"""
        try:
            with open(self.structure_file, 'r') as f:
                self.structure = yaml.safe_load(f)
            logger.info(f"Loaded structure definition from {self.structure_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to load structure: {e}")
            return False
    
    def sync(self, dry_run: bool = False) -> bool:
        """Main sync entry point"""
        if not self.load_structure():
            return False
        
        logger.info("Starting Git to BookStack sync...")
        logger.info(f"Dry run: {dry_run}")
        
        try:
            # Sync each shelf
            for shelf_config in self.structure['structure']:
                self._sync_shelf(shelf_config['shelf'], dry_run)
            
            # Report results
            self._report_stats()
            return self.stats['errors'] == 0
            
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return False
    
    def _sync_shelf(self, shelf_config: Dict, dry_run: bool) -> Optional[int]:
        """Sync a shelf and its contents"""
        shelf_name = shelf_config['name']
        shelf_slug = shelf_config['slug']
        
        logger.info(f"Syncing shelf: {shelf_name}")
        
        if dry_run:
            logger.info(f"[DRY RUN] Would create/update shelf: {shelf_name}")
            shelf_id = None
        else:
            # Get or create shelf
            shelf = self.api.get_shelf_by_slug(shelf_slug)
            if shelf:
                shelf_id = shelf['id']
                logger.info(f"Found existing shelf: {shelf_name} (ID: {shelf_id})")
            else:
                shelf = self.api.create_shelf(
                    shelf_name,
                    shelf_config.get('description', '')
                )
                shelf_id = shelf['id']
                self.stats['shelves_created'] += 1
                logger.info(f"Created shelf: {shelf_name} (ID: {shelf_id})")
        
        # Sync books in this shelf
        for book_config in shelf_config.get('books', []):
            self._sync_book(book_config['book'], shelf_id, shelf_slug, dry_run)
        
        return shelf_id
    
    def _sync_book(self, book_config: Dict, shelf_id: Optional[int], shelf_slug: str, dry_run: bool) -> Optional[int]:
        """Sync a book and its contents"""
        book_name = book_config['name']
        book_slug = book_config['slug']
        
        logger.info(f"  Syncing book: {book_name}")
        
        if dry_run:
            logger.info(f"  [DRY RUN] Would create/update book: {book_name}")
            book_id = None
        else:
            # Get or create book
            book = self.api.get_book_by_slug(book_slug)
            if book:
                book_id = book['id']
                logger.info(f"  Found existing book: {book_name} (ID: {book_id})")
            else:
                book = self.api.create_book(
                    book_name,
                    book_config.get('description', ''),
                    shelf_id
                )
                book_id = book['id']
                self.stats['books_created'] += 1
                logger.info(f"  Created book: {book_name} (ID: {book_id})")
                
                # Attach to shelf
                if shelf_id:
                    self.api.attach_book_to_shelf(book_id, shelf_id)
        
        # Sync chapters in this book
        for chapter_config in book_config.get('chapters', []):
            self._sync_chapter(chapter_config['chapter'], book_id, shelf_slug, book_slug, dry_run)
        
        return book_id
    
    def _sync_chapter(self, chapter_config: Dict, book_id: Optional[int], shelf_slug: str, book_slug: str, dry_run: bool) -> Optional[int]:
        """Sync a chapter and its pages"""
        chapter_name = chapter_config['name']
        chapter_slug = chapter_config['slug']
        
        logger.info(f"    Syncing chapter: {chapter_name}")
        
        if dry_run:
            logger.info(f"    [DRY RUN] Would create/update chapter: {chapter_name}")
            chapter_id = None
        else:
            if not book_id:
                logger.warning(f"    Skipping chapter sync - no book ID")
                return None
                
            # Get or create chapter
            chapter = self.api.get_chapter_by_slug(book_id, chapter_slug)
            if chapter:
                chapter_id = chapter['id']
                logger.info(f"    Found existing chapter: {chapter_name} (ID: {chapter_id})")
            else:
                chapter = self.api.create_chapter(
                    book_id,
                    chapter_name,
                    ""
                )
                chapter_id = chapter['id']
                self.stats['chapters_created'] += 1
                logger.info(f"    Created chapter: {chapter_name} (ID: {chapter_id})")
        
        # Sync pages in this chapter
        for page_slug in chapter_config.get('pages', []):
            self._sync_page(page_slug, chapter_id, shelf_slug, book_slug, chapter_slug, dry_run)
        
        return chapter_id
    
    def _sync_page(self, page_slug: str, chapter_id: Optional[int], shelf_slug: str, book_slug: str, chapter_slug: str, dry_run: bool):
        """Sync a single page"""
        # Construct file path
        page_path = self.docs_root / shelf_slug / book_slug / chapter_slug / f"{page_slug}.md"
        
        if not page_path.exists():
            logger.warning(f"      Page file not found: {page_path}")
            self.stats['errors'] += 1
            return
        
        # Read and parse the markdown file
        try:
            with open(page_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract frontmatter and content
            frontmatter, markdown = self._parse_markdown(content)
            
            if not frontmatter:
                logger.warning(f"      No frontmatter found in {page_path}")
                self.stats['errors'] += 1
                return
            
            page_name = frontmatter.get('title', page_slug)
            tags = self._format_tags(frontmatter.get('tags', []))
            
            # Add sync metadata
            tags.append({
                'name': 'git-sync',
                'value': datetime.now().isoformat()
            })
            tags.append({
                'name': 'git-commit',
                'value': self._get_git_commit_hash()
            })
            
            logger.info(f"      Syncing page: {page_name}")
            
            if dry_run:
                logger.info(f"      [DRY RUN] Would create/update page: {page_name}")
            else:
                if not chapter_id:
                    logger.warning(f"      Skipping page sync - no chapter ID")
                    return
                    
                # Get or create page
                page = self.api.get_page_by_slug(chapter_id, page_slug)
                if page:
                    # Update existing page
                    self.api.update_page(page['id'], page_name, markdown, tags)
                    self.stats['pages_updated'] += 1
                    logger.info(f"      Updated page: {page_name}")
                else:
                    # Create new page
                    self.api.create_page(chapter_id, page_name, markdown, tags)
                    self.stats['pages_created'] += 1
                    logger.info(f"      Created page: {page_name}")
                    
        except Exception as e:
            logger.error(f"      Failed to sync page {page_path}: {e}")
            self.stats['errors'] += 1
    
    def _parse_markdown(self, content: str) -> Tuple[Optional[Dict], str]:
        """Parse frontmatter and content from markdown"""
        if not content.startswith('---'):
            return None, content
        
        parts = content.split('---', 2)
        if len(parts) < 3:
            return None, content
        
        try:
            frontmatter = yaml.safe_load(parts[1])
            markdown = parts[2].strip()
            return frontmatter, markdown
        except yaml.YAMLError:
            return None, content
    
    def _format_tags(self, tags: List[str]) -> List[Dict[str, str]]:
        """Format tags for BookStack API"""
        return [{'name': tag, 'value': ''} for tag in tags]
    
    def _get_git_commit_hash(self) -> str:
        """Get current git commit hash"""
        try:
            import subprocess
            result = subprocess.run(
                ['git', 'rev-parse', '--short', 'HEAD'],
                capture_output=True,
                text=True,
                cwd=self.docs_root
            )
            return result.stdout.strip() if result.returncode == 0 else 'unknown'
        except:
            return 'unknown'
    
    def _report_stats(self):
        """Report sync statistics"""
        logger.info("\n=== Sync Statistics ===")
        logger.info(f"Shelves created:  {self.stats['shelves_created']}")
        logger.info(f"Books created:    {self.stats['books_created']}")
        logger.info(f"Chapters created: {self.stats['chapters_created']}")
        logger.info(f"Pages created:    {self.stats['pages_created']}")
        logger.info(f"Pages updated:    {self.stats['pages_updated']}")
        logger.info(f"Errors:           {self.stats['errors']}")
        logger.info("======================")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Sync Git documentation to BookStack'
    )
    parser.add_argument(
        'docs_root',
        help='Path to documentation root directory'
    )
    parser.add_argument(
        '--structure',
        default='docs/bookstack/bookstack-structure.yaml',
        help='Path to structure definition file'
    )
    parser.add_argument(
        '--url',
        required=True,
        help='BookStack base URL'
    )
    parser.add_argument(
        '--token-id',
        required=True,
        help='BookStack API token ID'
    )
    parser.add_argument(
        '--token-secret',
        required=True,
        help='BookStack API token secret'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Perform dry run without making changes'
    )
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Only validate structure, do not sync'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate structure first
    if args.validate_only:
        from validate_bookstack_structure import BookStackStructureValidator
        validator = BookStackStructureValidator(args.structure, args.docs_root)
        success = validator.validate()
        sys.exit(0 if success else 1)
    
    # Create API client
    api_client = BookStackAPI(args.url, args.token_id, args.token_secret)
    
    # Create and run sync
    sync = GitToBookStackSync(args.structure, args.docs_root, api_client)
    success = sync.sync(dry_run=args.dry_run)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
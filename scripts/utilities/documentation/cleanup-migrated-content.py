#!/usr/bin/env python3
"""
Cleanup script to consolidate "Additional Content (Migrated)" sections
"""

import os
import re
from pathlib import Path

class ContentCleaner:
    def __init__(self):
        self.docs_dir = Path("docs")
        self.processed = 0
        self.cleaned_files = []
        
    def clean_file(self, file_path: Path):
        """Clean up a single file by consolidating migrated content"""
        content = file_path.read_text()
        
        # Check if file has migrated content sections
        if "## Additional Content (Migrated)" not in content:
            return False
            
        print(f"Cleaning: {file_path.relative_to(self.docs_dir)}")
        
        # Split content at first migrated section
        parts = content.split("## Additional Content (Migrated)", 1)
        if len(parts) < 2:
            return False
            
        main_content = parts[0].strip()
        migrated_sections = parts[1]
        
        # Find all migrated sections
        all_migrated = content.split("## Additional Content (Migrated)")
        migrated_content = []
        
        for i, section in enumerate(all_migrated[1:], 1):  # Skip first part (main content)
            # Clean up the section
            cleaned_section = section.strip()
            if cleaned_section and cleaned_section not in migrated_content:
                migrated_content.append(cleaned_section)
        
        # Consolidate into single section
        if migrated_content:
            consolidated = "\n\n---\n\n".join(migrated_content)
            new_content = f"{main_content}\n\n---\n\n## Additional Content (Migrated)\n\n{consolidated}"
        else:
            new_content = main_content
            
        # Remove duplicate headers and clean up formatting
        new_content = self.remove_duplicate_headers(new_content)
        
        # Write back
        file_path.write_text(new_content)
        
        self.processed += 1
        self.cleaned_files.append(str(file_path.relative_to(self.docs_dir)))
        return True
    
    def remove_duplicate_headers(self, content: str) -> str:
        """Remove duplicate headers and clean formatting"""
        lines = content.split('\n')
        seen_headers = set()
        cleaned_lines = []
        
        for line in lines:
            # Check if line is a header
            if line.startswith('#'):
                header_text = line.strip()
                if header_text in seen_headers:
                    continue  # Skip duplicate header
                seen_headers.add(header_text)
            
            cleaned_lines.append(line)
        
        # Clean up excessive whitespace
        result = '\n'.join(cleaned_lines)
        # Remove multiple consecutive empty lines
        result = re.sub(r'\n\s*\n\s*\n', '\n\n', result)
        
        return result.strip() + '\n'
    
    def run(self):
        """Run cleanup on all files with migrated content"""
        print("Starting cleanup of migrated content...")
        
        # Find all markdown files with migrated content
        for md_file in self.docs_dir.rglob("*.md"):
            if "_old" in str(md_file):
                continue
                
            self.clean_file(md_file)
        
        print(f"\nCleaned up {self.processed} files:")
        for file_path in self.cleaned_files:
            print(f"  - {file_path}")

if __name__ == "__main__":
    cleaner = ContentCleaner()
    cleaner.run()
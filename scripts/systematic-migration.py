#!/usr/bin/env python3
"""
Systematic documentation migration with progress tracking
Processes files from _old to new structure with zero data loss
"""

import os
import re
import shutil
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, Optional

class DocumentMigrator:
    def __init__(self):
        self.old_docs = Path("docs/_old")
        self.new_docs = Path("docs")
        self.moved_docs = Path("docs/_old/_moved")
        self.scratchpad = Path("docs/MIGRATION-SCRATCHPAD.md")
        self.processed = set()
        self.errors = []
        
        # Create _moved directory
        self.moved_docs.mkdir(parents=True, exist_ok=True)
        
        # Load processing state
        self.load_state()
        
    def load_state(self):
        """Load processing state from scratchpad"""
        if self.scratchpad.exists():
            content = self.scratchpad.read_text()
            # Extract processed files from log
            log_section = content.split("## Processing Log")[-1]
            for line in log_section.strip().split('\n'):
                if ' → ' in line and '[SUCCESS]' in line:
                    file_match = re.search(r'\[([^\]]+)\]', line)
                    if file_match:
                        self.processed.add(file_match.group(1))
    
    def save_state(self, file_path: str, destination: str, status: str):
        """Update scratchpad with processing status"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{file_path}] → [{destination}] [{status}]\n"
        
        # Append to scratchpad
        with open(self.scratchpad, 'a') as f:
            f.write(log_entry)
    
    def determine_destination(self, file_path: Path, content: str) -> Optional[str]:
        """Determine best destination for a file based on path and content"""
        rel_path = file_path.relative_to(self.old_docs)
        path_str = str(rel_path).lower()
        content_lower = content.lower()
        
        # Engineering Documentation
        if any(x in path_str for x in ['ci-cd', 'cicd', 'pipeline']):
            if 'template' in path_str:
                return "engineering/cicd-handbook/pipeline-setup/03-pipeline-templates.md"
            elif 'troubleshoot' in path_str:
                return "engineering/cicd-handbook/best-practices/03-troubleshooting.md"
            elif 'best' in path_str or 'practice' in path_str:
                return "engineering/cicd-handbook/best-practices/01-cicd-patterns.md"
            elif 'workflow' in path_str:
                return "engineering/cicd-handbook/advanced-pipelines/02-conditional-workflows.md"
            else:
                return "engineering/cicd-handbook/pipeline-setup/02-pipeline-basics.md"
        
        elif any(x in path_str for x in ['development', 'dev-guide']):
            if 'git' in path_str or 'workflow' in path_str:
                return "engineering/getting-started/development-workflow/01-git-workflow.md"
            elif 'branch' in path_str:
                return "engineering/getting-started/development-workflow/02-branch-protection.md"
            elif 'quick' in path_str or 'start' in path_str:
                return "engineering/getting-started/quick-start/01-first-project.md"
            elif 'isolated' in path_str or 'environment' in path_str:
                return "engineering/getting-started/quick-start/03-isolated-environment.md"
            elif 'worktree' in path_str:
                return "engineering/getting-started/development-workflow/01-git-workflow.md"
            else:
                return "engineering/getting-started/prerequisites/01-system-requirements.md"
        
        elif 'api' in path_str:
            return "engineering/api-documentation/rest-apis/01-api-overview.md"
        
        elif 'mcp' in path_str:
            if 'integration' in path_str or 'strategy' in path_str:
                return "engineering/api-documentation/mcp-protocol/02-mcp-integration.md"
            elif 'migration' in path_str or '2.7' in path_str or '2.8' in path_str:
                return "projects/migrations/version-migrations/01-tony-2.7-to-2.8.md"
            else:
                return "engineering/api-documentation/mcp-protocol/01-mcp-overview.md"
        
        # Platform Documentation
        elif 'deployment' in path_str:
            if 'nginx' in path_str:
                return "platform/installation/deployment/04-nginx-setup.md"
            elif 'portainer' in path_str:
                return "platform/installation/deployment/03-portainer-setup.md"
            elif 'docker' in path_str:
                return "platform/installation/deployment/02-docker-deployment.md"
            else:
                return "platform/installation/deployment/01-complete-guide.md"
        
        elif 'services' in path_str or 'gitea' in path_str:
            if 'gitea' in path_str:
                return "platform/services/core-services/01-gitea.md"
            else:
                return "platform/services/core-services/01-gitea.md"
        
        elif 'operations' in path_str:
            if 'backup' in path_str:
                if 'overview' in path_str:
                    return "platform/operations/backup-recovery/01-backup-strategy.md"
                else:
                    return "platform/operations/backup-recovery/02-backup-procedures.md"
            elif 'disaster' in path_str or 'recovery' in path_str:
                return "platform/operations/backup-recovery/04-disaster-recovery.md"
            elif 'incident' in path_str:
                return "platform/operations/incident-response/01-incident-handling.md"
            elif 'startup' in path_str:
                return "platform/operations/routine-operations/01-startup-procedures.md"
            elif 'shutdown' in path_str:
                return "platform/operations/routine-operations/02-shutdown-procedures.md"
            else:
                return "platform/operations/routine-operations/02-service-management.md"
        
        elif 'stack' in path_str:
            if 'config' in path_str or 'environment' in path_str:
                return "platform/installation/configuration/01-environment-variables.md"
            elif 'troubleshoot' in path_str:
                return "learning/troubleshooting/common-issues/01-service-startup.md"
            else:
                return "platform/services/core-services/01-gitea.md"
        
        # Project Documentation
        elif 'agent-management' in path_str or 'task-management' in path_str:
            if 'e055' in path_str.lower():
                return "projects/project-management/active-epics/01-epic-e055-mosaic-stack.md"
            elif 'e057' in path_str.lower() or 'e.057' in path_str.lower():
                return "projects/project-management/active-epics/02-epic-e057-mcp-integration.md"
            else:
                return "projects/project-management/active-epics/01-epic-e055-mosaic-stack.md"
        
        elif 'architecture' in path_str:
            if 'security' in path_str:
                return "projects/architecture/security-architecture/01-security-model.md"
            elif 'data' in path_str or 'flow' in path_str:
                return "projects/architecture/system-architecture/03-data-flow.md"
            elif 'network' in path_str:
                return "projects/architecture/system-architecture/04-network-topology.md"
            elif 'service' in path_str or 'depend' in path_str:
                return "projects/architecture/system-architecture/02-component-design.md"
            else:
                return "projects/architecture/system-architecture/01-overview.md"
        
        elif 'migration' in path_str:
            if 'tony-sdk' in path_str or 'mosaic-sdk' in path_str:
                return "projects/migrations/tony-to-mosaic/01-migration-overview.md"
            elif 'namespace' in path_str or 'package' in path_str:
                return "projects/migrations/tony-to-mosaic/02-namespace-changes.md"
            else:
                return "projects/migrations/version-migrations/03-breaking-changes.md"
        
        elif 'orchestration' in path_str:
            if 'architecture' in path_str:
                return "projects/architecture/integration-patterns/04-orchestration.md"
            elif 'routing' in path_str:
                return "projects/architecture/integration-patterns/02-api-gateway.md"
            elif 'plugin' in path_str:
                return "projects/architecture/integration-patterns/01-service-mesh.md"
            else:
                return "projects/architecture/integration-patterns/03-event-driven.md"
        
        elif 'mosaic-stack' in path_str:
            if 'overview' in path_str:
                return "projects/architecture/system-architecture/01-overview.md"
            elif 'version' in path_str or 'roadmap' in path_str:
                return "projects/project-management/roadmap-milestones/01-version-roadmap.md"
            elif 'component' in path_str or 'milestone' in path_str:
                return "projects/project-management/roadmap-milestones/02-component-milestones.md"
            else:
                return "projects/architecture/system-architecture/01-overview.md"
        
        # Learning Documentation
        elif 'troubleshooting' in path_str:
            return "learning/troubleshooting/common-issues/01-service-startup.md"
        
        elif 'bookstack' in path_str:
            if 'template' in path_str:
                return None  # Skip templates
            elif 'sync' in path_str or 'implementation' in path_str:
                return "platform/services/application-services/01-bookstack.md"
            else:
                return None  # Skip bookstack meta files
        
        # Generic files
        elif 'readme' in path_str.lower():
            return None  # Skip READMEs
        elif 'epic-e.055' in path_str.lower():
            return "projects/project-management/active-epics/01-epic-e055-mosaic-stack.md"
        elif 'documentation-index' in path_str:
            return "learning/reference/configuration/01-environment-variables.md"
        
        # Default based on content
        if 'project' in content_lower and 'planning' in content_lower:
            return "projects/project-management/planning-methodology/01-project-planning.md"
        
        return None  # Could not determine destination
    
    def merge_content(self, source_file: Path, dest_file: Path) -> str:
        """Merge source content into destination, handling stubs vs existing content"""
        source_content = source_file.read_text()
        
        if not dest_file.exists():
            return source_content
        
        dest_content = dest_file.read_text()
        
        # Check if destination is a stub
        if 'status: "draft"' in dest_content and '[Content to be added]' in dest_content:
            # Replace stub with real content
            # Extract frontmatter from destination to preserve structure
            dest_frontmatter = self.extract_frontmatter(dest_content)
            source_body = self.extract_body(source_content)
            
            # Update frontmatter
            if dest_frontmatter:
                dest_frontmatter = dest_frontmatter.replace('status: "draft"', 'status: "published"')
                dest_frontmatter = dest_frontmatter.replace('author: "stub"', 'author: "migration"')
                return dest_frontmatter + "\n" + source_body
            else:
                return source_content
        else:
            # Merge with existing content
            # This is more complex - for now, append as a new section
            return dest_content + "\n\n---\n\n## Additional Content (Migrated)\n\n" + self.extract_body(source_content)
    
    def extract_frontmatter(self, content: str) -> Optional[str]:
        """Extract frontmatter from markdown content"""
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                return f"---{parts[1]}---"
        return None
    
    def extract_body(self, content: str) -> str:
        """Extract body content (without frontmatter)"""
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                return parts[2].strip()
        return content
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file"""
        # Skip if already processed
        rel_path = str(file_path.relative_to(self.old_docs))
        if rel_path in self.processed:
            return True
        
        print(f"\nProcessing: {rel_path}")
        
        try:
            # Read content
            content = file_path.read_text()
            
            # Determine destination
            dest_path = self.determine_destination(file_path, content)
            
            if dest_path is None:
                print(f"  ⚠️  Could not determine destination, skipping")
                self.save_state(rel_path, "SKIPPED", "NO_DESTINATION")
                return True
            
            print(f"  → Destination: {dest_path}")
            
            # Merge content
            dest_file = self.new_docs / dest_path
            merged_content = self.merge_content(file_path, dest_file)
            
            # Write merged content
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_text(merged_content)
            print(f"  ✓ Content written")
            
            # Move to _moved
            moved_path = self.moved_docs / rel_path
            moved_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), str(moved_path))
            print(f"  ✓ Moved to _moved")
            
            # Update state
            self.processed.add(rel_path)
            self.save_state(rel_path, dest_path, "SUCCESS")
            
            return True
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            self.errors.append((rel_path, str(e)))
            self.save_state(rel_path, "ERROR", str(e))
            return False
    
    def run(self, limit: Optional[int] = None):
        """Run the migration process"""
        # Get all markdown files
        all_files = list(self.old_docs.rglob("*.md"))
        # Skip files already in _moved directory
        remaining = [f for f in all_files 
                    if str(f.relative_to(self.old_docs)) not in self.processed 
                    and '_moved' not in str(f)]
        
        print(f"Found {len(remaining)} files to process")
        
        # Process files
        processed_count = 0
        for file_path in remaining:
            if limit and processed_count >= limit:
                print(f"\nReached limit of {limit} files")
                break
                
            if self.process_file(file_path):
                processed_count += 1
        
        # Summary
        print(f"\n{'='*60}")
        print(f"Processed: {processed_count} files")
        print(f"Errors: {len(self.errors)}")
        print(f"Total processed so far: {len(self.processed)}")
        print(f"Remaining: {len(remaining) - processed_count}")
        
        if self.errors:
            print("\nErrors:")
            for file, error in self.errors:
                print(f"  - {file}: {error}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Systematic documentation migration')
    parser.add_argument('--limit', type=int, help='Limit number of files to process')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without doing it')
    args = parser.parse_args()
    
    if args.dry_run:
        print("DRY RUN MODE - not implemented yet")
        return
    
    migrator = DocumentMigrator()
    migrator.run(limit=args.limit)

if __name__ == "__main__":
    main()
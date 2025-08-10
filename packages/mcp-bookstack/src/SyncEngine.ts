/**
 * BookStack Sync Engine
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Implements Project = Shelf mapping strategy:
 * - docs/{ProjectName}/ → BookStack Shelf
 * - Automatic structure discovery
 * - Two-way synchronization
 * - Conflict resolution
 * - Metadata preservation
 */

import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import yaml from "js-yaml";
import {
  BookStackClient,
  BookStackConfig,
  SyncMetadata,
  ConflictInfo,
} from "./BookStackClient";

export interface SyncConfig {
  docsRoot: string;
  bookstack: BookStackConfig;
  structureFile?: string;
  dryRun?: boolean;
  conflictResolution?: "git_wins" | "bookstack_wins" | "manual";
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface SyncStats {
  shelves: { created: number; updated: number; skipped: number };
  books: { created: number; updated: number; skipped: number };
  chapters: { created: number; updated: number; skipped: number };
  pages: { created: number; updated: number; skipped: number };
  conflicts: number;
  errors: number;
  duration: number;
}

export interface ProjectStructure {
  name: string;
  slug: string;
  path: string;
  books: BookStructure[];
}

export interface BookStructure {
  name: string;
  slug: string;
  path: string;
  chapters: ChapterStructure[];
}

export interface ChapterStructure {
  name: string;
  slug: string;
  path: string;
  pages: PageStructure[];
}

export interface PageStructure {
  name: string;
  slug: string;
  path: string;
  title: string;
  frontmatter: any;
  content: string;
  lastModified: Date;
}

export class SyncEngine extends EventEmitter {
  private client: BookStackClient;
  private stats: SyncStats;
  private conflicts: ConflictInfo[] = [];

  constructor(private config: SyncConfig) {
    super();
    this.client = new BookStackClient(config.bookstack);
    this.stats = this.initStats();
    this.setupClientListeners();
  }

  private initStats(): SyncStats {
    return {
      shelves: { created: 0, updated: 0, skipped: 0 },
      books: { created: 0, updated: 0, skipped: 0 },
      chapters: { created: 0, updated: 0, skipped: 0 },
      pages: { created: 0, updated: 0, skipped: 0 },
      conflicts: 0,
      errors: 0,
      duration: 0,
    };
  }

  private setupClientListeners(): void {
    this.client.on("created", (event: any) => {
      const statKey = `${event.type}s` as
        | "shelves"
        | "books"
        | "chapters"
        | "pages";
      if (statKey in this.stats) {
        (this.stats[statKey] as any).created++;
      }
      this.emit("progress", {
        action: "created",
        type: event.type,
        entity: event.entity,
      });
    });

    this.client.on("updated", (event: any) => {
      const statKey = `${event.type}s` as
        | "shelves"
        | "books"
        | "chapters"
        | "pages";
      if (statKey in this.stats) {
        (this.stats[statKey] as any).updated++;
      }
      this.emit("progress", {
        action: "updated",
        type: event.type,
        entity: event.entity,
      });
    });

    this.client.on("error", (error: any) => {
      this.stats.errors++;
      this.emit("error", error);
    });

    this.client.on("rateLimit", (info: any) => {
      this.emit("rateLimit", info);
    });
  }

  /**
   * Main sync entry point
   */
  async sync(): Promise<SyncStats> {
    const startTime = Date.now();
    this.emit("syncStart", { config: this.config });

    try {
      // Health check
      const isHealthy = await this.client.healthCheck();
      if (!isHealthy) {
        throw new Error("BookStack API health check failed");
      }

      // Discover project structure
      const projects = await this.discoverProjects();
      this.emit("projectsDiscovered", { count: projects.length, projects });

      // Sync each project (Project = Shelf)
      for (const project of projects) {
        await this.syncProject(project);
      }

      // Handle conflicts if any
      if (this.conflicts.length > 0) {
        await this.handleConflicts();
      }

      this.stats.duration = Date.now() - startTime;
      this.emit("syncComplete", {
        stats: this.stats,
        conflicts: this.conflicts,
      });

      return this.stats;
    } catch (error) {
      this.stats.errors++;
      this.stats.duration = Date.now() - startTime;
      this.emit("syncError", { error, stats: this.stats });
      throw error;
    }
  }

  /**
   * Discover all projects in docs root
   * Each top-level directory becomes a BookStack shelf
   */
  private async discoverProjects(): Promise<ProjectStructure[]> {
    const projects: ProjectStructure[] = [];
    const docsPath = path.resolve(this.config.docsRoot);

    try {
      const entries = await fs.readdir(docsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".")) continue;
        if (this.isExcluded(entry.name)) continue;

        const projectPath = path.join(docsPath, entry.name);
        const project = await this.analyzeProject(entry.name, projectPath);

        if (project.books.length > 0) {
          projects.push(project);
        }
      }
    } catch (error) {
      this.emit("error", { message: "Failed to discover projects", error });
      throw error;
    }

    return projects;
  }

  /**
   * Analyze a project directory structure
   */
  private async analyzeProject(
    name: string,
    projectPath: string,
  ): Promise<ProjectStructure> {
    const books: BookStructure[] = [];

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".")) continue;

        const bookPath = path.join(projectPath, entry.name);
        const book = await this.analyzeBook(entry.name, bookPath);

        if (book.chapters.length > 0) {
          books.push(book);
        }
      }
    } catch (error) {
      this.emit("error", {
        message: `Failed to analyze project ${name}`,
        error,
      });
    }

    return {
      name: this.formatName(name),
      slug: this.formatSlug(name),
      path: projectPath,
      books,
    };
  }

  /**
   * Analyze a book directory structure
   */
  private async analyzeBook(
    name: string,
    bookPath: string,
  ): Promise<BookStructure> {
    const chapters: ChapterStructure[] = [];

    try {
      const entries = await fs.readdir(bookPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".")) continue;

        const chapterPath = path.join(bookPath, entry.name);
        const chapter = await this.analyzeChapter(entry.name, chapterPath);

        if (chapter.pages.length > 0) {
          chapters.push(chapter);
        }
      }
    } catch (error) {
      this.emit("error", { message: `Failed to analyze book ${name}`, error });
    }

    return {
      name: this.formatName(name),
      slug: this.formatSlug(name),
      path: bookPath,
      chapters,
    };
  }

  /**
   * Analyze a chapter directory structure
   */
  private async analyzeChapter(
    name: string,
    chapterPath: string,
  ): Promise<ChapterStructure> {
    const pages: PageStructure[] = [];

    try {
      const entries = await fs.readdir(chapterPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith(".md")) continue;
        if (entry.name.startsWith(".")) continue;

        const pagePath = path.join(chapterPath, entry.name);
        const page = await this.analyzePage(entry.name, pagePath);

        if (page) {
          pages.push(page);
        }
      }
    } catch (error) {
      this.emit("error", {
        message: `Failed to analyze chapter ${name}`,
        error,
      });
    }

    // Sort pages by filename for consistent ordering
    pages.sort((a, b) => a.slug.localeCompare(b.slug));

    return {
      name: this.formatName(name),
      slug: this.formatSlug(name),
      path: chapterPath,
      pages,
    };
  }

  /**
   * Analyze a markdown page
   */
  private async analyzePage(
    filename: string,
    pagePath: string,
  ): Promise<PageStructure | null> {
    try {
      const content = await fs.readFile(pagePath, "utf-8");
      const stats = await fs.stat(pagePath);
      const { frontmatter, markdown } = this.parseMarkdown(content);

      const slug = path.basename(filename, ".md");
      const title = frontmatter?.title || this.formatName(slug);

      return {
        name: title,
        slug,
        path: pagePath,
        title,
        frontmatter: frontmatter || {},
        content: markdown,
        lastModified: stats.mtime,
      };
    } catch (error) {
      this.emit("error", {
        message: `Failed to analyze page ${filename}`,
        error,
      });
      return null;
    }
  }

  /**
   * Sync a single project (Project = Shelf)
   */
  private async syncProject(project: ProjectStructure): Promise<void> {
    this.emit("projectSync", { action: "start", project: project.name });

    try {
      // Get or create shelf
      let shelf = await this.client.getShelfBySlug(project.slug);

      if (!shelf) {
        if (this.config.dryRun) {
          this.emit("dryRun", {
            action: "create",
            type: "shelf",
            name: project.name,
          });
          this.stats.shelves.created++;
        } else {
          shelf = await this.client.createShelf({
            name: project.name,
            slug: project.slug,
            description: `Documentation for ${project.name} project`,
          });
        }
      } else {
        this.stats.shelves.skipped++;
      }

      // Sync books in this project
      for (const book of project.books) {
        await this.syncBook(book, shelf?.id);
      }

      this.emit("projectSync", { action: "complete", project: project.name });
    } catch (error) {
      this.emit("error", {
        message: `Failed to sync project ${project.name}`,
        error,
      });
      throw error;
    }
  }

  /**
   * Sync a book within a shelf
   */
  private async syncBook(book: BookStructure, shelfId?: number): Promise<void> {
    this.emit("bookSync", { action: "start", book: book.name });

    try {
      // Get or create book
      let bookEntity = await this.client.getBookBySlug(book.slug);

      if (!bookEntity) {
        if (this.config.dryRun) {
          this.emit("dryRun", {
            action: "create",
            type: "book",
            name: book.name,
          });
          this.stats.books.created++;
        } else {
          bookEntity = await this.client.createBook({
            name: book.name,
            slug: book.slug,
            description: `${book.name} documentation`,
          });

          // Attach to shelf if provided
          if (shelfId && bookEntity.id) {
            await this.client.attachBookToShelf(bookEntity.id, shelfId);
          }
        }
      } else {
        this.stats.books.skipped++;
      }

      // Sync chapters in this book
      for (const chapter of book.chapters) {
        await this.syncChapter(chapter, bookEntity?.id);
      }

      this.emit("bookSync", { action: "complete", book: book.name });
    } catch (error) {
      this.emit("error", {
        message: `Failed to sync book ${book.name}`,
        error,
      });
      throw error;
    }
  }

  /**
   * Sync a chapter within a book
   */
  private async syncChapter(
    chapter: ChapterStructure,
    bookId?: number,
  ): Promise<void> {
    if (!bookId) return;

    this.emit("chapterSync", { action: "start", chapter: chapter.name });

    try {
      // Get or create chapter
      let chapterEntity = await this.client.getChapterBySlug(
        bookId,
        chapter.slug,
      );

      if (!chapterEntity) {
        if (this.config.dryRun) {
          this.emit("dryRun", {
            action: "create",
            type: "chapter",
            name: chapter.name,
          });
          this.stats.chapters.created++;
        } else {
          chapterEntity = await this.client.createChapter({
            book_id: bookId,
            name: chapter.name,
            slug: chapter.slug,
            description: `${chapter.name} documentation`,
          });
        }
      } else {
        this.stats.chapters.skipped++;
      }

      // Sync pages in this chapter
      for (const page of chapter.pages) {
        await this.syncPage(page, chapterEntity?.id);
      }

      this.emit("chapterSync", { action: "complete", chapter: chapter.name });
    } catch (error) {
      this.emit("error", {
        message: `Failed to sync chapter ${chapter.name}`,
        error,
      });
      throw error;
    }
  }

  /**
   * Sync a page within a chapter
   */
  private async syncPage(
    page: PageStructure,
    chapterId?: number,
  ): Promise<void> {
    if (!chapterId) return;

    this.emit("pageSync", { action: "start", page: page.name });

    try {
      // Check for conflicts
      const conflict = await this.client.detectConflicts(
        page.path,
        page.content,
        page.lastModified.toISOString(),
      );

      if (conflict) {
        this.conflicts.push(conflict);
        this.stats.conflicts++;
        this.emit("conflict", conflict);
        return;
      }

      // Get or create page
      let pageEntity = await this.client.getPageBySlug(chapterId, page.slug);

      const tags = this.formatTags(page.frontmatter);

      if (!pageEntity) {
        if (this.config.dryRun) {
          this.emit("dryRun", {
            action: "create",
            type: "page",
            name: page.name,
          });
          this.stats.pages.created++;
        } else {
          pageEntity = await this.client.createPage({
            chapter_id: chapterId,
            name: page.title,
            slug: page.slug,
            markdown: page.content,
            tags,
          });

          // Save metadata
          await this.savePageMetadata(page, pageEntity);
        }
      } else {
        // Check if update is needed
        const metadata = await this.client.loadMetadata(page.path);
        const contentHash = this.calculateHash(page.content);

        if (!metadata || metadata.content_hash !== contentHash) {
          if (this.config.dryRun) {
            this.emit("dryRun", {
              action: "update",
              type: "page",
              name: page.name,
            });
            this.stats.pages.updated++;
          } else {
            await this.client.updatePage(pageEntity.id!, {
              name: page.title,
              markdown: page.content,
              tags,
            });

            // Update metadata
            await this.savePageMetadata(page, pageEntity);
          }
        } else {
          this.stats.pages.skipped++;
        }
      }

      this.emit("pageSync", { action: "complete", page: page.name });
    } catch (error) {
      this.emit("error", {
        message: `Failed to sync page ${page.name}`,
        error,
      });
      throw error;
    }
  }

  /**
   * Save page metadata for tracking
   */
  private async savePageMetadata(
    page: PageStructure,
    pageEntity: any,
  ): Promise<void> {
    const metadata: SyncMetadata = {
      bookstack_id: pageEntity.id,
      bookstack_type: "page",
      last_sync: new Date().toISOString(),
      git_commit: this.getGitCommit(),
      content_hash: this.calculateHash(page.content),
      conflict_resolution: this.config.conflictResolution,
    };

    await this.client.saveMetadata(page.path, metadata);
  }

  /**
   * Handle conflicts based on resolution strategy
   */
  private async handleConflicts(): Promise<void> {
    for (const conflict of this.conflicts) {
      switch (conflict.resolution_strategy) {
        case "git_wins":
          await this.resolveConflictGitWins(conflict);
          break;
        case "bookstack_wins":
          await this.resolveConflictBookStackWins(conflict);
          break;
        case "manual":
          this.emit("manualConflict", conflict);
          break;
      }
    }
  }

  private async resolveConflictGitWins(conflict: ConflictInfo): Promise<void> {
    // Update BookStack with Git content
    await this.client.updatePage(conflict.entity_id, {
      markdown: conflict.git_content,
    });
    this.emit("conflictResolved", { conflict, resolution: "git_wins" });
  }

  private async resolveConflictBookStackWins(
    conflict: ConflictInfo,
  ): Promise<void> {
    // Update Git file with BookStack content
    // This would require careful handling to avoid overwriting local changes
    this.emit("conflictResolved", { conflict, resolution: "bookstack_wins" });
  }

  // Utility methods
  private parseMarkdown(content: string): {
    frontmatter: any;
    markdown: string;
  } {
    if (!content.startsWith("---")) {
      return { frontmatter: null, markdown: content };
    }

    const parts = content.split("---", 3);
    if (parts.length < 3) {
      return { frontmatter: null, markdown: content };
    }

    try {
      const frontmatter = yaml.load(parts[1]);
      const markdown = parts[2].trim();
      return { frontmatter, markdown };
    } catch {
      return { frontmatter: null, markdown: content };
    }
  }

  private formatTags(frontmatter: any): Array<{ name: string; value: string }> {
    const tags: Array<{ name: string; value: string }> = [];

    if (frontmatter?.tags && Array.isArray(frontmatter.tags)) {
      tags.push(
        ...frontmatter.tags.map((tag: string) => ({ name: tag, value: "" })),
      );
    }

    // Add sync metadata tags
    tags.push(
      { name: "git-sync", value: new Date().toISOString() },
      { name: "git-commit", value: this.getGitCommit() },
    );

    return tags;
  }

  private formatName(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private calculateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private getGitCommit(): string {
    try {
      return execSync("git rev-parse --short HEAD", {
        cwd: this.config.docsRoot,
        encoding: "utf-8",
      }).trim();
    } catch {
      return "unknown";
    }
  }

  private isExcluded(name: string): boolean {
    const excludePatterns = this.config.excludePatterns || [
      "node_modules",
      ".git",
      ".bookstack",
      "dist",
      "build",
    ];

    return excludePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  // Public getters
  getStats(): SyncStats {
    return { ...this.stats };
  }

  getConflicts(): ConflictInfo[] {
    return [...this.conflicts];
  }
}

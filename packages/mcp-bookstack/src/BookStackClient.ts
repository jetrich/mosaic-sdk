/**
 * Enhanced BookStack API Client
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Features:
 * - Full CRUD operations for all BookStack entities
 * - Rate limiting and retry logic
 * - Metadata preservation system
 * - Conflict resolution support
 * - Comprehensive error handling
 */

import axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";

export interface BookStackConfig {
  baseUrl: string;
  tokenId: string;
  tokenSecret: string;
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface BookStackEntity {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  content?: string;
  tags?: BookStackTag[];
  created_at?: string;
  updated_at?: string;
}

export interface BookStackTag {
  name: string;
  value: string;
}

export interface BookStackShelf extends BookStackEntity {
  books?: BookStackBook[];
}

export interface BookStackBook extends BookStackEntity {
  shelf_id?: number;
  chapters?: BookStackChapter[];
  pages?: BookStackPage[];
}

export interface BookStackChapter extends BookStackEntity {
  book_id: number;
  pages?: BookStackPage[];
  priority?: number;
}

export interface BookStackPage extends BookStackEntity {
  book_id?: number;
  chapter_id?: number;
  markdown?: string;
  html?: string;
  priority?: number;
  template?: boolean;
}

export interface SyncMetadata {
  bookstack_id: number;
  bookstack_type: "shelf" | "book" | "chapter" | "page";
  last_sync: string;
  git_commit: string;
  content_hash: string;
  conflict_resolution?: "git_wins" | "bookstack_wins" | "manual";
}

export interface ConflictInfo {
  entity_type: string;
  entity_id: number;
  git_content: string;
  bookstack_content: string;
  git_updated: string;
  bookstack_updated: string;
  resolution_strategy: "git_wins" | "bookstack_wins" | "manual";
}

export class BookStackClient extends EventEmitter {
  private client: AxiosInstance;
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute

  constructor(private config: BookStackConfig) {
    super();

    this.client = axios.create({
      baseURL: `${config.baseUrl.replace(/\/$/, "")}/api`,
      headers: {
        Authorization: `Token ${config.tokenId}:${config.tokenSecret}`,
        "Content-Type": "application/json",
        "User-Agent": "MosAIc-BookStack-Sync/1.0.0",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.enforceRateLimit();
      return config;
    });

    // Response interceptor for error handling and retries
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const retryConfig = this.config.retryConfig || {
          maxRetries: 3,
          backoffMs: 1000,
        };

        if (error.config && !error.config.__retryCount) {
          error.config.__retryCount = 0;
        }

        if (
          error.config &&
          error.config.__retryCount < retryConfig.maxRetries
        ) {
          error.config.__retryCount++;

          // Exponential backoff
          const delay =
            retryConfig.backoffMs * Math.pow(2, error.config.__retryCount - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));

          this.emit("retry", {
            attempt: error.config.__retryCount,
            maxRetries: retryConfig.maxRetries,
            error: error.message,
          });

          return this.client.request(error.config);
        }

        this.emit("error", error);
        throw error;
      },
    );
  }

  private async enforceRateLimit(): Promise<void> {
    const rateLimit = this.config.rateLimit || {
      requestsPerMinute: 60,
      burstLimit: 10,
    };
    const now = Date.now();

    // Reset counter every minute
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000;
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= rateLimit.requestsPerMinute) {
      const waitTime = this.resetTime - now;
      this.emit("rateLimit", { waitTime });
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }

    // Enforce minimum time between requests for burst protection
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / rateLimit.burstLimit; // ms between requests

    if (timeSinceLastRequest < minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minInterval - timeSinceLastRequest),
      );
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  // Shelf operations
  async getShelves(): Promise<BookStackShelf[]> {
    const response = await this.client.get("/shelves");
    return response.data.data || [];
  }

  async getShelf(id: number): Promise<BookStackShelf> {
    const response = await this.client.get(`/shelves/${id}`);
    return response.data;
  }

  async getShelfBySlug(slug: string): Promise<BookStackShelf | null> {
    const shelves = await this.getShelves();
    return shelves.find((shelf) => shelf.slug === slug) || null;
  }

  async createShelf(shelf: Partial<BookStackShelf>): Promise<BookStackShelf> {
    const response = await this.client.post("/shelves", shelf);
    this.emit("created", { type: "shelf", entity: response.data });
    return response.data;
  }

  async updateShelf(
    id: number,
    shelf: Partial<BookStackShelf>,
  ): Promise<BookStackShelf> {
    const response = await this.client.put(`/shelves/${id}`, shelf);
    this.emit("updated", { type: "shelf", entity: response.data });
    return response.data;
  }

  async deleteShelf(id: number): Promise<void> {
    await this.client.delete(`/shelves/${id}`);
    this.emit("deleted", { type: "shelf", id });
  }

  // Book operations
  async getBooks(): Promise<BookStackBook[]> {
    const response = await this.client.get("/books");
    return response.data.data || [];
  }

  async getBook(id: number): Promise<BookStackBook> {
    const response = await this.client.get(`/books/${id}`);
    return response.data;
  }

  async getBookBySlug(slug: string): Promise<BookStackBook | null> {
    const books = await this.getBooks();
    return books.find((book) => book.slug === slug) || null;
  }

  async createBook(book: Partial<BookStackBook>): Promise<BookStackBook> {
    const response = await this.client.post("/books", book);
    this.emit("created", { type: "book", entity: response.data });
    return response.data;
  }

  async updateBook(
    id: number,
    book: Partial<BookStackBook>,
  ): Promise<BookStackBook> {
    const response = await this.client.put(`/books/${id}`, book);
    this.emit("updated", { type: "book", entity: response.data });
    return response.data;
  }

  async deleteBook(id: number): Promise<void> {
    await this.client.delete(`/books/${id}`);
    this.emit("deleted", { type: "book", id });
  }

  async attachBookToShelf(bookId: number, shelfId: number): Promise<void> {
    try {
      await this.client.put(`/shelves/${shelfId}/books`, {
        books: [{ id: bookId }],
      });
      this.emit("attached", { type: "book", bookId, shelfId });
    } catch (error: any) {
      // Some BookStack versions handle this automatically
      if (!error.response || error.response.status !== 405) {
        throw error;
      }
    }
  }

  // Chapter operations
  async getChapters(bookId: number): Promise<BookStackChapter[]> {
    const book = await this.getBook(bookId);
    return book.chapters || [];
  }

  async getChapter(id: number): Promise<BookStackChapter> {
    const response = await this.client.get(`/chapters/${id}`);
    return response.data;
  }

  async getChapterBySlug(
    bookId: number,
    slug: string,
  ): Promise<BookStackChapter | null> {
    const chapters = await this.getChapters(bookId);
    return chapters.find((chapter) => chapter.slug === slug) || null;
  }

  async createChapter(
    chapter: Partial<BookStackChapter>,
  ): Promise<BookStackChapter> {
    const response = await this.client.post("/chapters", chapter);
    this.emit("created", { type: "chapter", entity: response.data });
    return response.data;
  }

  async updateChapter(
    id: number,
    chapter: Partial<BookStackChapter>,
  ): Promise<BookStackChapter> {
    const response = await this.client.put(`/chapters/${id}`, chapter);
    this.emit("updated", { type: "chapter", entity: response.data });
    return response.data;
  }

  async deleteChapter(id: number): Promise<void> {
    await this.client.delete(`/chapters/${id}`);
    this.emit("deleted", { type: "chapter", id });
  }

  // Page operations
  async getPages(): Promise<BookStackPage[]> {
    const response = await this.client.get("/pages");
    return response.data.data || [];
  }

  async getPage(id: number): Promise<BookStackPage> {
    const response = await this.client.get(`/pages/${id}`);
    return response.data;
  }

  async getPageBySlug(
    chapterId: number,
    slug: string,
  ): Promise<BookStackPage | null> {
    const chapter = await this.getChapter(chapterId);
    return chapter.pages?.find((page) => page.slug === slug) || null;
  }

  async createPage(page: Partial<BookStackPage>): Promise<BookStackPage> {
    const response = await this.client.post("/pages", page);
    this.emit("created", { type: "page", entity: response.data });
    return response.data;
  }

  async updatePage(
    id: number,
    page: Partial<BookStackPage>,
  ): Promise<BookStackPage> {
    const response = await this.client.put(`/pages/${id}`, page);
    this.emit("updated", { type: "page", entity: response.data });
    return response.data;
  }

  async deletePage(id: number): Promise<void> {
    await this.client.delete(`/pages/${id}`);
    this.emit("deleted", { type: "page", id });
  }

  // Metadata operations
  async saveMetadata(filePath: string, metadata: SyncMetadata): Promise<void> {
    const metadataPath = this.getMetadataPath(filePath);
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async loadMetadata(filePath: string): Promise<SyncMetadata | null> {
    const metadataPath = this.getMetadataPath(filePath);
    try {
      const content = await fs.readFile(metadataPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private getMetadataPath(filePath: string): string {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    return path.join(dir, ".bookstack", `${name}.json`);
  }

  // Conflict detection and resolution
  async detectConflicts(
    filePath: string,
    gitContent: string,
    gitUpdated: string,
  ): Promise<ConflictInfo | null> {
    const metadata = await this.loadMetadata(filePath);
    if (!metadata) return null;

    try {
      const bookstackEntity = await this.getEntityById(
        metadata.bookstack_type,
        metadata.bookstack_id,
      );
      const bookstackContent = this.extractContent(bookstackEntity);
      const bookstackUpdated = bookstackEntity.updated_at || "";

      // Check if both have been modified since last sync
      const gitModified = new Date(gitUpdated) > new Date(metadata.last_sync);
      const bookstackModified =
        new Date(bookstackUpdated) > new Date(metadata.last_sync);

      if (gitModified && bookstackModified) {
        return {
          entity_type: metadata.bookstack_type,
          entity_id: metadata.bookstack_id,
          git_content: gitContent,
          bookstack_content: bookstackContent,
          git_updated: gitUpdated,
          bookstack_updated: bookstackUpdated,
          resolution_strategy: metadata.conflict_resolution || "manual",
        };
      }
    } catch (error) {
      this.emit("error", { message: "Failed to detect conflicts", error });
    }

    return null;
  }

  private async getEntityById(type: string, id: number): Promise<any> {
    switch (type) {
      case "shelf":
        return this.getShelf(id);
      case "book":
        return this.getBook(id);
      case "chapter":
        return this.getChapter(id);
      case "page":
        return this.getPage(id);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  private extractContent(entity: any): string {
    return entity.markdown || entity.content || entity.description || "";
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/shelves?count=1");
      return true;
    } catch {
      return false;
    }
  }

  // Statistics
  getStats(): { requestCount: number; resetTime: number; isHealthy: boolean } {
    return {
      requestCount: this.requestCount,
      resetTime: this.resetTime,
      isHealthy: true, // Will be updated by health checks
    };
  }
}

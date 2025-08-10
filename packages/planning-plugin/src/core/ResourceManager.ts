/**
 * Resource Manager
 * 
 * Manages computational resources for agent spawning and task execution.
 * Handles memory limits, concurrent agent limits, and hybrid deployment strategies.
 */

import { Logger } from '../utils/Logger';
import * as os from 'os';

export interface ResourceLimits {
  maxConcurrentAgents: number;
  hybridDeployment: boolean;
  memoryLimit: string;
  timeoutMs: number;
}

export interface ResourceRequest {
  agentCount: number;
  memoryMB: number;
  timeoutMs: number;
}

export interface ResourceUsage {
  activeAgents: number;
  totalMemoryMB: number;
  availableMemoryMB: number;
  cpuUsage: number;
  timestamp: Date;
}

export interface HybridDeploymentStrategy {
  claudeAgents: number;
  ollamaAgents: number;
  rationale: string;
}

/**
 * Resource Manager for agent orchestration
 */
export class ResourceManager {
  private logger: Logger;
  private limits!: ResourceLimits;
  private currentUsage: ResourceUsage;
  private reservedResources: Map<string, ResourceRequest> = new Map();
  private resourceMonitor: NodeJS.Timeout | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.currentUsage = this.calculateCurrentUsage();
  }

  /**
   * Initialize resource manager with limits
   */
  async initialize(limits: ResourceLimits): Promise<void> {
    this.limits = limits;
    
    this.logger.info('Initializing resource manager', {
      maxConcurrentAgents: limits.maxConcurrentAgents,
      memoryLimit: limits.memoryLimit,
      hybridDeployment: limits.hybridDeployment
    });

    // Start resource monitoring
    this.startResourceMonitoring();

    // Log system capabilities
    this.logSystemCapabilities();
  }

  /**
   * Request resources for agent deployment
   */
  async requestResources(request: ResourceRequest): Promise<void> {
    this.logger.info('Resource request received', request);

    // Check if resources are available
    const availability = this.checkResourceAvailability(request);
    
    if (!availability.available) {
      throw new Error(`Resource request denied: ${availability.reason}`);
    }

    // Reserve resources
    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.reservedResources.set(reservationId, request);

    this.logger.info('Resources reserved', {
      reservationId,
      request,
      totalReserved: this.getTotalReservedResources()
    });
  }

  /**
   * Release reserved resources
   */
  async releaseResources(reservationId: string): Promise<void> {
    const reservation = this.reservedResources.get(reservationId);
    if (!reservation) {
      this.logger.warn('Attempted to release non-existent reservation', { reservationId });
      return;
    }

    this.reservedResources.delete(reservationId);

    this.logger.info('Resources released', {
      reservationId,
      releasedRequest: reservation,
      totalReserved: this.getTotalReservedResources()
    });
  }

  /**
   * Get hybrid deployment strategy based on current resources
   */
  getHybridDeploymentStrategy(requiredAgents: number): HybridDeploymentStrategy {
    if (!this.limits.hybridDeployment) {
      return {
        claudeAgents: requiredAgents,
        ollamaAgents: 0,
        rationale: 'Hybrid deployment disabled, using Claude only'
      };
    }

    const systemMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    const availableMemory = os.freemem() / (1024 * 1024 * 1024); // GB

    // Ollama typically needs ~4GB per model instance
    const ollamaCapacity = Math.floor(availableMemory / 4);
    const maxOllamaAgents = Math.min(ollamaCapacity, Math.floor(requiredAgents * 0.7)); // Max 70% Ollama
    
    const claudeAgents = requiredAgents - maxOllamaAgents;
    const ollamaAgents = maxOllamaAgents;

    let rationale = '';
    if (ollamaAgents > 0) {
      rationale = `Hybrid deployment: ${ollamaAgents} Ollama agents (local), ${claudeAgents} Claude agents (API)`;
    } else {
      rationale = `Insufficient local resources for Ollama, using Claude only`;
    }

    this.logger.info('Hybrid deployment strategy calculated', {
      requiredAgents,
      claudeAgents,
      ollamaAgents,
      availableMemoryGB: availableMemory,
      rationale
    });

    return { claudeAgents, ollamaAgents, rationale };
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    this.currentUsage = this.calculateCurrentUsage();
    return { ...this.currentUsage };
  }

  /**
   * Check if system is under resource pressure
   */
  isUnderResourcePressure(): boolean {
    const usage = this.getCurrentUsage();
    const memoryPressure = usage.availableMemoryMB < 1024; // Less than 1GB available
    const cpuPressure = usage.cpuUsage > 80; // CPU usage over 80%
    const agentPressure = usage.activeAgents >= this.limits.maxConcurrentAgents;

    return memoryPressure || cpuPressure || agentPressure;
  }

  /**
   * Perform garbage collection to free resources
   */
  async garbageCollect(): Promise<void> {
    this.logger.info('Performing resource garbage collection');

    // Force Node.js garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear expired reservations
    const now = Date.now();
    const expiredReservations: string[] = [];

    for (const [id, request] of this.reservedResources) {
      // Reservations expire after 10 minutes
      const reservationTime = parseInt(id.split('-')[1]);
      if (now - reservationTime > 600000) { // 10 minutes
        expiredReservations.push(id);
      }
    }

    for (const id of expiredReservations) {
      this.reservedResources.delete(id);
      this.logger.info('Expired reservation cleaned up', { reservationId: id });
    }

    this.logger.info('Garbage collection completed', {
      expiredReservationsCleared: expiredReservations.length,
      activeReservations: this.reservedResources.size
    });
  }

  /**
   * Clean up resource manager
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up resource manager');

    // Stop resource monitoring
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
      this.resourceMonitor = null;
    }

    // Clear all reservations
    this.reservedResources.clear();

    this.logger.info('Resource manager cleanup completed');
  }

  /**
   * Check resource availability for a request
   */
  private checkResourceAvailability(request: ResourceRequest): { available: boolean; reason?: string } {
    const usage = this.getCurrentUsage();
    const reserved = this.getTotalReservedResources();

    // Check agent count limit
    if (usage.activeAgents + reserved.agentCount + request.agentCount > this.limits.maxConcurrentAgents) {
      return {
        available: false,
        reason: `Would exceed max concurrent agents limit (${this.limits.maxConcurrentAgents})`
      };
    }

    // Check memory availability
    const requiredMemoryMB = reserved.memoryMB + request.memoryMB;
    if (requiredMemoryMB > usage.availableMemoryMB * 0.8) { // Keep 20% buffer
      return {
        available: false,
        reason: `Insufficient memory available (need ${requiredMemoryMB}MB, have ${Math.round(usage.availableMemoryMB * 0.8)}MB)`
      };
    }

    // Check CPU pressure
    if (usage.cpuUsage > 90) {
      return {
        available: false,
        reason: `System under high CPU load (${usage.cpuUsage}%)`
      };
    }

    return { available: true };
  }

  /**
   * Calculate current system resource usage
   */
  private calculateCurrentUsage(): ResourceUsage {
    const totalMemoryMB = os.totalmem() / (1024 * 1024);
    const freeMemoryMB = os.freemem() / (1024 * 1024);
    const availableMemoryMB = freeMemoryMB;

    // CPU usage calculation (simplified)
    const loadAverage = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(100, (loadAverage / cpuCount) * 100);

    return {
      activeAgents: 0, // This would be tracked by AgentDeploymentManager
      totalMemoryMB: Math.round(totalMemoryMB),
      availableMemoryMB: Math.round(availableMemoryMB),
      cpuUsage: Math.round(cpuUsage),
      timestamp: new Date()
    };
  }

  /**
   * Get total reserved resources
   */
  private getTotalReservedResources(): ResourceRequest {
    let agentCount = 0;
    let memoryMB = 0;
    let maxTimeoutMs = 0;

    for (const request of this.reservedResources.values()) {
      agentCount += request.agentCount;
      memoryMB += request.memoryMB;
      maxTimeoutMs = Math.max(maxTimeoutMs, request.timeoutMs);
    }

    return { agentCount, memoryMB, timeoutMs: maxTimeoutMs };
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    this.resourceMonitor = setInterval(() => {
      const usage = this.getCurrentUsage();
      
      // Log resource pressure warnings
      if (usage.availableMemoryMB < 512) {
        this.logger.warn('Low memory warning', {
          availableMemoryMB: usage.availableMemoryMB
        });
      }

      if (usage.cpuUsage > 85) {
        this.logger.warn('High CPU usage warning', {
          cpuUsage: usage.cpuUsage
        });
      }

    }, 30000); // Check every 30 seconds
  }

  /**
   * Log system capabilities
   */
  private logSystemCapabilities(): void {
    const usage = this.getCurrentUsage();
    const cpuInfo = os.cpus();
    
    this.logger.info('System capabilities', {
      totalMemoryGB: Math.round(usage.totalMemoryMB / 1024 * 100) / 100,
      availableMemoryGB: Math.round(usage.availableMemoryMB / 1024 * 100) / 100,
      cpuCores: cpuInfo.length,
      cpuModel: cpuInfo[0]?.model || 'Unknown',
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      maxConcurrentAgents: this.limits.maxConcurrentAgents
    });
  }
}
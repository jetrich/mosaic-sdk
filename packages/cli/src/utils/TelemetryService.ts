/**
 * Telemetry Service - Privacy-First Analytics
 * Opt-in anonymous installation tracking with GUID-based deduplication
 */

import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

export interface TelemetryData {
  installationId: string;
  event: 'installation' | 'initialization' | 'startup' | 'error';
  timestamp: string;
  version: string;
  mode?: 'local' | 'hybrid' | 'cloud';
  nodeVersion: string;
  platform: string;
  arch: string;
  providers?: string[];
  error?: string;
}

export interface TelemetryPreferences {
  enabled: boolean;
  installationId: string;
  lastSent?: string;
  eventCount: number;
}

export class TelemetryService {
  private readonly telemetryDir = join(homedir(), '.mosaic', 'telemetry');
  private readonly prefsFile = join(this.telemetryDir, 'preferences.json');
  private readonly endpoint = 'https://analytics.mosaicstack.dev/events';
  private readonly timeout = 5000; // 5 second timeout

  /**
   * Initialize telemetry service and get user consent
   */
  async initialize(): Promise<boolean> {
    try {
      // Ensure telemetry directory exists
      if (!existsSync(this.telemetryDir)) {
        mkdirSync(this.telemetryDir, { recursive: true });
      }

      // Load existing preferences
      const prefs = this.loadPreferences();
      
      if (prefs) {
        // User has already made a choice
        return prefs.enabled;
      }

      // First time - ask for consent
      return await this.requestConsent();
    } catch (error) {
      // Fail silently - telemetry should never break the user experience
      return false;
    }
  }

  /**
   * Send telemetry event (only if user has opted in)
   */
  async sendEvent(event: Omit<TelemetryData, 'installationId' | 'timestamp' | 'nodeVersion' | 'platform' | 'arch'>): Promise<void> {
    try {
      const prefs = this.loadPreferences();
      if (!prefs?.enabled) {
        return; // User has not opted in
      }

      const telemetryData: TelemetryData = {
        installationId: prefs.installationId,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ...event,
      };

      // Send to analytics endpoint
      await this.sendToEndpoint(telemetryData);

      // Update preferences with last sent time
      prefs.lastSent = telemetryData.timestamp;
      prefs.eventCount += 1;
      this.savePreferences(prefs);

    } catch (error) {
      // Fail silently - telemetry errors should not affect user experience
    }
  }

  /**
   * Track installation event
   */
  async trackInstallation(version: string): Promise<void> {
    await this.sendEvent({
      event: 'installation',
      version,
    });
  }

  /**
   * Track initialization with mode and providers
   */
  async trackInitialization(version: string, mode: 'local' | 'hybrid' | 'cloud', providers: string[]): Promise<void> {
    await this.sendEvent({
      event: 'initialization',
      version,
      mode,
      providers,
    });
  }

  /**
   * Track startup event
   */
  async trackStartup(version: string, mode?: 'local' | 'hybrid' | 'cloud'): Promise<void> {
    await this.sendEvent({
      event: 'startup',
      version,
      mode,
    });
  }

  /**
   * Track error event
   */
  async trackError(version: string, error: string): Promise<void> {
    await this.sendEvent({
      event: 'error',
      version,
      error: error.substring(0, 200), // Limit error message length
    });
  }

  /**
   * Get telemetry status
   */
  getStatus(): { enabled: boolean; installationId?: string; eventCount?: number } {
    const prefs = this.loadPreferences();
    return {
      enabled: prefs?.enabled || false,
      installationId: prefs?.installationId,
      eventCount: prefs?.eventCount,
    };
  }

  /**
   * Enable telemetry
   */
  async enable(): Promise<void> {
    const prefs = this.loadPreferences() || this.createDefaultPreferences();
    prefs.enabled = true;
    this.savePreferences(prefs);
  }

  /**
   * Disable telemetry
   */
  async disable(): Promise<void> {
    const prefs = this.loadPreferences();
    if (prefs) {
      prefs.enabled = false;
      this.savePreferences(prefs);
    }
  }

  /**
   * Show privacy information
   */
  showPrivacyInfo(): void {
    console.log(chalk.blue.bold('📊 MosAIc Stack Telemetry'));
    console.log('═'.repeat(40));
    console.log();
    console.log(chalk.green('✓ Privacy-First Design:'));
    console.log('  • Anonymous installation tracking only');
    console.log('  • No personal information collected');
    console.log('  • No code or project data transmitted');
    console.log('  • GUID-based deduplication (no reinstall spam)');
    console.log();
    console.log(chalk.blue('📈 Data Collected:'));
    console.log('  • Installation count (anonymous)');
    console.log('  • Operation mode (local/hybrid/cloud)');
    console.log('  • Enabled providers (ollama, claude, etc.)');
    console.log('  • Node.js version and platform');
    console.log('  • Error events (error message only)');
    console.log();
    console.log(chalk.gray('🔒 Data NOT Collected:'));
    console.log('  • Personal identifiers (name, email, IP)');
    console.log('  • Project code or file contents');
    console.log('  • API keys or credentials');
    console.log('  • Conversation content');
    console.log('  • File paths or system details');
    console.log();
    console.log(chalk.yellow('💡 Purpose:'));
    console.log('  • Understand MosAIc Stack adoption');
    console.log('  • Prioritize feature development');
    console.log('  • Improve reliability and performance');
    console.log('  • Support open-source community growth');
    console.log();
    console.log(chalk.gray('Endpoint: https://analytics.mosaicstack.dev/events'));
    console.log(chalk.gray('Can be disabled anytime: mosaic config telemetry --disable'));
    console.log();
  }

  /**
   * Request user consent for telemetry
   */
  private async requestConsent(): Promise<boolean> {
    try {
      const inquirer = await import('inquirer');
      
      console.log();
      console.log(chalk.blue.bold('📊 Help Improve MosAIc Stack'));
      console.log('─'.repeat(40));
      console.log();
      console.log('MosAIc Stack can collect anonymous usage statistics to help improve');
      console.log('the platform. This is completely optional and privacy-first.');
      console.log();
      console.log(chalk.green('✓ Anonymous installation tracking'));
      console.log(chalk.green('✓ No personal information collected'));
      console.log(chalk.green('✓ Can be disabled anytime'));
      console.log();
      console.log(chalk.gray('For full details: mosaic telemetry --info'));
      console.log();

      const { enableTelemetry } = await inquirer.default.prompt([{
        type: 'confirm',
        name: 'enableTelemetry',
        message: 'Enable anonymous telemetry to help improve MosAIc Stack?',
        default: false, // Default to privacy
      }]);

      // Save user preference
      const prefs = this.createDefaultPreferences();
      prefs.enabled = enableTelemetry;
      this.savePreferences(prefs);

      if (enableTelemetry) {
        console.log(chalk.green('✓ Telemetry enabled. Thank you for helping improve MosAIc Stack!'));
      } else {
        console.log(chalk.gray('✓ Telemetry disabled. You can enable it later with: mosaic telemetry --enable'));
      }
      console.log();

      return enableTelemetry;
    } catch (error) {
      // If prompting fails, default to disabled
      const prefs = this.createDefaultPreferences();
      prefs.enabled = false;
      this.savePreferences(prefs);
      return false;
    }
  }

  /**
   * Load telemetry preferences from file
   */
  private loadPreferences(): TelemetryPreferences | null {
    try {
      if (!existsSync(this.prefsFile)) {
        return null;
      }

      const data = readFileSync(this.prefsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Save telemetry preferences to file
   */
  private savePreferences(prefs: TelemetryPreferences): void {
    try {
      writeFileSync(this.prefsFile, JSON.stringify(prefs, null, 2));
    } catch {
      // Fail silently
    }
  }

  /**
   * Create default preferences with new installation ID
   */
  private createDefaultPreferences(): TelemetryPreferences {
    return {
      enabled: false,
      installationId: randomUUID(),
      eventCount: 0,
    };
  }

  /**
   * Send telemetry data to analytics endpoint
   */
  private async sendToEndpoint(data: TelemetryData): Promise<void> {
    try {
      // Use dynamic import to avoid dependency issues
      const { default: fetch } = await import('node-fetch');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `MosAIc-Stack/${data.version}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't throw on HTTP errors - telemetry should be best effort
      if (!response.ok) {
        // Silent failure
        return;
      }
    } catch {
      // Network errors, timeouts, etc. - fail silently
      // Telemetry should never impact user experience
    }
  }
}
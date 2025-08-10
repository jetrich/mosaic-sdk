/**
 * Telemetry Command - Manage Telemetry Preferences
 * Allow users to control their telemetry settings
 */

import chalk from 'chalk';
import { TelemetryService } from '../utils/TelemetryService';

export interface TelemetryOptions {
  enable?: boolean;
  disable?: boolean;
  status?: boolean;
  info?: boolean;
}

export class TelemetryCommand {
  private telemetryService = new TelemetryService();

  async execute(options: TelemetryOptions) {
    // Handle specific actions
    if (options.enable) {
      await this.enable();
      return;
    }

    if (options.disable) {
      await this.disable();
      return;
    }

    if (options.status) {
      await this.showStatus();
      return;
    }

    if (options.info) {
      this.showInfo();
      return;
    }

    // Default: show current status
    await this.showStatus();
  }

  /**
   * Enable telemetry
   */
  private async enable() {
    console.log(chalk.blue.bold('📊 Enabling Telemetry'));
    console.log('─'.repeat(30));
    console.log();

    try {
      await this.telemetryService.enable();
      console.log(chalk.green('✅ Telemetry enabled successfully'));
      console.log();
      console.log(chalk.gray('Anonymous usage statistics will be collected to help'));
      console.log(chalk.gray('improve MosAIc Stack. Thank you for contributing!'));
      console.log();
      console.log(chalk.blue('Commands:'));
      console.log(chalk.gray('  mosaic telemetry --status   - Check status'));
      console.log(chalk.gray('  mosaic telemetry --disable  - Disable telemetry'));
      console.log(chalk.gray('  mosaic telemetry --info     - Privacy details'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to enable telemetry:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Disable telemetry
   */
  private async disable() {
    console.log(chalk.blue.bold('📊 Disabling Telemetry'));
    console.log('─'.repeat(30));
    console.log();

    try {
      await this.telemetryService.disable();
      console.log(chalk.green('✅ Telemetry disabled successfully'));
      console.log();
      console.log(chalk.gray('No usage statistics will be collected.'));
      console.log(chalk.gray('You can re-enable anytime with: mosaic telemetry --enable'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to disable telemetry:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Show telemetry status
   */
  private async showStatus() {
    console.log(chalk.blue.bold('📊 Telemetry Status'));
    console.log('═'.repeat(30));
    console.log();

    try {
      const status = this.telemetryService.getStatus();
      
      const statusIcon = status.enabled ? '🟢' : '🔴';
      const statusText = status.enabled ? chalk.green('Enabled') : chalk.red('Disabled');
      
      console.log(`${statusIcon} Status: ${statusText}`);
      
      if (status.installationId) {
        console.log(`🆔 Installation ID: ${chalk.yellow(status.installationId)}`);
      }
      
      if (status.eventCount !== undefined) {
        console.log(`📈 Events Sent: ${chalk.yellow(status.eventCount)}`);
      }
      
      console.log();
      
      if (status.enabled) {
        console.log(chalk.green('✓ Anonymous usage statistics are being collected'));
        console.log(chalk.gray('  This helps improve MosAIc Stack for everyone'));
        console.log();
        console.log(chalk.blue('Management:'));
        console.log(chalk.gray('  mosaic telemetry --disable  - Disable telemetry'));
        console.log(chalk.gray('  mosaic telemetry --info     - Privacy details'));
      } else {
        console.log(chalk.gray('No usage statistics are being collected'));
        console.log();
        console.log(chalk.blue('Management:'));
        console.log(chalk.gray('  mosaic telemetry --enable   - Enable telemetry'));
        console.log(chalk.gray('  mosaic telemetry --info     - Privacy details'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to get telemetry status:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Show privacy information
   */
  private showInfo() {
    this.telemetryService.showPrivacyInfo();
  }
}
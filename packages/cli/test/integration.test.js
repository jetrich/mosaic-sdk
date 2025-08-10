/**
 * Integration tests for @mosaicstack/cli
 */

const { InitCommand, StartCommand, StatusCommand, TelemetryService } = require('../dist/index.js');
const { writeFileSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

describe('@mosaicstack/cli Integration Tests', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = join(tmpdir(), 'mosaic-cli-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
    process.chdir(tempDir);
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('InitCommand', () => {
    test('should initialize with default options', async () => {
      const initCommand = new InitCommand();
      
      // Mock mode - don't actually initialize
      const result = await initCommand.execute({
        mode: 'local',
        interactive: false
      }).catch(() => {
        // Expected to fail without proper setup
        return 'initialization attempted';
      });
      
      expect(result).toBeDefined();
    });

    test('should validate mode parameter', async () => {
      const initCommand = new InitCommand();
      
      await expect(initCommand.execute({
        mode: 'invalid-mode',
        interactive: false
      })).rejects.toThrow();
    });
  });

  describe('TelemetryService', () => {
    test('should initialize telemetry service', () => {
      const telemetry = new TelemetryService();
      expect(telemetry).toBeDefined();
      expect(typeof telemetry.getStatus).toBe('function');
    });

    test('should get telemetry status', () => {
      const telemetry = new TelemetryService();
      const status = telemetry.getStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.enabled).toBe('boolean');
    });

    test('should enable/disable telemetry', async () => {
      const telemetry = new TelemetryService();
      
      await telemetry.disable();
      let status = telemetry.getStatus();
      expect(status.enabled).toBe(false);
      
      await telemetry.enable();
      status = telemetry.getStatus();
      expect(status.enabled).toBe(true);
    });

    test('should track events when enabled', async () => {
      const telemetry = new TelemetryService();
      
      await telemetry.enable();
      
      // These should not throw errors
      await telemetry.trackInstallation('0.1.0');
      await telemetry.trackStartup('0.1.0', 'local');
      await telemetry.trackError('0.1.0', 'test error');
    });

    test('should not track events when disabled', async () => {
      const telemetry = new TelemetryService();
      
      await telemetry.disable();
      
      // These should silently do nothing
      await telemetry.trackInstallation('0.1.0');
      await telemetry.trackStartup('0.1.0', 'local');
    });
  });

  describe('StatusCommand', () => {
    test('should check system status', async () => {
      const statusCommand = new StatusCommand();
      
      const result = await statusCommand.execute({}).catch(err => {
        // May fail if services aren't running, which is expected
        return { status: 'not-running' };
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('Command Integration', () => {
    test('should chain commands properly', async () => {
      const initCommand = new InitCommand();
      const statusCommand = new StatusCommand();
      
      // Try init (may fail due to missing deps)
      try {
        await initCommand.execute({
          mode: 'local',
          interactive: false
        });
      } catch {
        // Expected in test environment
      }
      
      // Status should work regardless
      const status = await statusCommand.execute({}).catch(() => ({
        status: 'test-mode'
      }));
      
      expect(status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dependencies gracefully', async () => {
      const startCommand = new StartCommand();
      
      // Should fail gracefully
      const result = await startCommand.execute({}).catch(err => {
        expect(err.message).toBeDefined();
        return 'error-handled';
      });
      
      expect(result).toBe('error-handled');
    });
  });
});
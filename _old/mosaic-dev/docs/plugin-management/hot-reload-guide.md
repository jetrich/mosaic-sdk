# Tony Framework Hot-Reload Guide

## Overview

The Tony Framework includes a powerful hot-reload system that allows plugins to be automatically reloaded when their source files change during development. This significantly improves the development experience by eliminating the need to manually restart the entire system when making plugin changes.

## Features

- **Automatic File Watching**: Monitors plugin files for changes using efficient native file system watchers
- **Safe Reload Mechanisms**: Validates new plugin versions before reloading to prevent system instability
- **State Preservation**: Maintains plugin state across reloads when possible
- **Dependency Management**: Handles plugin dependencies intelligently during reloads
- **Error Recovery**: Includes rollback mechanisms for failed reloads
- **Configurable**: Extensive configuration options for different development scenarios

## Quick Start

### Basic Usage

```typescript
import { initializePluginSystem } from './core/plugin-system';
import { TonyContext } from './core/types/plugin.interface';

// Create context
const context: TonyContext = {
  version: '2.6.0',
  logger: console,
  services: { /* ... */ }
};

// Initialize plugin system with hot-reload enabled
const pluginSystem = initializePluginSystem(context, {
  hotReload: {
    enabled: true,
    preserveState: true,
    validateBeforeReload: true
  }
});

// Initialize and start hot-reload monitoring
await pluginSystem.initialize();
await pluginSystem.startHotReload();

// Load a plugin
await pluginSystem.loadPlugin('./plugins/my-plugin.js');
```

### Environment-Based Configuration

```typescript
import { getEnvironmentConfig } from './core/hot-reload.config';

// Get configuration for current environment
const config = getEnvironmentConfig(); // Uses NODE_ENV

// Initialize with environment-specific settings
const pluginSystem = initializePluginSystem(context, {
  hotReload: config
});
```

## Configuration

### Hot-Reload Configuration Options

```typescript
interface HotReloadConfig {
  // Core settings
  enabled?: boolean;                    // Enable/disable hot-reload (default: true in dev)
  preserveState?: boolean;              // Preserve plugin state during reload (default: true)
  validateBeforeReload?: boolean;       // Validate new plugin before reload (default: true)
  
  // File watching settings
  debounceDelay?: number;              // Delay before processing changes (default: 500ms)
  recursive?: boolean;                 // Watch subdirectories (default: true)
  extensions?: string[];               // File extensions to watch (default: ['.js', '.ts', '.mjs', '.cjs'])
  ignore?: string[];                   // Patterns to ignore (default: ['node_modules/**', '.git/**'])
  
  // Reload behavior
  maxRetryAttempts?: number;          // Max reload attempts (default: 3)
  reloadDependents?: boolean;         // Reload dependent plugins (default: true)
}
```

### Environment Configurations

#### Development (Default)
```typescript
{
  enabled: true,
  debounceDelay: 300,
  preserveState: true,
  validateBeforeReload: true,
  reloadDependents: true
}
```

#### Production
```typescript
{
  enabled: false,  // Hot-reload disabled in production
  preserveState: false,
  validateBeforeReload: true,
  reloadDependents: false
}
```

#### Testing
```typescript
{
  enabled: false,  // Disabled for predictable tests
  debounceDelay: 100,
  preserveState: false,
  maxRetryAttempts: 1
}
```

## Usage Examples

### Manual Plugin Reload

```typescript
// Manually trigger a plugin reload
const result = await pluginSystem.reloadPlugin('my-plugin');

if (result.success) {
  console.log(`Plugin reloaded: ${result.pluginName}`);
  console.log(`Version: ${result.previousVersion} → ${result.newVersion}`);
} else {
  console.error(`Reload failed: ${result.error}`);
}
```

### Monitoring Reload Events

```typescript
import { PluginSystemEvent } from './core/plugin-system';

// Listen for reload events
pluginSystem.on(PluginSystemEvent.PLUGIN_RELOADED, (result) => {
  console.log(`Plugin ${result.pluginName} reloaded successfully`);
  
  if (result.statePreserved) {
    console.log('Plugin state was preserved');
  }
  
  if (result.dependentsReloaded) {
    console.log(`Also reloaded dependents: ${result.dependentsReloaded.join(', ')}`);
  }
});

// Listen for reload failures
pluginSystem.on(PluginSystemEvent.ERROR_OCCURRED, (event) => {
  if (event.source === 'hot-reload') {
    console.error(`Hot-reload error: ${event.error.message}`);
  }
});
```

### State Preservation

```typescript
// Create a plugin with state management
const myPlugin: TonyPlugin = {
  name: 'stateful-plugin',
  version: '1.0.0',
  description: 'Plugin with state',
  minTonyVersion: '2.6.0',
  
  // Private state
  _state: { counter: 0, data: [] },
  
  // State preservation hooks
  async onDeactivate() {
    // State is automatically captured before reload
    console.log('Deactivating, state will be preserved');
  },
  
  async onActivate() {
    // State is automatically restored after reload
    console.log('Reactivated with preserved state');
  },
  
  // State access methods
  getState() {
    return this._state;
  },
  
  setState(newState: any) {
    this._state = { ...this._state, ...newState };
  }
};
```

### Custom File Watching

```typescript
import { FileWatcher, createFileWatcher } from './core/file-watcher';

// Create custom file watcher
const watcher = createFileWatcher({
  debounceDelay: 200,
  extensions: ['.js', '.ts', '.json'],
  ignore: ['**/test/**', '**/*.spec.*']
});

// Watch specific files or directories
await watcher.watchPath('./plugins');
await watcher.watchPath('./config/plugins.json');

// Handle file changes
watcher.on('change', (event) => {
  console.log(`File ${event.type}: ${event.filePath}`);
  
  if (event.filePath.endsWith('.json')) {
    // Handle configuration changes
    console.log('Configuration file changed');
  }
});
```

## Advanced Usage

### Custom Reload Validation

```typescript
import { HotReloadManager } from './core/hot-reload-manager';

// Extend hot-reload manager with custom validation
class CustomHotReloadManager extends HotReloadManager {
  protected async validateNewPluginVersion(filePath: string) {
    const result = await super.validateNewPluginVersion(filePath);
    
    if (!result.valid) {
      return result;
    }
    
    // Add custom validation logic
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for required exports
      if (!content.includes('export default')) {
        return {
          valid: false,
          errors: ['Plugin must have default export']
        };
      }
      
      // Check for security issues
      if (content.includes('eval(') || content.includes('Function(')) {
        return {
          valid: false,
          errors: ['Plugin contains potentially unsafe code']
        };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }
}
```

### Dependency-Aware Reloading

```typescript
// Plugin with dependencies
const dependentPlugin: TonyPlugin = {
  name: 'dependent-plugin',
  version: '1.0.0',
  description: 'Plugin that depends on others',
  minTonyVersion: '2.6.0',
  
  // Specify dependencies
  dependencies: [
    { name: 'base-plugin', version: '^1.0.0' },
    { name: 'utils-plugin', version: '>=2.0.0', optional: true }
  ],
  
  async onActivate() {
    // Access dependency services
    const basePlugin = this.getDependency('base-plugin');
    const utilsPlugin = this.getDependency('utils-plugin');
    
    if (basePlugin) {
      console.log('Base plugin available');
    }
    
    if (utilsPlugin) {
      console.log('Utils plugin available');
    }
  }
};

// When 'base-plugin' is reloaded, 'dependent-plugin' will also be reloaded
// if reloadDependents is enabled
```

## Best Practices

### 1. Development Workflow
- Enable hot-reload in development environment
- Use TypeScript for better reload validation
- Structure plugins as ES modules for reliable reloading
- Implement proper state management in stateful plugins

### 2. State Management
```typescript
// Good: Explicit state management
const plugin: TonyPlugin = {
  // ...
  _state: new Map(),
  
  getState() {
    return Object.fromEntries(this._state);
  },
  
  restoreState(state: any) {
    this._state = new Map(Object.entries(state));
  }
};

// Avoid: Implicit global state that can't be preserved
let globalCounter = 0; // This won't be preserved across reloads
```

### 3. Error Handling
```typescript
// Implement proper error boundaries
const plugin: TonyPlugin = {
  // ...
  async onActivate() {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error(`Failed to activate: ${error.message}`);
      throw error; // Allow hot-reload system to handle
    }
  },
  
  async onDeactivate() {
    try {
      await this.cleanup();
    } catch (error) {
      this.logger.error(`Cleanup error: ${error.message}`);
      // Don't throw - allow deactivation to complete
    }
  }
};
```

### 4. File Organization
```
plugins/
├── core/
│   ├── base-plugin.ts          # Core functionality
│   └── utils.ts               # Shared utilities
├── features/
│   ├── feature-a.ts           # Individual features
│   └── feature-b.ts
└── config/
    └── plugin-config.json     # Configuration files
```

## Troubleshooting

### Common Issues

#### 1. Plugin Not Reloading
```typescript
// Check if file is being watched
const status = pluginSystem.getHotReloadStatus();
console.log('Watched plugins:', status.watching);

// Verify file extensions
const config = {
  extensions: ['.js', '.ts', '.mjs'] // Make sure your file extension is included
};
```

#### 2. State Not Preserved
```typescript
// Ensure plugin implements state hooks properly
const plugin: TonyPlugin = {
  // ...
  async onDeactivate() {
    // Prepare for state capture
    await this.saveState();
  },
  
  async onActivate() {
    // Restore from captured state
    await this.loadState();
  }
};
```

#### 3. Validation Errors
```typescript
// Check validation errors
pluginSystem.on(PluginSystemEvent.ERROR_OCCURRED, (event) => {
  if (event.source === 'hot-reload') {
    console.error('Validation failed:', event.error.message);
    // Fix plugin issues and save again
  }
});
```

#### 4. Dependency Issues
```typescript
// Check dependency resolution
const resolution = await pluginRegistry.resolveDependencies('my-plugin');
if (!resolution.success) {
  console.error('Dependency conflicts:', resolution.conflicts);
}
```

### Debug Mode

```typescript
// Enable debug logging
const pluginSystem = initializePluginSystem(context, {
  hotReload: {
    enabled: true,
    // ... other config
  }
});

// Log debug information
pluginSystem.on('*', (event) => {
  console.debug('Plugin system event:', event);
});
```

## Performance Considerations

### File Watching Performance
- Use specific file extensions to reduce watch load
- Implement proper ignore patterns for large directories
- Consider debounce delay based on your development workflow

### Memory Management
- Hot-reload properly cleans up previous plugin instances
- State preservation uses minimal memory overhead
- Failed reloads trigger automatic cleanup

### Production Deployment
- Always disable hot-reload in production
- Use proper build processes for plugin deployment
- Implement health checks for plugin stability

## API Reference

### PluginSystem Methods
- `loadPlugin(filePath, config?)` - Load a plugin
- `reloadPlugin(pluginName)` - Manually reload a plugin
- `startHotReload()` - Start hot-reload monitoring
- `stopHotReload()` - Stop hot-reload monitoring
- `getHotReloadStatus()` - Get current hot-reload status

### HotReloadManager Methods
- `watchPlugin(metadata)` - Add plugin to monitoring
- `unwatchPlugin(pluginName)` - Remove plugin from monitoring
- `createStateSnapshot(pluginName)` - Create manual state snapshot
- `restoreStateSnapshot(pluginName)` - Restore state snapshot

### Events
- `reload-started` - Plugin reload initiated
- `reload-completed` - Plugin reload succeeded
- `reload-failed` - Plugin reload failed
- `state-preserved` - Plugin state captured
- `state-restored` - Plugin state restored

For more advanced usage and API details, see the [Plugin System API Documentation](./plugin-system-api.md).
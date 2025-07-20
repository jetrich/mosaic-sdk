# Tony Framework Plugin Registry v2.6.0

The Plugin Registry provides centralized management and discovery of Tony Framework plugins with advanced features including dependency resolution, search capabilities, and metadata tracking.

## Features

### Core Functionality
- **Plugin Registration**: Register plugins from files or directories
- **Metadata Storage**: Store comprehensive plugin information and statistics
- **Dependency Resolution**: Automatic dependency graph resolution with circular dependency detection
- **Search & Query**: Advanced plugin discovery with multiple search criteria
- **Persistence**: Registry data persistence with integrity validation

### Key Components

#### PluginRegistry Class
Central registry for all plugin management operations.

```typescript
import { PluginRegistry, initializePluginRegistry } from 'tony/core';

const registry = initializePluginRegistry(context, pluginLoader);
```

#### Plugin Registration
```typescript
// Register from file with plugin instance
const metadata = await registry.registerPlugin('/path/to/plugin.ts', plugin);

// Register from file (auto-discovery)
const metadata = await registry.registerPlugin('/path/to/plugin.ts');

// Bulk discovery and registration
const results = await discoverAndRegisterPlugins('/plugins/directory');
```

#### Plugin Search & Discovery
```typescript
// Search by name pattern
const results = registry.searchPlugins({ name: '*git*' });

// Search by capabilities
const gitPlugins = registry.getPluginsByCapability(PluginCapability.GIT);

// Advanced search
const results = registry.searchPlugins({
  description: 'file management',
  keywords: ['files', 'utilities'],
  capabilities: [PluginCapability.FILE_SYSTEM],
  isLoaded: true
});
```

#### Dependency Resolution
```typescript
// Resolve dependencies for a plugin
const resolution = registry.resolveDependencies('my-plugin');

console.log(resolution.resolvable); // boolean
console.log(resolution.loadOrder); // ['dep1', 'dep2', 'my-plugin']
console.log(resolution.missing); // Missing dependencies
console.log(resolution.circularDependencies); // Circular dependency chains
```

### Plugin Metadata

Each registered plugin includes comprehensive metadata:

```typescript
interface PluginMetadata {
  plugin: TonyPlugin;           // Plugin definition
  filePath: string;             // Source file location
  registeredAt: Date;           // Registration timestamp
  updatedAt: Date;              // Last update timestamp
  size: number;                 // File size in bytes
  hash: string;                 // File integrity hash
  isLoaded: boolean;            // Currently loaded status
  isActive: boolean;            // Currently active status
  tags: string[];               // Generated tags for categorization
  downloadCount?: number;       // Download statistics
  rating?: number;              // User rating
}
```

### Search Capabilities

The registry supports sophisticated search queries:

```typescript
interface PluginSearchQuery {
  name?: string;                    // Name pattern (supports wildcards)
  description?: string;             // Description text search
  author?: string;                  // Author search
  keywords?: string[];              // Keyword matching
  tags?: string[];                  // Tag filtering
  capabilities?: PluginCapability[]; // Required capabilities
  tonyVersion?: string;             // Tony version compatibility
  state?: PluginState;              // Plugin state filter
  isLoaded?: boolean;               // Load status filter
  isActive?: boolean;               // Active status filter
  minRating?: number;               // Minimum rating filter
}
```

### Dependency Resolution

Advanced dependency management features:

- **Automatic Resolution**: Resolves full dependency trees
- **Load Order Calculation**: Determines correct plugin loading sequence
- **Circular Dependency Detection**: Identifies and reports circular dependencies
- **Optional Dependencies**: Handles optional vs required dependencies
- **Version Compatibility**: Validates version requirements

### Registry Statistics

Get comprehensive registry insights:

```typescript
const stats = registry.getStats();
console.log(stats.totalPlugins);        // Total registered plugins
console.log(stats.loadedPlugins);       // Currently loaded count
console.log(stats.popularCapabilities); // Most used capabilities
console.log(stats.authorDistribution);  // Plugins per author
```

### Persistence & Validation

- **Automatic Persistence**: Registry automatically saves to disk
- **Integrity Validation**: Validates plugin file integrity
- **Registry Validation**: Checks for missing files and dependencies
- **Error Recovery**: Graceful handling of corrupted registry data

### Integration with Plugin Loader

The registry integrates seamlessly with the Plugin Loader:

```typescript
// Sync registry with loader state
await registry.updateFromLoader();

// Registry automatically tracks loaded/active status
const metadata = registry.getPlugin('my-plugin');
console.log(metadata.isLoaded);  // true if loaded in plugin loader
console.log(metadata.isActive);  // true if active in plugin loader
```

## Usage Examples

### Basic Plugin Management
```typescript
import { initializePluginRegistry, initializePluginLoader } from 'tony/core';

// Initialize systems
const loader = initializePluginLoader(context);
const registry = initializePluginRegistry(context, loader);

// Register a plugin
await registry.registerPlugin('/plugins/git-tools.ts');

// Search for git-related plugins
const gitPlugins = registry.searchPlugins({
  keywords: ['git'],
  capabilities: [PluginCapability.GIT]
});

// Resolve dependencies before loading
const resolution = registry.resolveDependencies('git-tools');
if (resolution.resolvable) {
  for (const dep of resolution.loadOrder) {
    await loader.loadPlugin(registry.getPlugin(dep)!.filePath);
  }
}
```

### Plugin Discovery and Installation
```typescript
// Discover plugins in a directory
const discovered = await discoverAndRegisterPlugins('/usr/local/tony/plugins');
console.log(`Discovered ${discovered.length} plugins`);

// Find the best file management plugin
const filePlugins = registry.searchPlugins({
  capabilities: [PluginCapability.FILE_SYSTEM],
  minRating: 4.0
});

const bestPlugin = filePlugins[0]; // Sorted by relevance score
```

### Dependency Management
```typescript
// Check if a plugin can be safely loaded
const resolution = registry.resolveDependencies('complex-plugin');

if (!resolution.resolvable) {
  console.error('Cannot load plugin due to missing dependencies:', 
    resolution.missing.map(d => d.name));
} else if (resolution.circularDependencies.length > 0) {
  console.error('Circular dependencies detected:', 
    resolution.circularDependencies);
} else {
  console.log('Safe to load. Load order:', resolution.loadOrder);
}
```

### Registry Maintenance
```typescript
// Validate registry integrity
const validation = await registry.validateRegistry();
if (!validation.valid) {
  console.error('Registry issues found:', validation.errors);
}

// Get registry statistics
const stats = registry.getStats();
console.log(`Registry contains ${stats.totalPlugins} plugins`);
console.log(`Most popular capability: ${stats.popularCapabilities[0].capability}`);

// Clean up registry
await registry.clearRegistry(); // Removes all registrations
```

## API Reference

### Core Methods
- `registerPlugin(filePath, plugin?)` - Register a plugin
- `unregisterPlugin(name)` - Remove plugin registration
- `getPlugin(name)` - Get plugin metadata
- `listPlugins()` - List all registered plugins
- `searchPlugins(query)` - Search with criteria
- `resolveDependencies(name)` - Resolve plugin dependencies

### Query Methods
- `getPluginsByCapability(capability)` - Filter by capability
- `getPluginsByAuthor(author)` - Filter by author
- `getPluginsByTag(tag)` - Filter by tag
- `getStats()` - Get registry statistics

### Maintenance Methods
- `persistRegistry()` - Save registry to disk
- `loadRegistry()` - Load registry from disk
- `validateRegistry()` - Validate registry integrity
- `clearRegistry()` - Clear all registrations
- `updateFromLoader()` - Sync with plugin loader

## Integration Points

The Plugin Registry integrates with:
- **Plugin Loader**: Automatic status synchronization
- **Tony Context**: Logger and path integration
- **File System**: Plugin discovery and validation
- **Version System**: Compatibility checking

## Security Considerations

- Plugin file integrity validation
- Dependency chain validation
- Safe handling of missing or corrupted files
- Error boundaries around plugin operations
- Secure file path resolution

This registry system provides a robust foundation for plugin management in the Tony Framework, enabling sophisticated plugin ecosystems with reliable dependency management and discovery capabilities.
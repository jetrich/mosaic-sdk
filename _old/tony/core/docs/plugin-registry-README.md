# Tony Framework Plugin Registry v2.6.0

The Plugin Registry provides centralized management for Tony plugins with advanced dependency tracking, search capabilities, and integrity validation.

## Key Features

### 🔍 Plugin Discovery & Registration
- **Automatic Discovery**: Scan directories for plugin files
- **Source Tracking**: Track plugins from different sources (local files, Git repos, NPM packages)
- **Metadata Extraction**: Automatically extract and validate plugin metadata
- **Integrity Checking**: File hash validation and modification detection

### 📦 Dependency Management
- **Dependency Resolution**: Resolve complex dependency chains with conflict detection
- **Circular Dependency Detection**: Identify and report circular dependencies
- **Optional Dependencies**: Support for optional plugin dependencies
- **Version Compatibility**: Semantic version matching and validation

### 🔎 Advanced Search & Filtering
- **Multi-criteria Search**: Search by name, author, keywords, capabilities
- **Flexible Filtering**: Filter by plugin status, version compatibility, and more
- **Sorting & Pagination**: Sort results and paginate large result sets
- **Relevance Scoring**: Intelligent relevance scoring for search results

### 📊 Registry Statistics & Analytics
- **Usage Tracking**: Monitor plugin load counts, activation frequency
- **Performance Metrics**: Track load times and runtime statistics
- **Capability Analysis**: Analyze most popular capabilities and authors
- **Health Monitoring**: Registry health metrics and validation status

### 🔄 Event System
- **Registry Events**: Listen for plugin registration, updates, and removal
- **Real-time Updates**: Get notified of registry changes in real-time
- **Event Subscription**: Subscribe/unsubscribe to specific registry events

### 💾 Persistence & Synchronization
- **Registry Persistence**: Save/load registry state to/from disk
- **Backup Support**: Automatic backup creation before registry updates
- **Validation**: Comprehensive registry integrity validation
- **Synchronization**: Sync with external plugin sources

## Usage Examples

### Basic Registration
```typescript
import { initializePluginRegistry, PluginSourceType } from './plugin-registry';

// Initialize registry
const registry = initializePluginRegistry(context, pluginLoader);

// Register a plugin
const source = {
  type: PluginSourceType.LOCAL,
  location: '/path/to/plugin.ts'
};

const entry = await registry.register(myPlugin, source);
```

### Advanced Search
```typescript
// Search with criteria
const criteria = {
  query: 'git',
  capabilities: ['git'],
  sort: { field: 'name', direction: 'asc' },
  limit: 10
};

const results = await registry.search(criteria);
console.log(`Found ${results.totalCount} plugins`);
```

### Dependency Resolution
```typescript
// Resolve dependencies with options
const options = {
  includeOptional: true,
  resolveTransitive: true,
  maxDepth: 5
};

const result = await registry.resolveDependencies('my-plugin', options);
if (result.success) {
  console.log('Install order:', result.installOrder);
} else {
  console.log('Conflicts:', result.conflicts);
}
```

### Event Handling
```typescript
// Listen for registry events
registry.on(PluginRegistryEvent.PLUGIN_REGISTERED, (data) => {
  console.log(`Plugin ${data.plugin} registered`);
});

registry.on(PluginRegistryEvent.DEPENDENCIES_RESOLVED, (data) => {
  console.log('Dependencies resolved:', data);
});
```

## Plugin Sources

The registry supports multiple plugin sources:

- **LOCAL**: Local file system plugins
- **GIT**: Git repository plugins
- **NPM**: NPM package plugins
- **HTTP**: HTTP/HTTPS downloadable plugins
- **REGISTRY**: Tony plugin registry

Each source type can include additional metadata for tracking and validation.

## Plugin Status Types

- **AVAILABLE**: Plugin is registered and available for use
- **INSTALLED**: Plugin is installed and loaded
- **UPDATING**: Plugin is currently being updated
- **CONFLICTED**: Plugin has dependency conflicts
- **DEPRECATED**: Plugin is deprecated
- **INCOMPATIBLE**: Plugin is incompatible with current Tony version
- **INVALID**: Plugin has validation errors

## Registry Validation

The registry provides comprehensive validation:

- **File Integrity**: Verify plugins haven't been modified since registration
- **Dependency Validation**: Ensure all required dependencies are available
- **Version Compatibility**: Check Tony version compatibility
- **Metadata Validation**: Validate plugin metadata structure

## Performance Considerations

- **Lazy Loading**: Plugin metadata is loaded on-demand
- **Efficient Indexing**: Multiple indices for fast search and filtering
- **Caching**: Search results and dependency resolution caching
- **Background Sync**: Non-blocking registry synchronization

## Architecture

The registry is built with a modular architecture:

- **Registry Core**: Main registry logic and storage
- **Search Engine**: Advanced search and filtering capabilities  
- **Dependency Resolver**: Complex dependency resolution with conflict detection
- **Event System**: Real-time event notifications
- **Persistence Layer**: Registry serialization and backup management

## Integration

The registry integrates seamlessly with:

- **Plugin Loader**: Automatic sync with loaded plugin state
- **Tony Core**: Deep integration with Tony framework services
- **External Sources**: Support for external plugin repositories
- **CI/CD Systems**: Integration with automated plugin deployment

## Error Handling

Comprehensive error handling for:

- **Registration Failures**: Detailed error reporting for failed registrations
- **Dependency Conflicts**: Clear conflict resolution guidance
- **Validation Errors**: Specific validation error descriptions
- **I/O Errors**: Graceful handling of file system errors

This registry system provides the foundation for Tony's extensible plugin ecosystem, enabling developers to easily discover, install, and manage plugins while maintaining system integrity and performance.
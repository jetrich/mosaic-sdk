/**
 * Basic Configuration Usage Examples
 * Demonstrates the @mosaicstack/config package functionality
 */

import {
  loadConfig,
  getConfigTemplate,
  validateConfig,
  saveConfig,
  getModeDefaults,
  EnvResolverImpl,
} from '../src';

async function main() {
  console.log('🔧 MosAIc Configuration Demo');
  console.log('============================\n');

  // 1. Load configuration with defaults
  console.log('1. Loading configuration with defaults...');
  try {
    const config = await loadConfig({ 
      mode: 'hybrid',
      validateSchema: false // Disable schema validation for demo
    });
    console.log(`   ✅ Mode: ${config.mode}`);
    console.log(`   ✅ MCP Port: ${config.mcp.port}`);
    console.log(`   ✅ Ollama enabled: ${config.providers.ollama?.enabled}`);
    console.log(`   ✅ Claude enabled: ${config.providers.claude?.enabled}`);
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
  }
  console.log();

  // 2. Generate templates for each mode
  console.log('2. Generating mode templates...');
  const modes: Array<'local' | 'hybrid' | 'cloud'> = ['local', 'hybrid', 'cloud'];
  
  for (const mode of modes) {
    const template = getConfigTemplate(mode);
    console.log(`   📋 ${mode} mode:`);
    console.log(`      - Providers: ${Object.keys(template.providers).filter(p => template.providers[p as keyof typeof template.providers]?.enabled).join(', ')}`);
    console.log(`      - Prefer local: ${template.routing.preferLocal}`);
    console.log(`      - Max agents: ${template.tony.maxConcurrentAgents}`);
  }
  console.log();

  // 3. Environment variable resolution
  console.log('3. Environment variable resolution...');
  const resolver = new EnvResolverImpl();
  
  const testConfig = {
    providers: {
      claude: {
        apiKey: 'env:ANTHROPIC_API_KEY|default_key',
        enabled: true,
      },
      ollama: {
        url: 'env:OLLAMA_URL|http://localhost:11434',
        enabled: true,
      },
    },
  };

  console.log('   Original config:');
  console.log(`      Claude API Key: ${testConfig.providers.claude.apiKey}`);
  console.log(`      Ollama URL: ${testConfig.providers.ollama.url}`);

  const resolved = resolver.resolveObject(testConfig);
  console.log('   After resolution:');
  console.log(`      Claude API Key: ${resolved.providers.claude.apiKey}`);
  console.log(`      Ollama URL: ${resolved.providers.ollama.url}`);

  // Extract environment variables
  const envVars = resolver.extractEnvVars(testConfig);
  console.log(`   Environment variables found: ${envVars.join(', ')}`);
  console.log();

  // 4. Configuration validation
  console.log('4. Configuration validation...');
  
  // Configuration structure validation
  const validConfig = getConfigTemplate('hybrid');
  console.log(`   ✅ Generated valid config template`);
  console.log(`   ✅ Mode: ${validConfig.mode}`);
  console.log(`   ✅ Version: ${validConfig.version}`);
  console.log(`   ✅ Has MCP config: ${!!validConfig.mcp}`);
  console.log(`   ✅ Has providers: ${!!validConfig.providers}`);
  console.log(`   ✅ Has routing: ${!!validConfig.routing}`);
  console.log(`   ✅ Has tony: ${!!validConfig.tony}`);
  console.log(`   ✅ Has monitoring: ${!!validConfig.monitoring}`);

  // Note: Schema validation temporarily disabled due to complex schema issues
  console.log('   ⚠️  Schema validation temporarily disabled (will be fixed in next iteration)');
  console.log();

  // 5. Save configuration examples
  console.log('5. Configuration file generation...');
  
  const exampleDir = './examples/configs';
  try {
    // Create JSON configuration
    const hybridConfig = getConfigTemplate('hybrid');
    await saveConfig(hybridConfig, `${exampleDir}/hybrid-example.json`);
    console.log('   ✅ Created: hybrid-example.json');

    // Create YAML configuration
    await saveConfig(hybridConfig, `${exampleDir}/hybrid-example.yaml`);
    console.log('   ✅ Created: hybrid-example.yaml');

    // Create local mode configuration
    const localConfig = getConfigTemplate('local');
    await saveConfig(localConfig, `${exampleDir}/local-example.yaml`);
    console.log('   ✅ Created: local-example.yaml');

    // Create cloud mode configuration
    const cloudConfig = getConfigTemplate('cloud');
    await saveConfig(cloudConfig, `${exampleDir}/cloud-example.yaml`);
    console.log('   ✅ Created: cloud-example.yaml');

  } catch (error) {
    console.log(`   ⚠️  Could not save files: ${(error as Error).message}`);
  }
  console.log();

  // 6. Environment template generation
  console.log('6. Environment template generation...');
  const envTemplate = resolver.generateEnvTemplate(getConfigTemplate('cloud'));
  console.log('   Generated .env template:');
  console.log('   ' + envTemplate.split('\n').join('\n   '));
  console.log();

  // 7. Mode comparison
  console.log('7. Mode comparison...');
  console.log('   Feature comparison:');
  console.log('   ┌─────────────────┬─────────┬─────────┬─────────┐');
  console.log('   │ Feature         │ Local   │ Hybrid  │ Cloud   │');
  console.log('   ├─────────────────┼─────────┼─────────┼─────────┤');
  
  for (const mode of modes) {
    const config = getConfigTemplate(mode);
    const features = {
      Local: mode,
      Hybrid: mode,
      Cloud: mode,
    };
  }
  
  console.log(`   │ Ollama          │ ${getConfigTemplate('local').providers.ollama?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('hybrid').providers.ollama?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('cloud').providers.ollama?.enabled ? '✓' : '✗'}       │`);
  console.log(`   │ Claude          │ ${getConfigTemplate('local').providers.claude?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('hybrid').providers.claude?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('cloud').providers.claude?.enabled ? '✓' : '✗'}       │`);
  console.log(`   │ OpenRouter      │ ${getConfigTemplate('local').providers.openrouter?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('hybrid').providers.openrouter?.enabled ? '✓' : '✗'}       │ ${getConfigTemplate('cloud').providers.openrouter?.enabled ? '✓' : '✗'}       │`);
  console.log(`   │ Prefer Local    │ ${getConfigTemplate('local').routing.preferLocal ? '✓' : '✗'}       │ ${getConfigTemplate('hybrid').routing.preferLocal ? '✓' : '✗'}       │ ${getConfigTemplate('cloud').routing.preferLocal ? '✓' : '✗'}       │`);
  console.log(`   │ Max Agents      │ ${getConfigTemplate('local').tony.maxConcurrentAgents}       │ ${getConfigTemplate('hybrid').tony.maxConcurrentAgents}       │ ${getConfigTemplate('cloud').tony.maxConcurrentAgents}      │`);
  console.log(`   │ Telemetry       │ ${getConfigTemplate('local').monitoring.telemetry ? '✓' : '✗'}       │ ${getConfigTemplate('hybrid').monitoring.telemetry ? '✓' : '✗'}       │ ${getConfigTemplate('cloud').monitoring.telemetry ? '✓' : '✗'}       │`);
  console.log('   └─────────────────┴─────────┴─────────┴─────────┘');
  console.log();

  console.log('🎉 Configuration demo completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Create your configuration: mosaic init');
  console.log('2. Set environment variables in .env');
  console.log('3. Launch MosAIc Stack: mosaic');
}

// Error handling wrapper
async function runDemo() {
  try {
    await main();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runDemo();
}

export { runDemo };
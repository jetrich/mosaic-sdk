/**
 * Simple Configuration Test
 * Basic test without schema validation
 */

import { getModeDefaults, EnvResolverImpl } from '../src';

function main() {
  console.log('🔧 Simple MosAIc Configuration Test');
  console.log('===================================\n');

  // 1. Test mode defaults
  console.log('1. Testing mode defaults...');
  const modes: Array<'local' | 'hybrid' | 'cloud'> = ['local', 'hybrid', 'cloud'];
  
  for (const mode of modes) {
    const config = getModeDefaults(mode);
    console.log(`   ${mode}: ✅ Generated config with ${Object.keys(config).length} top-level properties`);
    console.log(`      Providers: ${Object.keys(config.providers || {}).length}`);
    console.log(`      MCP Port: ${config.mcp?.port}`);
  }
  console.log();

  // 2. Test environment resolver
  console.log('2. Testing environment resolver...');
  const resolver = new EnvResolverImpl();
  
  const testConfig = {
    apiKey: 'env:TEST_KEY|default_value',
    url: 'env:TEST_URL|http://localhost:3000',
    literal: 'literal_value',
  };

  console.log('   Before resolution:', testConfig);
  const resolved = resolver.resolveObject(testConfig);
  console.log('   After resolution:', resolved);
  
  const envVars = resolver.extractEnvVars(testConfig);
  console.log(`   Environment variables: ${envVars.join(', ')}`);
  console.log();

  // 3. Test configuration structure
  console.log('3. Testing configuration structure...');
  const hybridConfig = getModeDefaults('hybrid');
  
  const hasRequiredProperties = [
    'mode',
    'version', 
    'mcp',
    'providers',
    'routing',
    'tony',
    'monitoring'
  ].every(prop => prop in hybridConfig);
  
  console.log(`   ✅ Has all required properties: ${hasRequiredProperties}`);
  
  // Check providers structure
  const providers = hybridConfig.providers || {};
  console.log(`   ✅ Ollama enabled: ${providers.ollama?.enabled}`);
  console.log(`   ✅ Claude enabled: ${providers.claude?.enabled}`);
  console.log(`   ✅ OpenRouter enabled: ${providers.openrouter?.enabled}`);
  console.log();

  console.log('🎉 Simple test completed successfully!');
}

main();
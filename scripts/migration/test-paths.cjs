#!/usr/bin/env node
/**
 * Test the MosaicPaths system
 */

const { MosaicPaths } = require("../../packages/config/dist/paths");

console.log("🧪 Testing MosAIc Path Resolution System");
console.log("=======================================");

// Test path resolution
console.log("\n📁 Path Resolution:");
const paths = MosaicPaths.getAllPaths();
console.log(`  Config: ${paths.config}`);
console.log(`  Data: ${paths.data}`);
console.log(`  Cache: ${paths.cache}`);
console.log(`  Logs: ${paths.logs}`);
console.log(`  Legacy: ${paths.legacy}`);

// Test migration status
console.log("\n🔍 Migration Status:");
const status = MosaicPaths.getMigrationStatus();
console.log(`  Status: ${status.status}`);
console.log(`  Legacy Path: ${status.legacyPath}`);
console.log(`  XDG Path: ${status.xdgPath}`);
console.log(`  Is Symlink: ${status.isSymlink}`);
console.log(`  Needs Migration: ${status.needsMigration}`);

// Test path resolution with relative paths
console.log("\n🔗 Path Resolution Test:");
const configPath = MosaicPaths.resolvePath("config.json");
const dataPath = MosaicPaths.resolveDataPath("mcp.db");
const logPath = MosaicPaths.resolveStatePath("logs/app.log");

console.log(`  Config file: ${configPath}`);
console.log(`  Data file: ${dataPath}`);
console.log(`  Log file: ${logPath}`);

// Test environment paths
console.log("\n🌍 Environment Paths:");
const envPaths = MosaicPaths.getEnvironmentPaths();
console.log(`  XDG_CONFIG_HOME: ${envPaths.XDG_CONFIG_HOME}`);
console.log(`  XDG_DATA_HOME: ${envPaths.XDG_DATA_HOME}`);
console.log(`  XDG_CACHE_HOME: ${envPaths.XDG_CACHE_HOME}`);
console.log(`  XDG_STATE_HOME: ${envPaths.XDG_STATE_HOME}`);

console.log("\n✅ Path system test completed!");

if (status.needsMigration) {
  console.log("\n⚠️  Migration recommended:");
  console.log("   Run: ./scripts/migration/migrate-to-xdg.sh");
} else if (status.isSymlink) {
  console.log("\n✅ Migration completed with backward compatibility");
} else {
  console.log("\n✅ Using XDG-compliant paths");
}

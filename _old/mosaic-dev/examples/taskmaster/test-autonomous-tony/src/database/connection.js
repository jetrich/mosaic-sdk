/**
 * @fileoverview SQLite3 database connection module using better-sqlite3
 * Provides database connection with error handling and WAL mode for concurrency
 */

const Database = require('better-sqlite3');
const path = require('path');

/**
 * Database configuration
 */
const DB_CONFIG = {
  filename: path.join(process.cwd(), 'taskmaster.db'),
  options: {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    fileMustExist: false,
  },
};

/**
 * Database instance
 * @type {Database|null}
 */
let dbInstance = null;

/**
 * Initialize database connection
 * @returns {Database} Database instance
 * @throws {Error} If connection fails
 */
function initializeDatabase() {
  try {
    if (dbInstance) {
      return dbInstance;
    }

    dbInstance = new Database(DB_CONFIG.filename, DB_CONFIG.options);
    
    // Enable WAL mode for better concurrency
    dbInstance.pragma('journal_mode = WAL');
    
    // Set synchronous mode for better performance
    dbInstance.pragma('synchronous = NORMAL');
    
    // Set foreign key constraints
    dbInstance.pragma('foreign_keys = ON');
    
    console.log('Database connection established successfully');
    return dbInstance;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

/**
 * Get database instance
 * @returns {Database} Database instance
 */
function getDatabase() {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 * @returns {void}
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
  }
}

/**
 * Check if database is connected
 * @returns {boolean} True if connected
 */
function isConnected() {
  try {
    if (!dbInstance) {
      return false;
    }
    // Test connection with a simple query
    dbInstance.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    return false;
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  isConnected,
};
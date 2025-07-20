/**
 * @fileoverview Unit tests for database connection module
 */

const fs = require('fs');
const path = require('path');
const connection = require('./connection');

describe('Database Connection Module', () => {
  const testDbPath = path.join(process.cwd(), 'test-taskmaster.db');

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Override DB_CONFIG for testing
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Clean up test database
    connection.closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initializeDatabase', () => {
    test('should create database instance successfully', () => {
      const db = connection.initializeDatabase();
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
    });

    test('should return same instance on multiple calls', () => {
      const db1 = connection.initializeDatabase();
      const db2 = connection.initializeDatabase();
      expect(db1).toBe(db2);
    });

    test('should enable WAL mode', () => {
      const db = connection.initializeDatabase();
      const result = db.prepare('PRAGMA journal_mode').get();
      expect(result.journal_mode).toBe('wal');
    });

    test('should enable foreign keys', () => {
      const db = connection.initializeDatabase();
      const result = db.prepare('PRAGMA foreign_keys').get();
      expect(result.foreign_keys).toBe(1);
    });
  });

  describe('getDatabase', () => {
    test('should return database instance', () => {
      const db = connection.getDatabase();
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
    });

    test('should initialize database if not already done', () => {
      const db = connection.getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe('isConnected', () => {
    test('should return true when connected', () => {
      connection.initializeDatabase();
      expect(connection.isConnected()).toBe(true);
    });

    test('should return false when not connected', () => {
      connection.closeDatabase();
      expect(connection.isConnected()).toBe(false);
    });

    test('should handle database errors gracefully', () => {
      const db = connection.initializeDatabase();
      db.close(); // Force close to simulate error
      expect(connection.isConnected()).toBe(false);
    });
  });

  describe('closeDatabase', () => {
    test('should close database connection', () => {
      connection.initializeDatabase();
      expect(connection.isConnected()).toBe(true);
      
      connection.closeDatabase();
      expect(connection.isConnected()).toBe(false);
    });

    test('should handle multiple close calls gracefully', () => {
      connection.initializeDatabase();
      connection.closeDatabase();
      expect(() => connection.closeDatabase()).not.toThrow();
    });
  });

  describe('database operations', () => {
    test('should allow basic SQL operations', () => {
      const db = connection.getDatabase();
      
      // Create a test table with unique name
      const tableName = `test_table_${Date.now()}`;
      db.exec(`
        CREATE TABLE ${tableName} (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Insert test data
      const stmt = db.prepare(`INSERT INTO ${tableName} (name) VALUES (?)`);
      const result = stmt.run('test_name');
      
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);

      // Query test data
      const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      const row = selectStmt.get(1);
      
      expect(row).toEqual({
        id: 1,
        name: 'test_name'
      });
    });
  });
});
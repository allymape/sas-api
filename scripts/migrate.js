#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const MIGRATIONS_DIR = path.join(__dirname, "..", "src", "database", "migrations");

function getConnectionConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: process.env.TIMEZONE || "+03:00",
    multipleStatements: true,
  };
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS node_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      migration VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_node_migrations_migration (migration)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.query("SELECT migration FROM node_migrations");
  return new Set((rows || []).map((row) => row.migration));
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort();
}

async function run() {
  const connection = await mysql.createConnection(getConnectionConfig());

  try {
    await ensureMigrationsTable(connection);
    const executed = await getExecutedMigrations(connection);
    const files = getMigrationFiles();

    if (!files.length) {
      console.log("No migration files found.");
      return;
    }

    let ranCount = 0;

    for (const file of files) {
      if (executed.has(file)) {
        continue;
      }

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migration = require(migrationPath);

      if (!migration || typeof migration.up !== "function") {
        throw new Error(`Migration "${file}" must export an "up" function.`);
      }

      console.log(`Running migration: ${file}`);
      await migration.up(connection);
      await connection.query("INSERT INTO node_migrations (migration) VALUES (?)", [file]);
      ranCount += 1;
    }

    console.log(ranCount > 0 ? `Done. Ran ${ranCount} migration(s).` : "No pending migrations.");
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error.message || error);
  process.exit(1);
});

import knex, { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Define the type for a migration module
interface MigrationModule {
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
  description: string;
}

// Database configuration
const DB_CONFIG = {
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === 'true'
  },
  migrations: {
    tableName: 'migration_versions'
  }
};

// Load migrations from the migrations directory
function loadMigrations(): Record<string, MigrationModule> {
  const migrationsDir = path.join(__dirname, '../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  
  const migrations: Record<string, MigrationModule> = {};
  
  for (const file of migrationFiles) {
    // Extract version from filename (e.g., 01_create_users.ts -> 01)
    const version = file.split('_')[0];
    
    // Import migration module
    const migrationPath = path.join(migrationsDir, file);
    try {
      const migration = require(migrationPath).default as MigrationModule;
      
      // Validate migration module
      if (!migration || typeof migration.up !== 'function' || typeof migration.down !== 'function') {
        console.warn(`Invalid migration module in ${file}, skipping`);
        continue;
      }
      
      migrations[version] = migration;
    } catch (error) {
      throw new Error(`Error loading migration from ${file}: ${error}`);
    }
  }
  
  return migrations;
}

// Ensure migration table exists
async function initializeMigrationTable(db: Knex): Promise<void> {
  const tableExists = await db.schema.hasTable('migration_versions');
  
  if (!tableExists) {
    await db.schema.createTable('migration_versions', table => {
      table.increments('id').primary();
      table.string('version').notNullable().unique();
      table.timestamp('applied_at').defaultTo(db.fn.now());
      table.string('description').notNullable();
    });
    
    // Create an index on the version column for faster lookups
    await db.schema.alterTable('migration_versions', table => {
      table.index(['version']);
    });
    
    console.log('Created migration_versions table');
  }
}

// Get already applied migrations
async function getAppliedMigrations(db: Knex): Promise<string[]> {
  const migrations = await db('migration_versions')
    .select('version')
    .orderBy('id', 'asc');
  
  return migrations.map(m => m.version);
}

// Run a migration
async function runMigration(db: Knex, migration: MigrationModule, version: string): Promise<void> {
  // Run migration in a transaction
  const trx = await db.transaction();
  
  try {
    console.log(`Applying migration ${version}`);
    await migration.up(trx);
    
    // Record migration
    await trx('migration_versions').insert({
      version,
      description: migration.description
    });
    
    await trx.commit();
    console.log(`Migration ${version} applied successfully`);
  } catch (error) {
    await trx.rollback();
    console.error(`Error applying migration ${version}:`, error);
    throw error;
  }
}

// Rollback a migration
async function rollbackMigration(db: Knex, migration: MigrationModule, version: string): Promise<void> {
  // Run rollback in a transaction
  const trx = await db.transaction();
  
  try {
    console.log(`Rolling back migration ${version}`);
    await migration.down(trx);
    
    // Remove migration record
    await trx('migration_versions')
      .where('version', version)
      .delete();
    
    await trx.commit();
    console.log(`Migration ${version} rolled back successfully`);
  } catch (error) {
    await trx.rollback();
    console.error(`Error rolling back migration ${version}:`, error);
    throw error;
  }
}

// Migrate up
async function migrateUp(db: Knex): Promise<void> {
  await initializeMigrationTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const migrations = loadMigrations();
  
  // Filter out already applied migrations
  const pendingMigrations = Object.entries(migrations)
    .filter(([version]) => !appliedMigrations.includes(version))
    .sort(([versionA], [versionB]) => versionA.localeCompare(versionB));
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  // Run migrations in order
  for (const [version, migration] of pendingMigrations) {
    await runMigration(db, migration, version);
  }
  
  console.log('Migration complete');
}

// Migrate down
async function migrateDown(db: Knex): Promise<void> {
  await initializeMigrationTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  
  if (appliedMigrations.length === 0) {
    console.log('No migrations to roll back');
    return;
  }
  
  const lastAppliedVersion = appliedMigrations[appliedMigrations.length - 1];
  const migrations = loadMigrations();
  
  if (!migrations[lastAppliedVersion]) {
    console.error(`Migration ${lastAppliedVersion} not found`);
    return;
  }
  
  await rollbackMigration(db, migrations[lastAppliedVersion], lastAppliedVersion);
  console.log('Rollback complete');
}

// Show migration status
async function migrationStatus(db: Knex): Promise<void> {
  await initializeMigrationTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const migrations = loadMigrations();
  
  console.log('Migration Status:');
  console.log('=================');
  
  const sortedVersions = Object.keys(migrations).sort((a, b) => a.localeCompare(b));
  
  let appliedCount = 0;
  let pendingCount = 0;
  
  for (const version of sortedVersions) {
    const isApplied = appliedMigrations.includes(version);
    const status = isApplied ? 'Applied' : 'Pending';
    const statusColor = isApplied ? '\x1b[32m' : '\x1b[33m'; // Green for applied, yellow for pending
    
    console.log(`${statusColor}${status}\x1b[0m: ${version} - ${migrations[version].description}`);
    
    if (isApplied) {
      appliedCount++;
    } else {
      pendingCount++;
    }
  }
  
  console.log('=================');
  console.log(`Total: ${sortedVersions.length}, Applied: ${appliedCount}, Pending: ${pendingCount}`);
}

// Main entry point
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();
  
  // Initialize Knex with database configuration
  const db = knex(DB_CONFIG);
  
  try {
    const command = process.argv[2]?.toLowerCase();
    
    switch (command) {
      case 'up':
        await migrateUp(db);
        break;
      case 'down':
        await migrateDown(db);
        break;
      case 'status':
        await migrationStatus(db);
        break;
      default:
        console.log('Usage: ts-node src/index.ts <command>');
        console.log('Commands:');
        console.log('  up     - Apply all pending migrations');
        console.log('  down   - Rollback the most recent migration');
        console.log('  status - Show status of all migrations');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.destroy();
  }
}

// Run the main function
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
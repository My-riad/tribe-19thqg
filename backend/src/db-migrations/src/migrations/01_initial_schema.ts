import Knex from 'knex'; // ^2.4.0

export async function up(knex: Knex): Promise<void> {
  // Run migration in a transaction for atomicity
  return knex.transaction(async (trx) => {
    // Create PostgreSQL extensions
    await trx.raw('CREATE EXTENSION IF NOT EXISTS postgis');
    await trx.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await trx.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');

    // Create migration_versions table to track applied migrations
    await trx.schema.createTable('migration_versions', (table) => {
      table.increments('id').primary();
      table.string('version', 50).notNullable();
      table.timestamp('applied_at').notNullable().defaultTo(trx.fn.now());
      table.text('description').nullable();
    });

    // Create enum types
    await trx.raw(`
      CREATE TYPE user_role AS ENUM ('USER', 'TRIBE_CREATOR', 'ADMIN');
    `);
    
    await trx.raw(`
      CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');
    `);
    
    await trx.raw(`
      CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE', 'APPLE', 'FACEBOOK');
    `);

    // Create users table
    await trx.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.specificType('role', 'user_role').notNullable().defaultTo('USER');
      table.specificType('status', 'user_status').notNullable().defaultTo('PENDING');
      table.specificType('auth_provider', 'auth_provider').notNullable().defaultTo('LOCAL');
      table.string('provider_id', 255).nullable();
      table.boolean('is_verified').notNullable().defaultTo(false);
      table.string('verification_token', 255).nullable();
      table.string('reset_password_token', 255).nullable();
      table.timestamp('reset_password_expires').nullable();
      table.timestamp('last_login').nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
    });

    // Create indexes for users table
    await trx.raw('CREATE INDEX users_email_idx ON users (email)');
    await trx.raw('CREATE INDEX users_auth_provider_provider_id_idx ON users (auth_provider, provider_id)');

    // Create unique constraint for provider_id with auth_provider
    await trx.raw(`
      ALTER TABLE users ADD CONSTRAINT provider_id_unique 
      UNIQUE (auth_provider, provider_id) 
      WHERE provider_id IS NOT NULL
    `);

    // Record the initial migration in the migration_versions table
    await trx('migration_versions').insert({
      version: '01_initial_schema',
      description: 'Initial database schema setup'
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  // Run rollback in a transaction for atomicity
  return knex.transaction(async (trx) => {
    // Drop users table
    await trx.schema.dropTableIfExists('users');
    
    // Drop enum types in reverse order
    await trx.raw('DROP TYPE IF EXISTS auth_provider');
    await trx.raw('DROP TYPE IF EXISTS user_status');
    await trx.raw('DROP TYPE IF EXISTS user_role');

    // Drop migration_versions table
    await trx.schema.dropTableIfExists('migration_versions');
    
    // Drop PostgreSQL extensions in reverse order
    await trx.raw('DROP EXTENSION IF EXISTS pg_trgm');
    await trx.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
    await trx.raw('DROP EXTENSION IF EXISTS postgis');
  });
}
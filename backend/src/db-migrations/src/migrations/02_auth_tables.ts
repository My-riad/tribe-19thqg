import { Knex } from 'knex'; // v2.4.0

/**
 * Migration to create all authentication-related tables.
 * This includes tables for tokens, sessions, OAuth providers, 
 * login monitoring, and security questions for account recovery.
 */
export async function up(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Create tokens table for auth tokens (access, refresh, etc.)
    await trx.schema.createTable('tokens', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('token', 255).notNullable();
      table.string('type', 50).notNullable().comment('Type of token: access, refresh, verification, password_reset');
      table.timestamp('expires_at').notNullable();
      table.boolean('blacklisted').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Add indexes for performance
      table.unique(['token', 'type']);
      table.index(['user_id', 'type']);
      table.index(['expires_at']);
      table.index(['blacklisted']);
    });

    // Create auth_sessions table for tracking user sessions
    await trx.schema.createTable('auth_sessions', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('refresh_token_id').notNullable().unique().references('id').inTable('tokens').onDelete('CASCADE');
      table.jsonb('device_info').nullable().comment('Device information for security monitoring');
      table.string('ip_address', 45).nullable();
      table.text('user_agent').nullable();
      table.timestamp('last_active').notNullable().defaultTo(trx.fn.now());
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      
      // Add indexes for performance
      table.index(['user_id']);
      table.index(['expires_at']);
    });

    // Create auth_providers table for OAuth providers (Google, Apple, etc.)
    await trx.schema.createTable('auth_providers', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('provider', 50).notNullable().comment('OAuth provider name: google, apple, facebook, etc.');
      table.string('provider_user_id', 255).notNullable().comment('User ID from the provider');
      table.jsonb('provider_data').nullable().comment('Additional data from provider');
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Add indexes for performance and constraints
      table.unique(['provider', 'provider_user_id']);
      table.unique(['user_id', 'provider']);
    });

    // Create login_attempts table for security monitoring
    await trx.schema.createTable('login_attempts', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.string('email', 255).notNullable();
      table.string('ip_address', 45).notNullable();
      table.text('user_agent').nullable();
      table.boolean('successful').notNullable().defaultTo(false);
      table.timestamp('attempted_at').notNullable().defaultTo(trx.fn.now());
      
      // Add indexes for performance
      table.index(['email']);
      table.index(['ip_address']);
      table.index(['attempted_at']);
    });

    // Create security_questions table for account recovery
    await trx.schema.createTable('security_questions', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.string('question', 255).notNullable().unique();
      table.boolean('active').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
    });

    // Create user_security_answers table for account recovery
    await trx.schema.createTable('user_security_answers', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('question_id').notNullable().references('id').inTable('security_questions').onDelete('CASCADE');
      table.string('answer_hash', 255).notNullable().comment('Hashed answer for security');
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Add indexes and constraints
      table.unique(['user_id', 'question_id']);
    });

    // Update migration version
    await trx('migration_versions').insert({
      version: '02',
      name: 'auth_tables',
      executed_at: trx.fn.now()
    });
  });
}

/**
 * Rollback the authentication tables migration.
 * Drops all tables in reverse order to handle dependencies.
 */
export async function down(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Drop tables in reverse order to handle dependencies
    await trx.schema.dropTableIfExists('user_security_answers');
    await trx.schema.dropTableIfExists('security_questions');
    await trx.schema.dropTableIfExists('login_attempts');
    await trx.schema.dropTableIfExists('auth_providers');
    await trx.schema.dropTableIfExists('auth_sessions');
    await trx.schema.dropTableIfExists('tokens');
    
    // Remove migration version
    await trx('migration_versions').where({
      version: '02',
      name: 'auth_tables'
    }).delete();
  });
}
import { Knex } from 'knex';

/**
 * Migration function to create payment-related tables
 * @param knex Knex instance
 * @returns Promise that resolves when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Create enum types
    await trx.raw(`
      CREATE TYPE payment_provider AS ENUM ('STRIPE', 'VENMO', 'MANUAL');
      CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_ACCOUNT', 'VENMO_BALANCE', 'CASH');
      CREATE TYPE transaction_type AS ENUM ('EVENT_PAYMENT', 'SPLIT_PAYMENT', 'REFUND');
      CREATE TYPE transaction_status AS ENUM ('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
      CREATE TYPE split_type AS ENUM ('EQUAL', 'PERCENTAGE', 'CUSTOM');
      CREATE TYPE split_status AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED');
      CREATE TYPE payment_status AS ENUM ('NOT_REQUIRED', 'PENDING', 'COMPLETED', 'FAILED');
    `);

    // Create payment_methods table
    await trx.schema.createTable('payment_methods', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.specificType('provider', 'payment_provider').notNullable();
      table.specificType('type', 'payment_method').notNullable();
      table.string('token', 255).notNullable();
      table.string('last4', 4).nullable();
      table.integer('expiry_month').nullable();
      table.integer('expiry_year').nullable();
      table.boolean('is_default').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Indexes
      table.index(['user_id'], 'payment_method_user_idx');
      table.index(['provider'], 'payment_method_provider_idx');
      table.index(['is_default'], 'payment_method_default_idx');
    });

    // Create transactions table
    await trx.schema.createTable('transactions', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.specificType('type', 'transaction_type').notNullable();
      table.specificType('status', 'transaction_status').notNullable().defaultTo('INITIATED');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).notNullable().defaultTo('USD');
      table.text('description').notNullable();
      table.uuid('user_id').notNullable().references('id').inTable('users');
      table.uuid('payment_method_id').nullable().references('id').inTable('payment_methods');
      table.specificType('provider', 'payment_provider').notNullable();
      table.string('provider_transaction_id', 255).nullable();
      table.uuid('event_id').nullable().references('id').inTable('events');
      table.uuid('split_id').nullable(); // Will be referenced later after creating payment_splits
      table.uuid('refunded_transaction_id').nullable().references('id').inTable('transactions');
      table.jsonb('metadata').nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Indexes
      table.index(['user_id'], 'transaction_user_idx');
      table.index(['status'], 'transaction_status_idx');
      table.index(['type'], 'transaction_type_idx');
      table.index(['event_id'], 'transaction_event_idx');
      table.index(['split_id'], 'transaction_split_idx');
      table.index(['provider_transaction_id'], 'transaction_provider_id_idx');
    });

    // Create payment_splits table
    await trx.schema.createTable('payment_splits', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.text('description').notNullable();
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('currency', 3).notNullable().defaultTo('USD');
      table.specificType('split_type', 'split_type').notNullable();
      table.specificType('status', 'split_status').notNullable().defaultTo('PENDING');
      table.timestamp('due_date').nullable();
      table.jsonb('metadata').nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Indexes
      table.index(['event_id'], 'split_event_idx');
      table.index(['created_by'], 'split_creator_idx');
      table.index(['status'], 'split_status_idx');
      table.index(['due_date'], 'split_due_date_idx');
    });

    // Create payment_shares table
    await trx.schema.createTable('payment_shares', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('split_id').notNullable().references('id').inTable('payment_splits').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users');
      table.decimal('amount', 10, 2).notNullable();
      table.decimal('percentage', 5, 2).nullable();
      table.specificType('status', 'payment_status').notNullable().defaultTo('PENDING');
      table.uuid('transaction_id').nullable().references('id').inTable('transactions');
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      
      // Indexes
      table.index(['user_id'], 'share_user_idx');
      table.index(['status'], 'share_status_idx');
      table.index(['transaction_id'], 'share_transaction_idx');
      
      // Constraints
      table.unique(['split_id', 'user_id'], { indexName: 'split_user_unique' });
    });

    // Create payment_webhooks table
    await trx.schema.createTable('payment_webhooks', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.specificType('provider', 'payment_provider').notNullable();
      table.string('event_type', 100).notNullable();
      table.string('event_id', 255).notNullable();
      table.jsonb('payload').notNullable();
      table.boolean('processed').notNullable().defaultTo(false);
      table.timestamp('processed_at').nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      
      // Indexes
      table.unique(['provider', 'event_id'], { indexName: 'webhook_provider_event_idx' });
      table.index(['event_type'], 'webhook_event_type_idx');
      table.index(['processed'], 'webhook_processed_idx');
      table.index(['created_at'], 'webhook_created_at_idx');
    });

    // Now add the foreign key from transactions.split_id to payment_splits.id
    await trx.schema.alterTable('transactions', (table) => {
      table.foreign('split_id').references('id').inTable('payment_splits');
    });

    // Update migration version
    await trx.raw(`
      INSERT INTO migration_versions (name, run_on)
      VALUES ('06_payment_tables', NOW())
    `);
  });
}

/**
 * Migration function to drop payment-related tables
 * @param knex Knex instance
 * @returns Promise that resolves when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Drop tables in reverse order
    await trx.schema.dropTableIfExists('payment_webhooks');
    await trx.schema.dropTableIfExists('payment_shares');
    await trx.schema.dropTableIfExists('payment_splits');
    
    // Need to drop the foreign key reference before dropping the table
    await trx.schema.alterTable('transactions', (table) => {
      table.dropForeign(['split_id']);
    });
    
    await trx.schema.dropTableIfExists('transactions');
    await trx.schema.dropTableIfExists('payment_methods');
    
    // Drop enum types
    await trx.raw(`
      DROP TYPE IF EXISTS payment_status;
      DROP TYPE IF EXISTS split_status;
      DROP TYPE IF EXISTS split_type;
      DROP TYPE IF EXISTS transaction_status;
      DROP TYPE IF EXISTS transaction_type;
      DROP TYPE IF EXISTS payment_method;
      DROP TYPE IF EXISTS payment_provider;
    `);
  });
}
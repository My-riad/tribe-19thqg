import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum types
  await knex.raw(`
    CREATE TYPE tribe_status AS ENUM ('FORMING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'DISSOLVED');
    CREATE TYPE tribe_privacy AS ENUM ('PUBLIC', 'PRIVATE');
    CREATE TYPE member_role AS ENUM ('CREATOR', 'MEMBER');
    CREATE TYPE membership_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REMOVED', 'LEFT');
    CREATE TYPE activity_type AS ENUM (
      'TRIBE_CREATED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'EVENT_CREATED', 
      'EVENT_COMPLETED', 'AI_SUGGESTION', 'CHALLENGE_CREATED', 'CHALLENGE_COMPLETED'
    );
    CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'SYSTEM', 'AI_PROMPT', 'EVENT');
  `);

  // Create tribes table
  await knex.schema.createTable('tribes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('location', 255).nullable();
    table.double('latitude').nullable();
    table.double('longitude').nullable();
    table.string('image_url', 255).nullable();
    table.specificType('status', 'tribe_status').notNullable().defaultTo('FORMING');
    table.specificType('privacy', 'tribe_privacy').notNullable().defaultTo('PUBLIC');
    table.integer('max_members').notNullable().defaultTo(8);
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_active').notNullable().defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable();
    
    // Indexes
    table.index('name', 'tribe_name_idx');
    table.index('status', 'tribe_status_idx');
    table.index('created_by', 'tribe_created_by_idx');
  });

  // Add GiST index for location
  await knex.raw(`
    CREATE INDEX tribe_location_idx ON tribes USING GIST (latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  `);

  // Create tribe_memberships table
  await knex.schema.createTable('tribe_memberships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('role', 'member_role').notNullable().defaultTo('MEMBER');
    table.specificType('status', 'membership_status').notNullable().defaultTo('ACTIVE');
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_active').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id', 'membership_user_idx');
    table.index('status', 'membership_status_idx');
    
    // Constraints
    table.unique(['tribe_id', 'user_id'], 'tribe_user_unique');
  });

  // Create tribe_interests table
  await knex.schema.createTable('tribe_interests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
    table.specificType('category', 'interest_category').notNullable();
    table.string('name', 255).notNullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    
    // Indexes
    table.index('category', 'tribe_interest_category_idx');
    table.index('is_primary', 'tribe_interest_primary_idx');
    
    // Constraints
    table.unique(['tribe_id', 'category', 'name'], 'tribe_category_name_unique');
  });

  // Create tribe_activities table
  await knex.schema.createTable('tribe_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.specificType('activity_type', 'activity_type').notNullable();
    table.text('description').notNullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable();
    
    // Indexes
    table.index('user_id', 'activity_user_idx');
    table.index('activity_type', 'activity_type_idx');
    table.index('timestamp', 'activity_timestamp_idx');
  });

  // Create chat_messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('content').notNullable();
    table.specificType('message_type', 'message_type').notNullable().defaultTo('TEXT');
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_read').notNullable().defaultTo(false);
    table.jsonb('metadata').nullable();
    
    // Indexes
    table.index('user_id', 'chat_user_idx');
    table.index('message_type', 'chat_type_idx');
    table.index('sent_at', 'chat_sent_at_idx');
  });

  // Create tribe_goals table
  await knex.schema.createTable('tribe_goals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('target_date').nullable();
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('completed_at').nullable();
    
    // Indexes
    table.index('created_by', 'goal_created_by_idx');
    table.index('target_date', 'goal_target_date_idx');
    table.index('is_completed', 'goal_completed_idx');
  });

  // Update migration version
  await knex('migration_versions').insert({
    name: '04_tribe_tables',
    run_on: new Date()
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('tribe_goals');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('tribe_activities');
  await knex.schema.dropTableIfExists('tribe_interests');
  await knex.schema.dropTableIfExists('tribe_memberships');
  await knex.schema.dropTableIfExists('tribes');
  
  // Drop enum types in reverse order
  await knex.raw(`
    DROP TYPE IF EXISTS message_type;
    DROP TYPE IF EXISTS activity_type;
    DROP TYPE IF EXISTS membership_status;
    DROP TYPE IF EXISTS member_role;
    DROP TYPE IF EXISTS tribe_privacy;
    DROP TYPE IF EXISTS tribe_status;
  `);
}
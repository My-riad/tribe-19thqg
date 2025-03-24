import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Run migrations within a transaction for atomicity
  return knex.transaction(async (trx) => {
    // Create enum types first
    await trx.raw(`
      CREATE TYPE personality_trait AS ENUM (
        'OPENNESS',
        'CONSCIENTIOUSNESS',
        'EXTRAVERSION', 
        'AGREEABLENESS',
        'NEUROTICISM'
      )
    `);

    await trx.raw(`
      CREATE TYPE communication_style AS ENUM (
        'DIRECT',
        'THOUGHTFUL',
        'SUPPORTIVE',
        'ANALYTICAL',
        'EXPRESSIVE'
      )
    `);

    await trx.raw(`
      CREATE TYPE interest_category AS ENUM (
        'OUTDOOR_ADVENTURES',
        'ARTS_CULTURE',
        'FOOD_DINING',
        'SPORTS_FITNESS',
        'GAMES_ENTERTAINMENT',
        'LEARNING_EDUCATION',
        'TECHNOLOGY',
        'WELLNESS_MINDFULNESS'
      )
    `);

    await trx.raw(`
      CREATE TYPE interest_level AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH'
      )
    `);

    // Create profiles table
    await trx.schema.createTable('profiles', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.text('bio').nullable();
      table.string('location', 255).nullable();
      table.double('latitude').nullable();
      table.double('longitude').nullable();
      table.date('birthdate').nullable();
      table.string('phone_number', 20).nullable();
      table.string('avatar_url', 255).nullable();
      table.specificType('communication_style', 'communication_style').nullable();
      table.integer('max_travel_distance').defaultTo(15);
      table.timestamp('last_updated').notNullable().defaultTo(trx.fn.now());
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      
      // Create index on location coordinates for geo-based queries
      table.index(['latitude', 'longitude'], 'location_idx');
    });

    // Create personality_traits table
    await trx.schema.createTable('personality_traits', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('profile_id').notNullable().references('id').inTable('profiles').onDelete('CASCADE');
      table.specificType('trait', 'personality_trait').notNullable();
      table.decimal('score', 4, 2).notNullable();
      table.timestamp('assessed_at').notNullable().defaultTo(trx.fn.now());
      
      // Create unique constraint to ensure a trait can only be recorded once per profile
      table.unique(['profile_id', 'trait'], 'profile_trait_unique');
      
      // Create index on trait and score for improved query performance
      table.index(['trait', 'score'], 'trait_score_idx');
    });

    // Create interests table
    await trx.schema.createTable('interests', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('profile_id').notNullable().references('id').inTable('profiles').onDelete('CASCADE');
      table.specificType('category', 'interest_category').notNullable();
      table.string('name', 255).notNullable();
      table.specificType('level', 'interest_level').notNullable().defaultTo('MEDIUM');
      
      // Create unique constraint to avoid duplicate interests
      table.unique(['profile_id', 'category', 'name'], 'profile_category_name_unique');
      
      // Create index on category for filtering
      table.index(['category'], 'category_idx');
    });

    // Create preferences table
    await trx.schema.createTable('preferences', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('profile_id').notNullable().references('id').inTable('profiles').onDelete('CASCADE');
      table.string('category', 50).notNullable();
      table.string('setting', 50).notNullable();
      table.string('value', 255).notNullable();
      
      // Create unique constraint for settings
      table.unique(['profile_id', 'category', 'setting'], 'profile_category_setting_unique');
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  // Run rollback within a transaction for atomicity
  return knex.transaction(async (trx) => {
    // Drop tables in reverse order of creation to respect foreign key constraints
    await trx.schema.dropTableIfExists('preferences');
    await trx.schema.dropTableIfExists('interests');
    await trx.schema.dropTableIfExists('personality_traits');
    await trx.schema.dropTableIfExists('profiles');
    
    // Drop enum types in reverse order
    await trx.raw('DROP TYPE IF EXISTS interest_level');
    await trx.raw('DROP TYPE IF EXISTS interest_category');
    await trx.raw('DROP TYPE IF EXISTS communication_style');
    await trx.raw('DROP TYPE IF EXISTS personality_trait');
  });
}
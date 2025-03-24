import { Knex } from 'knex';

/**
 * Migration to create event-related tables for the Tribe application.
 * This includes tables for events, attendees, venues, media, comments,
 * suggestions, and weather data to support the event planning and coordination features.
 */
export async function up(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Create enum types
    await trx.raw(`
      -- Event status enum for tracking event lifecycle
      CREATE TYPE event_status AS ENUM (
        'DRAFT',
        'SCHEDULED',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
      );
      
      -- Event type enum for categorizing events
      CREATE TYPE event_type AS ENUM (
        'IN_PERSON',
        'VIRTUAL',
        'HYBRID'
      );
      
      -- Event visibility enum for controlling who can see events
      CREATE TYPE event_visibility AS ENUM (
        'TRIBE_ONLY',
        'PUBLIC'
      );
      
      -- RSVP status enum for attendee responses
      CREATE TYPE rsvp_status AS ENUM (
        'GOING',
        'MAYBE',
        'NOT_GOING',
        'NO_RESPONSE'
      );
      
      -- Create payment_status enum if it doesn't exist already
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
          CREATE TYPE payment_status AS ENUM (
            'PAID',
            'PENDING',
            'FAILED',
            'REFUNDED',
            'NOT_REQUIRED'
          );
        END IF;
      END$$;
    `);

    // Create venues table for storing event locations
    await trx.schema.createTable('venues', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.string('name', 255).notNullable();
      table.string('address', 255).notNullable();
      table.specificType('latitude', 'double precision').nullable();
      table.specificType('longitude', 'double precision').nullable();
      table.string('place_id', 255).nullable();
      table.string('website', 255).nullable();
      table.string('phone_number', 20).nullable();
      table.integer('capacity').nullable();
      table.integer('price_level').nullable();
      table.decimal('rating', 3, 1).nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
    });

    // Add unique constraint for venues.place_id
    await trx.raw(`
      ALTER TABLE venues ADD CONSTRAINT place_id_unique UNIQUE (place_id) WHERE place_id IS NOT NULL;
    `);

    // Create indexes for venues table
    await trx.raw(`
      CREATE INDEX venue_name_idx ON venues (name);
      CREATE INDEX venue_location_idx ON venues USING GIST (latitude, longitude) 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    // Create events table for storing event information
    await trx.schema.createTable('events', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.uuid('tribe_id').notNullable().references('id').inTable('tribes').onDelete('CASCADE');
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.specificType('event_type', 'event_type').notNullable().defaultTo('IN_PERSON');
      table.specificType('status', 'event_status').notNullable().defaultTo('SCHEDULED');
      table.specificType('visibility', 'event_visibility').notNullable().defaultTo('TRIBE_ONLY');
      table.specificType('category', 'interest_category').nullable();
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time').nullable();
      table.string('location', 255).nullable();
      table.specificType('latitude', 'double precision').nullable();
      table.specificType('longitude', 'double precision').nullable();
      table.uuid('venue_id').nullable().references('id').inTable('venues');
      table.jsonb('weather_data').nullable();
      table.decimal('cost', 10, 2).defaultTo(0);
      table.boolean('payment_required').notNullable().defaultTo(false);
      table.integer('max_attendees').nullable();
      table.string('external_event_id', 255).nullable();
      table.string('external_event_url', 255).nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
      table.jsonb('metadata').nullable();
    });

    // Create indexes for events table
    await trx.raw(`
      CREATE INDEX event_tribe_idx ON events (tribe_id);
      CREATE INDEX event_creator_idx ON events (created_by);
      CREATE INDEX event_status_idx ON events (status);
      CREATE INDEX event_start_time_idx ON events (start_time);
      CREATE INDEX event_category_idx ON events (category);
      CREATE INDEX event_location_idx ON events USING GIST (latitude, longitude) 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
      CREATE INDEX event_external_id_idx ON events (external_event_id);
    `);

    // Create event_attendees table for tracking event participation
    await trx.schema.createTable('event_attendees', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.specificType('rsvp_status', 'rsvp_status').notNullable().defaultTo('NO_RESPONSE');
      table.timestamp('rsvp_time').nullable();
      table.boolean('has_checked_in').notNullable().defaultTo(false);
      table.timestamp('checked_in_at').nullable();
      table.specificType('payment_status', 'payment_status').notNullable().defaultTo('NOT_REQUIRED');
      table.decimal('payment_amount', 10, 2).nullable();
      table.string('payment_id', 255).nullable();
    });

    // Add unique constraint for event_attendees
    await trx.raw(`
      ALTER TABLE event_attendees ADD CONSTRAINT event_user_unique UNIQUE (event_id, user_id);
    `);

    // Create indexes for event_attendees table
    await trx.raw(`
      CREATE INDEX attendee_user_idx ON event_attendees (user_id);
      CREATE INDEX attendee_rsvp_status_idx ON event_attendees (rsvp_status);
      CREATE INDEX attendee_checked_in_idx ON event_attendees (has_checked_in);
    `);

    // Create event_media table for storing event-related media
    await trx.schema.createTable('event_media', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.string('type', 50).notNullable();
      table.string('url', 255).notNullable();
      table.uuid('uploaded_by').nullable().references('id').inTable('users');
      table.timestamp('uploaded_at').notNullable().defaultTo(trx.fn.now());
      table.jsonb('metadata').nullable();
    });

    // Create indexes for event_media table
    await trx.raw(`
      CREATE INDEX media_type_idx ON event_media (type);
      CREATE INDEX media_uploaded_by_idx ON event_media (uploaded_by);
    `);

    // Create event_comments table for event discussions
    await trx.schema.createTable('event_comments', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.uuid('user_id').nullable().references('id').inTable('users');
      table.text('content').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
    });

    // Create indexes for event_comments table
    await trx.raw(`
      CREATE INDEX comment_user_idx ON event_comments (user_id);
      CREATE INDEX comment_created_at_idx ON event_comments (created_at);
    `);

    // Create event_suggestions table for AI-generated event recommendations
    await trx.schema.createTable('event_suggestions', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.uuid('tribe_id').notNullable().references('id').inTable('tribes');
      table.string('name', 255).notNullable();
      table.text('description').notNullable();
      table.specificType('category', 'interest_category').notNullable();
      table.timestamp('suggested_date').nullable();
      table.string('location', 255).nullable();
      table.uuid('venue_id').nullable().references('id').inTable('venues');
      table.decimal('estimated_cost', 10, 2).nullable();
      table.boolean('weather_dependent').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('expires_at').nullable();
      table.string('status', 50).notNullable().defaultTo('PENDING');
      table.uuid('converted_to_event_id').nullable().references('id').inTable('events');
      table.jsonb('metadata').nullable();
    });

    // Create indexes for event_suggestions table
    await trx.raw(`
      CREATE INDEX suggestion_tribe_idx ON event_suggestions (tribe_id);
      CREATE INDEX suggestion_category_idx ON event_suggestions (category);
      CREATE INDEX suggestion_date_idx ON event_suggestions (suggested_date);
      CREATE INDEX suggestion_status_idx ON event_suggestions (status);
      CREATE INDEX suggestion_weather_idx ON event_suggestions (weather_dependent);
    `);

    // Create weather_data table for storing weather forecasts for event planning
    await trx.schema.createTable('weather_data', (table) => {
      table.uuid('id').primary().defaultTo(trx.raw('uuid_generate_v4()'));
      table.specificType('latitude', 'double precision').notNullable();
      table.specificType('longitude', 'double precision').notNullable();
      table.date('forecast_date').notNullable();
      table.decimal('temperature', 5, 2).nullable();
      table.string('condition', 50).nullable();
      table.decimal('precipitation', 5, 2).nullable();
      table.decimal('wind_speed', 5, 2).nullable();
      table.decimal('humidity', 5, 2).nullable();
      table.string('icon', 50).nullable();
      table.jsonb('forecast_data').nullable();
      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now());
    });

    // Add unique constraint for weather_data
    await trx.raw(`
      ALTER TABLE weather_data ADD CONSTRAINT location_date_unique UNIQUE (latitude, longitude, forecast_date);
    `);

    // Create indexes for weather_data table
    await trx.raw(`
      CREATE INDEX weather_forecast_date_idx ON weather_data (forecast_date);
      CREATE INDEX weather_condition_idx ON weather_data (condition);
    `);
  });
}

/**
 * Rollback migration: Drops all event-related tables and enum types
 * in the reverse order they were created.
 */
export async function down(knex: Knex): Promise<void> {
  return knex.transaction(async (trx) => {
    // Drop tables in reverse order
    await trx.schema.dropTableIfExists('weather_data');
    await trx.schema.dropTableIfExists('event_suggestions');
    await trx.schema.dropTableIfExists('event_comments');
    await trx.schema.dropTableIfExists('event_media');
    await trx.schema.dropTableIfExists('event_attendees');
    await trx.schema.dropTableIfExists('events');
    await trx.schema.dropTableIfExists('venues');

    // Drop enum types in reverse order of creation
    await trx.raw(`
      DROP TYPE IF EXISTS rsvp_status;
      DROP TYPE IF EXISTS event_visibility;
      DROP TYPE IF EXISTS event_type;
      DROP TYPE IF EXISTS event_status;
      
      -- Note: We're not dropping payment_status since it might be used elsewhere
      -- If you need to drop it, uncomment the line below
      -- DROP TYPE IF EXISTS payment_status;
    `);
  });
}
# Database Migrations

This module provides a robust database migration system for the Tribe platform, enabling versioned schema changes, data transformations, and rollback capabilities. The migration system ensures consistent database schema across all environments and provides a reliable way to evolve the database structure as the application grows.

## Architecture

The migration system uses a numbered migration approach where each migration file represents a specific change to the database schema. Migrations are applied in order based on their numeric prefix (e.g., 01_, 02_) and are tracked in a migration_versions table to maintain the current state of the database.

### Key Components

- Migration Runner: Executes migrations in the correct order
- Migration Tracker: Records which migrations have been applied
- Transaction Wrapper: Ensures atomicity of each migration
- Rollback Support: Provides ability to undo migrations

### Migration File Structure

```typescript
// src/migrations/01_example_migration.ts

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Schema changes to apply
  await knex.schema.createTable('example', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Rollback changes
  await knex.schema.dropTable('example');
}
```

## Usage

The migration system provides a CLI interface for managing database migrations.

### Available Commands

- `npm run migrate:up` - Apply all pending migrations
- `npm run migrate:down` - Rollback the most recent migration
- `npm run migrate:status` - Show status of all migrations
- `npm run migrate:create <name>` - Create a new migration file

### Environment Configuration

Migrations use the following environment variables for database connection:

- DATABASE_HOST - Database server hostname
- DATABASE_PORT - Database server port
- DATABASE_NAME - Database name
- DATABASE_USER - Database username
- DATABASE_PASSWORD - Database password
- DATABASE_SSL - Whether to use SSL (true/false)

## Creating Migrations

To create a new migration, use the `npm run migrate:create <name>` command. This will generate a new migration file in the src/migrations directory with the appropriate numeric prefix.

### Migration File Template

```typescript
// src/migrations/XX_migration_name.ts

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Schema changes to apply
}

export async function down(knex: Knex): Promise<void> {
  // Rollback changes
}
```

### Best Practices

- Always implement both `up` and `down` functions
- Keep migrations focused on a single logical change
- Use transactions for data consistency
- Add descriptive comments explaining the purpose of the migration
- Test migrations in development before applying to production
- Consider data migration implications when changing schema

## Migration Types

The system supports different types of migrations:

### Schema Migrations

Changes to the database structure such as creating/altering/dropping tables and columns.

```typescript
// Creating a new table
await knex.schema.createTable('users', (table) => {
  table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
  table.string('email').notNullable().unique();
  table.string('password_hash').notNullable();
  table.timestamps(true, true);
});
```

### Data Migrations

Transformations of existing data, such as populating new columns or normalizing data.

```typescript
// Updating existing data
await knex('users')
  .where('status', 'ACTIVE')
  .update({ is_verified: true });
```

### Seed Migrations

Inserting initial or reference data required by the application.

```typescript
// Inserting seed data
await knex('roles').insert([
  { name: 'USER', description: 'Standard user' },
  { name: 'ADMIN', description: 'Administrator' }
]);
```

## Working with Prisma

While this migration system uses Knex.js for raw SQL operations, the Tribe platform also uses Prisma as its primary ORM. Here's how they work together:

### Migration Strategy

- Use this migration system for complex schema changes and data migrations
- Use Prisma Migrate for standard schema changes driven by the Prisma schema
- Keep the Prisma schema in sync with the actual database schema

### Workflow

1. For Prisma-driven changes, update the schema.prisma file and run prisma migrate dev
2. For complex migrations, create a custom migration using this system
3. After running custom migrations, use prisma db pull to update the Prisma schema

## Deployment Considerations

When deploying migrations to different environments, consider the following:

### CI/CD Integration

- Run migrations as part of the deployment process
- Include migration status check in health checks
- Have a rollback strategy for failed migrations
- Consider using a migration lock to prevent concurrent migrations

### Production Safeguards

- Always backup the database before running migrations
- Test migrations in staging environment first
- Schedule migrations during low-traffic periods
- Monitor database performance during and after migrations
- Have a communication plan for potential downtime

## Troubleshooting

Common issues and their solutions:

### Failed Migrations

- Check the error message for specific issues
- Verify database credentials and connectivity
- Ensure the migration_versions table exists
- Check for conflicts with existing schema elements
- Try running with DEBUG=knex:* for detailed logging

### Manual Recovery

If a migration fails and cannot be rolled back automatically:

```sql
-- Connect to the database and fix the migration_versions table
DELETE FROM migration_versions WHERE version = '01_failed_migration';

-- Then fix any partial schema changes manually
```

## Migration Examples

Here are some examples of common migration patterns:

### Adding a New Table

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tribes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tribes');
}
```

### Adding Columns to Existing Table

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('phone_number');
    table.boolean('is_verified').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('phone_number');
    table.dropColumn('is_verified');
  });
}
```

### Creating Indexes

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.index('email');
    table.index(['first_name', 'last_name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('email');
    table.dropIndex(['first_name', 'last_name']);
  });
}
```

### Data Migration

```typescript
export async function up(knex: Knex): Promise<void> {
  // Split name field into first_name and last_name
  const users = await knex('users').select('id', 'name');
  
  for (const user of users) {
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    await knex('users')
      .where('id', user.id)
      .update({
        first_name: firstName,
        last_name: lastName || ''
      });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Combine first_name and last_name back to name
  const users = await knex('users').select('id', 'first_name', 'last_name');
  
  for (const user of users) {
    await knex('users')
      .where('id', user.id)
      .update({
        name: `${user.first_name} ${user.last_name}`.trim()
      });
  }
}
```

## Contributing

When contributing to the migration system, please follow these guidelines:

- Follow the established naming convention for migration files
- Include both up and down functions for all migrations
- Add thorough comments explaining the purpose and impact of the migration
- Test migrations thoroughly in development before submitting a PR
- Update this documentation if you make changes to the migration system itself
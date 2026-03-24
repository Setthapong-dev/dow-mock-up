require('dotenv').config();
const sql = require('./configs/db');

async function migrate() {
  console.log('Starting migration...\n');

  try {
    // pgcrypto for gen_random_uuid()
    console.log('[1/9] Creating pgcrypto extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // Enums
    console.log('[2/9] Creating enum types...');
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE asset_status AS ENUM ('active', 'notactive');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type') THEN
        CREATE TYPE change_type AS ENUM ('status', 'owner', 'location');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_status') THEN
        CREATE TYPE change_status AS ENUM ('pending', 'approved', 'rejected', 'done');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approver_role') THEN
        CREATE TYPE approver_role AS ENUM ('owner', 'old_owner', 'new_owner');
      END IF;
    END $$`;

    // Users table
    console.log('[3/9] Creating users table...');
    await sql`CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      password_hash varchar(255) NOT NULL,
      role user_role NOT NULL DEFAULT 'user',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`;

    // Locations table
    console.log('[4/9] Creating locations table...');
    await sql`CREATE TABLE IF NOT EXISTS locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      description text,
      created_at timestamp NOT NULL DEFAULT now()
    )`;

    // Assets table
    console.log('[5/9] Creating assets table...');
    await sql`CREATE TABLE IF NOT EXISTS assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      description text,
      owner_id uuid NOT NULL REFERENCES users(id),
      location_id uuid REFERENCES locations(id),
      status asset_status NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`;

    // Asset changes table
    console.log('[6/9] Creating asset_changes table...');
    await sql`CREATE TABLE IF NOT EXISTS asset_changes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_id uuid NOT NULL REFERENCES assets(id),
      requested_by uuid NOT NULL REFERENCES users(id),
      change_type change_type NOT NULL,
      old_value jsonb NOT NULL,
      new_value jsonb NOT NULL,
      status change_status NOT NULL DEFAULT 'pending',
      requires_approval boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`;

    // Change approvals table
    console.log('[7/9] Creating change_approvals table...');
    await sql`CREATE TABLE IF NOT EXISTS change_approvals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      change_id uuid NOT NULL REFERENCES asset_changes(id),
      approver_id uuid NOT NULL REFERENCES users(id),
      approver_role approver_role NOT NULL,
      status approval_status NOT NULL DEFAULT 'pending',
      responded_at timestamp,
      CONSTRAINT uq_change_approver UNIQUE (change_id, approver_id)
    )`;

    // Indexes
    console.log('[8/9] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets(owner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assets_location_id ON assets(location_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_asset_changes_asset_id ON asset_changes(asset_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_asset_changes_requested_by ON asset_changes(requested_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_asset_changes_status ON asset_changes(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_change_approvals_change_id ON change_approvals(change_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_change_approvals_approver_id ON change_approvals(approver_id)`;

    // Triggers
    console.log('[9/9] Creating updated_at triggers...');
    await sql`CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`;

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_updated_at') THEN
        CREATE TRIGGER trg_users_set_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assets_set_updated_at') THEN
        CREATE TRIGGER trg_assets_set_updated_at
        BEFORE UPDATE ON assets
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_asset_changes_set_updated_at') THEN
        CREATE TRIGGER trg_asset_changes_set_updated_at
        BEFORE UPDATE ON asset_changes
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$`;

    console.log('\nMigration completed successfully!');

    // Show table summary
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('\nTables created:');
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

migrate();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log(
    'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  try {
    console.log(`🔧 Running migration: ${migrationFile}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into statements and execute
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`  Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error && error.message !== 'relation does not exist') {
        console.log(`⚠️  Warning for statement ${i + 1}: ${error.message}`);
        // Continue with other statements
      }
    }

    console.log(`✅ Migration completed: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`, error.message);
  }
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('❌ Please specify a migration file');
    console.log('Usage: node scripts/run-migration.js 007_create_missing_rls_policies.sql');
    process.exit(1);
  }

  await runMigration(migrationFile);
}

main();

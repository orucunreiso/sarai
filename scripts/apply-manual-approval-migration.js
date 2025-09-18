#!/usr/bin/env node

/**
 * Manual Goal Approval Migration Script
 * Run this script to apply the manual approval migration to your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting manual goal approval migration...');

    // Read the migration SQL file
    const migrationPath = join(__dirname, '../database/migrations/009_add_manual_goal_approval.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL commands (simple split by semicolon)
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`);

    // Execute each command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`⏳ Executing command ${i + 1}/${sqlCommands.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: command
      });

      if (error) {
        console.error(`❌ Error in command ${i + 1}:`, error);
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_unused') // This will fail but allows raw SQL
          .select('*')
          .limit(0);

        if (directError) {
          console.log('⚠️  Direct SQL execution not available, manual migration required');
          console.log('Please run the following SQL in your Supabase dashboard:');
          console.log('='.repeat(60));
          console.log(migrationSQL);
          console.log('='.repeat(60));
          return;
        }
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }

    // Test the migration by checking if new columns exist
    console.log('🔍 Testing migration...');
    const { data: testData, error: testError } = await supabase
      .from('daily_goals')
      .select('manual_approval_required, is_manually_approved')
      .limit(1);

    if (testError) {
      console.log('⚠️  Migration may need manual application. SQL to run:');
      console.log('='.repeat(60));
      console.log(migrationSQL);
      console.log('='.repeat(60));
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('🎉 Manual goal approval system is now available');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📋 Please apply this migration manually in your Supabase dashboard:');
    console.log('='.repeat(60));
    const migrationPath = join(__dirname, '../database/migrations/009_add_manual_goal_approval.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    console.log('='.repeat(60));
  }
}

// Run the migration
applyMigration().then(() => {
  console.log('🏁 Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
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

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Sarai database tables...');

    // Read the SQL schema
    const schemaPath = path.join(__dirname, '..', 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { query: statement });

      if (error && !error.message.includes('already exists')) {
        console.error('❌ Error executing statement:', error.message);
        console.log('Statement:', statement);
      } else {
        console.log('✅ Success');
      }
    }

    console.log('✅ Database setup completed successfully!');

    // Test the tables
    console.log('\n🧪 Testing tables...');

    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('count(*)')
      .limit(1);

    if (sessionsError) {
      console.error('❌ Error accessing chat_sessions:', sessionsError.message);
    } else {
      console.log('✅ chat_sessions table accessible');
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('count(*)')
      .limit(1);

    if (messagesError) {
      console.error('❌ Error accessing chat_messages:', messagesError.message);
    } else {
      console.log('✅ chat_messages table accessible');
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

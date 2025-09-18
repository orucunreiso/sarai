const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

async function fixRLS() {
  console.log('🔧 Creating missing RLS policies...');

  const policies = [
    // user_xp policies
    `CREATE POLICY "Users can view own XP" ON user_xp FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own XP" ON user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update own XP" ON user_xp FOR UPDATE USING (auth.uid() = user_id);`,

    // xp_logs policies
    `CREATE POLICY "Users can view own XP logs" ON xp_logs FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own XP logs" ON xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);`,

    // achievements policies
    `CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);`,

    // user_achievements policies
    `CREATE POLICY "Users can view own user achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own user achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  ];

  for (const [index, policy] of policies.entries()) {
    try {
      console.log(`  Creating policy ${index + 1}/${policies.length}...`);
      const { error } = await supabase.from('_').select().limit(0); // Just to test connection

      // Use raw SQL
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy,
      });

      if (policyError) {
        console.log(`⚠️  Policy ${index + 1}: ${policyError.message}`);
      } else {
        console.log(`✅ Policy ${index + 1} created successfully`);
      }
    } catch (error) {
      console.log(`⚠️  Policy ${index + 1}: ${error.message}`);
    }
  }

  console.log('✅ RLS policies creation completed!');
}

fixRLS();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

  supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
  supabaseKey = keyMatch ? keyMatch[1].trim() : null;
} catch (error) {
  console.error('❌ Could not read .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetailedConnection() {
  console.log('🔍 Detailed Supabase Diagnostics...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('✅ Basic connection works');
    } else if (testError) {
      console.log('❌ Connection issue:', testError.message);
      return;
    }

    // Test 2: Check what tables currently exist
    console.log('\n2️⃣ Checking existing tables...');
    const { data: existingTables, error: tablesError } = await supabase
      .rpc('get_tables')
      .catch(() => null);

    if (tablesError) {
      console.log('⚠️ Cannot query table list (this is normal for anon users)');
    }

    // Test 3: Check if we can access auth tables
    console.log('\n3️⃣ Testing auth table access...');
    const { data: authData, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (authError) {
      console.log('❌ Auth table access:', authError.message);
      console.log('   This might explain why the migration failed');
    } else {
      console.log('✅ Can access auth tables');
    }

    // Test 4: Try to create a simple table (this will likely fail with anon key)
    console.log('\n4️⃣ Testing table creation permissions...');
    const { data: createData, error: createError } = await supabase
      .rpc('exec', { query: 'CREATE TABLE IF NOT EXISTS test_table (id INT);' })
      .catch(() => ({ error: { message: 'RPC not available' } }));

    if (createError) {
      console.log('❌ Cannot create tables with anon key (expected)');
      console.log('   Reason:', createError.message);
    } else {
      console.log('✅ Table creation works');
    }

    // Test 5: Check current user permissions
    console.log('\n5️⃣ Checking current user role...');
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userData.user) {
      console.log('✅ Authenticated user:', userData.user.email);
    } else {
      console.log('⚠️ Not authenticated (using anon key)');
    }

    console.log('\n📋 DIAGNOSIS:');
    console.log('The anon key can only READ data, not create tables.');
    console.log('You need to create tables using the Supabase dashboard.');
    console.log('\n🛠️ SOLUTIONS:');
    console.log('1. Use Supabase Dashboard SQL Editor (recommended)');
    console.log('2. Use service role key (not recommended for client apps)');
    console.log('3. Create tables manually via Table Editor UI');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testDetailedConnection();

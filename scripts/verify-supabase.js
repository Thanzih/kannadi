import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Parse .env manually to avoid extra dependencies
function loadEnv() {
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('\n========================================');
console.log('   Kannadi Supabase Connectivity Test   ');
console.log('========================================\n');

if (!supabaseUrl || !publishableKey || supabaseUrl.includes('placeholder')) {
  console.log('⚠️  Status: Supabase credentials are not yet set in .env');
  console.log('    Please replace the placeholder values in .env with your real Supabase Project URL and Publishable Key.\n');
  process.exit(0);
}

console.log(`Connecting to URL: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, publishableKey);

async function verify() {
  let passed = true;

  // 1. Check Profiles table accessibility and count
  try {
    const { data, count, error } = await supabase
      .from('profiles')
      .select('id, name, college_id, elo_rating', { count: 'exact' });

    if (error) {
      console.error('❌ Table "profiles" check failed:', error.message);
      passed = false;
    } else {
      console.log(`✅ Table "profiles" accessible via RLS (${data?.length || 0} active profiles found)`);
      if (data && data.length > 0) {
        console.log('   Current Profiles:');
        data.slice(0, 10).forEach((p, idx) => {
          console.log(`   ${idx + 1}. ${p.name.padEnd(20)} [${p.college_id}] - ${p.elo_rating} Elo`);
        });
        if (data.length > 10) {
          console.log(`   ... and ${data.length - 10} more`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Connection error on "profiles":', err.message);
    passed = false;
  }

  // 2. Check Votes table
  try {
    const { error } = await supabase.from('votes').select('id').limit(1);
    if (error && !error.message.includes('policy')) {
      console.error('❌ Table "votes" check failed:', error.message);
      passed = false;
    } else {
      console.log('✅ Table "votes" is configured');
    }
  } catch (err) {
    console.error('❌ Connection error on "votes":', err.message);
    passed = false;
  }

  // 3. Check get_next_challenger RPC signature
  try {
    const { error } = await supabase.rpc('get_next_challenger', {
      p_king_id: '00000000-0000-0000-0000-000000000000',
      p_excluded_ids: []
    });
    if (error && !error.message.includes('does not exist')) {
      console.log('✅ Stored procedure "get_next_challenger" is registered and callable');
    } else if (error) {
      console.error('❌ RPC "get_next_challenger" not found. Did you run supabase/schema.sql?');
      passed = false;
    } else {
      console.log('✅ Stored procedure "get_next_challenger" is registered');
    }
  } catch (err) {
    console.error('❌ Error checking RPC:', err.message);
    passed = false;
  }

  console.log('\n----------------------------------------');
  if (passed) {
    console.log('🎉 Verification SUCCESS: Your Supabase database is ready for Phase 3!');
  } else {
    console.log('⚠️  Verification incomplete. Please run supabase/schema.sql in the Supabase SQL Editor.');
  }
  console.log('----------------------------------------\n');
}

verify();

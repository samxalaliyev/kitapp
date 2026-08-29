/**
 * Supabase Keep-Alive Health Ping Script
 * 
 * Prevents Supabase Free Tier databases from pausing after 7 days of inactivity.
 * Can be scheduled with GitHub Actions or cron-job.org.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function pingSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials missing in environment.');
    process.exit(1);
  }

  console.log(`📡 Pinging Supabase instance at: ${SUPABASE_URL}...`);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      console.log(`✅ Supabase is active and responsive! (Status: ${res.status})`);
    } else {
      console.warn(`⚠️ Supabase returned non-standard status: ${res.status}`);
    }
  } catch (err) {
    console.error('❌ Failed to ping Supabase:', err);
    process.exit(1);
  }
}

pingSupabase();

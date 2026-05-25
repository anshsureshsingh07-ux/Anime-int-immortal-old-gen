import { createClient } from '@supabase/supabase-js';

const url = 'https://ccjfmyfnitrmpnxsvrnk.supabase.co';
const key = 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c';
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('user_factions').select('*').limit(1);
  if (error) {
    console.error('Error querying user_factions:', error);
  } else {
    console.log('user_factions table exists! Data:', data);
  }
}
main();

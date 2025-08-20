require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking sales_optimized table...\n');
  
  try {
    // Check if table exists and has data
    const { data, error } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(5);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Table sales_optimized does not exist');
        console.log('\nRun this SQL to create the table:');
        console.log('node create-sales-optimized-table-v2.sql');
        return;
      }
      console.error('Error:', error.message);
      return;
    }
    
    console.log('✅ Table sales_optimized exists');
    console.log(`Found ${data.length} records (showing max 5)\n`);
    
    if (data.length === 0) {
      console.log('⚠️  Table is empty. Need to migrate data.');
      console.log('\nRun this to migrate data:');
      console.log('node migrate-to-sales-optimized-v4.sql');
    } else {
      console.log('Sample data:');
      data.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`- ID: ${record.id}`);
        console.log(`- Wechat: ${record.wechat_name}`);
        console.log(`- Type: ${record.sales_type}`);
        console.log(`- Orders: ${record.total_orders || 0}`);
        console.log(`- Amount: $${record.total_amount || 0}`);
      });
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTable();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tfuhjtrluvjcgqjwlhze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdWhqdHJsdXZqY2dxandsaHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MjEyNzIsImV4cCI6MjA0OTM5NzI3Mn0.lnjPJqmM0PY4pzq4fmuoIhPYkAA6yB_CoC4MHs76HQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDuration() {
  console.log('🔍 Analyzing duration field values in orders_optimized table...\n');
  
  try {
    // Get all distinct duration values
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('duration')
      .not('duration', 'is', null);
    
    if (error) throw error;
    
    // Count occurrences
    const durationCounts = {};
    orders.forEach(order => {
      const val = order.duration;
      durationCounts[val] = (durationCounts[val] || 0) + 1;
    });
    
    console.log('=== Current Duration Values ===');
    console.log(`Total orders with duration: ${orders.length}\n`);
    
    Object.entries(durationCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([value, count]) => {
        const percentage = ((count / orders.length) * 100).toFixed(1);
        console.log(`  "${value}": ${count} orders (${percentage}%)`);
      });
    
    // Identify values that need normalization
    const needsNormalization = [
      '7天免费', '7天', '7 days',
      '1月', '1个月', '1 month',
      '3月', '3个月', '3 months',
      '6月', '6个月', '6 months',
      '1年', '1 year'
    ];
    
    const problemValues = Object.keys(durationCounts).filter(val => 
      needsNormalization.includes(val)
    );
    
    if (problemValues.length > 0) {
      console.log('\n⚠️  Found inconsistent values that need normalization:');
      problemValues.forEach(val => {
        console.log(`     - "${val}" (${durationCounts[val]} orders)`);
      });
      return true; // Needs fixing
    } else {
      console.log('\n✅ All duration values are already normalized!');
      return false; // No fix needed
    }
    
  } catch (err) {
    console.error('Error analyzing duration:', err.message);
    return false;
  }
}

async function normalizeDuration() {
  console.log('\n🔧 Starting duration normalization...\n');
  
  const mapping = {
    // 7 days variations
    '7天免费': '7days',
    '7天': '7days',
    '7 days': '7days',
    
    // 1 month variations
    '1月': '1month',
    '1个月': '1month',
    '1 month': '1month',
    
    // 3 months variations
    '3月': '3months',
    '3个月': '3months',
    '3 months': '3months',
    
    // 6 months variations
    '6月': '6months',
    '6个月': '6months',
    '6 months': '6months',
    
    // 1 year variations
    '1年': '1year',
    '1 year': '1year'
  };
  
  let totalUpdated = 0;
  
  for (const [oldValue, newValue] of Object.entries(mapping)) {
    // First check if there are any records with this value
    const { data: checkData, error: checkError } = await supabase
      .from('orders_optimized')
      .select('id')
      .eq('duration', oldValue)
      .limit(1);
    
    if (checkError) {
      console.error(`Error checking "${oldValue}":`, checkError.message);
      continue;
    }
    
    if (!checkData || checkData.length === 0) {
      // No records with this value, skip
      continue;
    }
    
    // Update the records
    const { data, error } = await supabase
      .from('orders_optimized')
      .update({ duration: newValue })
      .eq('duration', oldValue)
      .select();
    
    if (error) {
      console.error(`❌ Failed to update "${oldValue}" to "${newValue}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Updated ${data.length} records: "${oldValue}" → "${newValue}"`);
      totalUpdated += data.length;
    }
  }
  
  console.log(`\n📊 Normalization complete! Total records updated: ${totalUpdated}`);
  return totalUpdated;
}

async function main() {
  console.log('========================================');
  console.log('Duration Field Normalization Tool');
  console.log('========================================\n');
  
  // First analyze current state
  const needsFix = await analyzeDuration();
  
  if (needsFix) {
    console.log('\n-----------------------------------');
    console.log('Do you want to normalize these values? (This will update the database)');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    console.log('-----------------------------------');
    
    // Wait 3 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Perform normalization
    const updated = await normalizeDuration();
    
    if (updated > 0) {
      console.log('\n🔍 Verifying changes...\n');
      // Re-analyze to verify
      await analyzeDuration();
    }
  }
  
  console.log('\n✨ Process complete!');
  process.exit(0);
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
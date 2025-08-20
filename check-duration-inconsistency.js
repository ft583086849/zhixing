const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tfuhjtrluvjcgqjwlhze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdWhqdHJsdXZqY2dxandsaHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MjEyNzIsImV4cCI6MjA0OTM5NzI3Mn0.lnjPJqmM0PY4pzq4fmuoIhPYkAA6yB_CoC4MHs76HQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDurationValues() {
  try {
    // Check recent orders
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('id, duration, price_plan, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    // Count unique duration values
    const durationCounts = {};
    const examples = {};
    
    data.forEach(row => {
      const val = row.duration || 'NULL';
      durationCounts[val] = (durationCounts[val] || 0) + 1;
      if (!examples[val]) {
        examples[val] = { 
          id: row.id, 
          price_plan: row.price_plan, 
          status: row.status,
          created_at: row.created_at
        };
      }
    });
    
    console.log('\n========================================');
    console.log('Duration Field Analysis - orders_optimized');
    console.log('========================================\n');
    
    console.log('Duration values in recent 200 orders:');
    console.log('--------------------------------------');
    Object.entries(durationCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([value, count]) => {
        const ex = examples[value];
        console.log(`  "${value}": ${count} orders`);
        console.log(`     Example: id=${ex.id.substring(0,8)}..., price_plan=${ex.price_plan}, status=${ex.status}`);
        console.log('');
      });
    
    // Get all unique duration values
    const { data: allData, error: allError } = await supabase
      .from('orders_optimized')
      .select('duration')
      .not('duration', 'is', null);
    
    if (!allError && allData) {
      const uniqueValues = [...new Set(allData.map(r => r.duration))].sort();
      console.log('\nAll unique duration values in database:');
      console.log('----------------------------------------');
      uniqueValues.forEach(v => console.log(`  - "${v}"`));
      
      console.log('\n========================================');
      console.log('Issue Found:');
      console.log('----------------------------------------');
      console.log('The duration field contains inconsistent values:');
      console.log('  - Chinese text: "7天免费", "7天"');
      console.log('  - English text: "1year", "6months", "3months"');
      console.log('  - Mixed formats for same duration');
      console.log('\nThis needs to be normalized to consistent values.');
      console.log('Recommended format: "7days", "1month", "3months", "6months", "1year"');
    }
    
    console.log(`\nTotal orders analyzed: ${data.length}`);
    console.log(`Unique duration values: ${Object.keys(durationCounts).length}`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkDurationValues();
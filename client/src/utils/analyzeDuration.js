import supabase from '../services/supabase';

export async function analyzeDurationField() {
  try {
    // Get all distinct duration values with counts
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('duration')
      .not('duration', 'is', null);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    // Count occurrences
    const durationCounts = {};
    orders.forEach(order => {
      const val = order.duration;
      durationCounts[val] = (durationCounts[val] || 0) + 1;
    });
    
    console.log('=== Duration Field Analysis ===');
    console.log('Total orders:', orders.length);
    console.log('\nDuration value distribution:');
    
    Object.entries(durationCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([value, count]) => {
        const percentage = ((count / orders.length) * 100).toFixed(1);
        console.log(`  "${value}": ${count} orders (${percentage}%)`);
      });
    
    // Identify problematic values
    const problemValues = Object.keys(durationCounts).filter(val => 
      val.includes('天') || 
      val.includes('月') || 
      val.includes('年') ||
      val.includes('免费') ||
      val === '7 days' ||
      val === '1 month' ||
      val === '3 months' ||
      val === '6 months'
    );
    
    if (problemValues.length > 0) {
      console.log('\n⚠️ Found inconsistent duration values that need normalization:');
      problemValues.forEach(val => {
        console.log(`  - "${val}" (${durationCounts[val]} orders)`);
      });
      
      console.log('\n📋 Suggested normalization mapping:');
      console.log('  "7天免费", "7天", "7 days" → "7days"');
      console.log('  "1月", "1个月", "1 month" → "1month"');
      console.log('  "3月", "3个月", "3 months" → "3months"');
      console.log('  "6月", "6个月", "6 months" → "6months"');
      console.log('  "1年", "1 year" → "1year"');
    }
    
    return {
      total: orders.length,
      distribution: durationCounts,
      problemValues
    };
    
  } catch (err) {
    console.error('Error analyzing duration field:', err);
    return null;
  }
}

// Function to normalize duration values
export async function normalizeDurationValues() {
  const mapping = {
    '7天免费': '7days',
    '7天': '7days',
    '7 days': '7days',
    '1月': '1month',
    '1个月': '1month',
    '1 month': '1month',
    '3月': '3months',
    '3个月': '3months',
    '3 months': '3months',
    '6月': '6months',
    '6个月': '6months',
    '6 months': '6months',
    '1年': '1year',
    '1 year': '1year'
  };
  
  console.log('Starting duration normalization...');
  
  for (const [oldValue, newValue] of Object.entries(mapping)) {
    const { data, error } = await supabase
      .from('orders_optimized')
      .update({ duration: newValue })
      .eq('duration', oldValue);
    
    if (error) {
      console.error(`Failed to update "${oldValue}" to "${newValue}":`, error);
    } else {
      console.log(`✓ Updated "${oldValue}" to "${newValue}"`);
    }
  }
  
  console.log('Duration normalization complete!');
}
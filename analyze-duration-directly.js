const { Client } = require('pg');
require('dotenv').config();

// Direct database connection
const connectionString = process.env.DIRECT_DATABASE_URL || 'postgresql://postgres.tfuhjtrluvjcgqjwlhze:Allinpay%40413@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: connectionString
});

async function analyzeDuration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // First check if table exists and get column info
    const checkTable = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'orders_optimized'
      AND column_name IN ('duration', 'price_plan', 'expiry_time')
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Table Structure ===');
    console.log('Columns in orders_optimized:');
    checkTable.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });
    
    // Get duration value distribution
    const durationStats = await client.query(`
      SELECT 
        duration,
        COUNT(*) as count,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen
      FROM orders_optimized
      WHERE duration IS NOT NULL
      GROUP BY duration
      ORDER BY count DESC
    `);
    
    console.log('\n=== Duration Values Distribution ===');
    console.log('Value | Count | First Seen | Last Seen');
    console.log('------|-------|------------|----------');
    durationStats.rows.forEach(row => {
      const firstDate = new Date(row.first_seen).toISOString().split('T')[0];
      const lastDate = new Date(row.last_seen).toISOString().split('T')[0];
      console.log(`"${row.duration}" | ${row.count} | ${firstDate} | ${lastDate}`);
    });
    
    // Check some specific examples
    const examples = await client.query(`
      SELECT 
        id,
        duration,
        price_plan,
        status,
        expiry_time,
        created_at
      FROM orders_optimized
      WHERE duration IN ('7天免费', '7天', '7days', '1year', '1年')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n=== Sample Records with Different Duration Formats ===');
    examples.rows.forEach(row => {
      console.log(`ID: ${row.id.substring(0,8)}...`);
      console.log(`  Duration: "${row.duration}"`);
      console.log(`  Price Plan: ${row.price_plan}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Expiry: ${row.expiry_time ? new Date(row.expiry_time).toISOString() : 'NULL'}`);
      console.log('');
    });
    
    // Check if there's a mapping issue
    const mappingCheck = await client.query(`
      SELECT DISTINCT
        duration,
        price_plan
      FROM orders_optimized
      WHERE duration IS NOT NULL
      ORDER BY duration, price_plan
    `);
    
    console.log('\n=== Duration to Price Plan Mapping ===');
    mappingCheck.rows.forEach(row => {
      console.log(`  Duration: "${row.duration}" => Price Plan: ${row.price_plan || 'NULL'}`);
    });
    
    console.log('\n=== Analysis Summary ===');
    console.log('The duration field contains inconsistent values that need normalization:');
    console.log('1. Chinese text: "7天免费", "7天" (should be "7days")');
    console.log('2. English variations: "1year" vs "1年" (should be consistent)');
    console.log('3. This causes display issues in the UI');
    console.log('\nRecommended action: Update all duration values to consistent format');
    console.log('Suggested mapping:');
    console.log('  "7天免费", "7天", "7 days" => "7days"');
    console.log('  "1月", "1个月", "1month" => "1month"');
    console.log('  "3月", "3个月", "3months" => "3months"');
    console.log('  "6月", "6个月", "6months" => "6months"');
    console.log('  "1年", "1year" => "1year"');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

analyzeDuration();
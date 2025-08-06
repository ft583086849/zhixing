#!/usr/bin/env node

/**
 * 🔍 检查实际数据库表结构
 * 查看secondary_sales表是否真的存在sales_type字段
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3JJKTJtSPLEu1zWXqPorS-FDSZzRU_0ge_Y-r0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  console.log('🔍 检查数据库表结构...\n');

  try {
    // 1. 检查secondary_sales表结构
    console.log('📋 1. 检查secondary_sales表是否存在...');
    const { data: secondaryData, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .limit(1);

    if (secondaryError) {
      console.log('❌ secondary_sales表不存在或无法访问:');
      console.log('   错误:', secondaryError.message);
    } else {
      console.log('✅ secondary_sales表存在');
      if (secondaryData && secondaryData.length > 0) {
        console.log('📊 表字段结构:');
        Object.keys(secondaryData[0]).forEach(field => {
          console.log(`   - ${field}: ${typeof secondaryData[0][field]}`);
        });
        
        // 特别检查sales_type字段
        if (secondaryData[0].hasOwnProperty('sales_type')) {
          console.log('✅ sales_type字段存在');
        } else {
          console.log('❌ sales_type字段不存在');
        }
      } else {
        console.log('ℹ️  表为空，无法确定字段结构');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 检查primary_sales表结构
    console.log('📋 2. 检查primary_sales表是否存在...');
    const { data: primaryData, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*')
      .limit(1);

    if (primaryError) {
      console.log('❌ primary_sales表不存在或无法访问:');
      console.log('   错误:', primaryError.message);
    } else {
      console.log('✅ primary_sales表存在');
      if (primaryData && primaryData.length > 0) {
        console.log('📊 表字段结构:');
        Object.keys(primaryData[0]).forEach(field => {
          console.log(`   - ${field}: ${typeof primaryData[0][field]}`);
        });
        
        // 特别检查sales_type字段
        if (primaryData[0].hasOwnProperty('sales_type')) {
          console.log('✅ sales_type字段存在');
        } else {
          console.log('❌ sales_type字段不存在');
        }
      } else {
        console.log('ℹ️  表为空，无法确定字段结构');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 检查orders表结构（对比）
    console.log('📋 3. 检查orders表结构（对比）...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ orders表不存在或无法访问:');
      console.log('   错误:', ordersError.message);
    } else {
      console.log('✅ orders表存在');
      if (ordersData && ordersData.length > 0) {
        console.log('📊 表字段结构:');
        Object.keys(ordersData[0]).forEach(field => {
          console.log(`   - ${field}: ${typeof ordersData[0][field]}`);
        });
        
        // 特别检查sales_type字段
        if (ordersData[0].hasOwnProperty('sales_type')) {
          console.log('✅ sales_type字段存在');
        } else {
          console.log('❌ sales_type字段不存在');
        }
      } else {
        console.log('ℹ️  表为空，无法确定字段结构');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 尝试插入测试数据验证字段
    console.log('📋 4. 尝试模拟插入验证字段存在性...');
    
    try {
      // 模拟插入secondary_sales，包含sales_type字段
      const testData = {
        wechat_name: 'TEST_VALIDATION_' + Date.now(),
        payment_method: 'alipay',
        alipay_account: 'test@test.com',
        sales_code: 'TEST_' + Date.now(),
        sales_type: 'secondary'  // 这个字段如果不存在会报错
      };

      console.log('尝试插入包含sales_type的测试数据...');
      const { data: insertData, error: insertError } = await supabase
        .from('secondary_sales')
        .insert([testData])
        .select();

      if (insertError) {
        console.log('❌ 插入失败，确认字段问题:');
        console.log('   错误:', insertError.message);
        
        if (insertError.message.includes('sales_type')) {
          console.log('🎯 确认: sales_type字段不存在于secondary_sales表中');
        }
      } else {
        console.log('✅ 插入成功，sales_type字段存在');
        console.log('   插入的数据ID:', insertData[0]?.id);
        
        // 清理测试数据
        if (insertData[0]?.id) {
          await supabase
            .from('secondary_sales')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 已清理测试数据');
        }
      }
    } catch (error) {
      console.log('❌ 测试插入异常:', error.message);
    }

  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

// 运行检查
checkTableStructure()
  .then(() => {
    console.log('\n✅ 表结构检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  });
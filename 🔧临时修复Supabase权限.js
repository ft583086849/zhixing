#!/usr/bin/env node

/**
 * 🔧 临时修复Supabase权限问题
 * 针对RLS和API权限问题的紧急修复
 */

const https = require('https');

// Supabase配置
const SUPABASE_URL = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

function makeSupabaseRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: responseData,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSupabaseDirectly() {
  console.log('🔧 直接测试Supabase API...\n');

  // 1. 测试表是否存在
  console.log('📋 1. 检查表是否存在...');
  
  try {
    // 检查primary_sales表
    const primaryCheck = await makeSupabaseRequest('/rest/v1/primary_sales?limit=1');
    console.log(`primary_sales表: ${primaryCheck.statusCode === 200 ? '✅ 存在' : '❌ 不存在或无权限'}`);
    if (primaryCheck.statusCode !== 200) {
      console.log(`   错误: ${primaryCheck.raw}`);
    }

    // 检查secondary_sales表  
    const secondaryCheck = await makeSupabaseRequest('/rest/v1/secondary_sales?limit=1');
    console.log(`secondary_sales表: ${secondaryCheck.statusCode === 200 ? '✅ 存在' : '❌ 不存在或无权限'}`);
    if (secondaryCheck.statusCode !== 200) {
      console.log(`   错误: ${secondaryCheck.raw}`);
    }

  } catch (error) {
    console.log(`❌ 表检查失败: ${error.message}`);
  }

  // 2. 测试插入权限
  console.log('\n📋 2. 测试插入权限...');
  
  try {
    // 测试primary_sales插入
    const testPrimaryData = {
      wechat_name: 'TEST_PERMISSION_' + Date.now(),
      payment_method: 'alipay',
      // 尝试不同的字段名
      // alipay_account: 'test@permission.com',  // 这个字段不存在
      name: '权限测试',
      sales_code: 'TEST_' + Date.now(),
      sales_type: 'primary'
    };

    console.log('尝试插入primary_sales...');
    const primaryInsert = await makeSupabaseRequest('/rest/v1/primary_sales', 'POST', testPrimaryData);
    
    if (primaryInsert.statusCode === 201) {
      console.log('✅ primary_sales插入成功');
      
      // 清理测试数据
      if (primaryInsert.data && primaryInsert.data[0] && primaryInsert.data[0].id) {
        await makeSupabaseRequest(`/rest/v1/primary_sales?id=eq.${primaryInsert.data[0].id}`, 'DELETE');
        console.log('🧹 测试数据已清理');
      }
    } else {
      console.log(`❌ primary_sales插入失败: ${primaryInsert.statusCode}`);
      console.log(`   详细错误: ${primaryInsert.raw}`);
    }

  } catch (error) {
    console.log(`❌ 插入测试失败: ${error.message}`);
  }

  // 3. 测试secondary_sales插入
  try {
    const testSecondaryData = {
      wechat_name: 'TEST_SEC_PERMISSION_' + Date.now(),
      payment_method: 'alipay', 
      // alipay_account: 'test2@permission.com',  // 这个字段不存在
      name: '权限测试2',
      sales_code: 'TESTSEC_' + Date.now(),
      sales_type: 'secondary'
    };

    console.log('\n尝试插入secondary_sales...');
    const secondaryInsert = await makeSupabaseRequest('/rest/v1/secondary_sales', 'POST', testSecondaryData);
    
    if (secondaryInsert.statusCode === 201) {
      console.log('✅ secondary_sales插入成功');
      
      // 清理测试数据
      if (secondaryInsert.data && secondaryInsert.data[0] && secondaryInsert.data[0].id) {
        await makeSupabaseRequest(`/rest/v1/secondary_sales?id=eq.${secondaryInsert.data[0].id}`, 'DELETE');
        console.log('🧹 测试数据已清理');
      }
    } else {
      console.log(`❌ secondary_sales插入失败: ${secondaryInsert.statusCode}`);
      console.log(`   详细错误: ${secondaryInsert.raw}`);
    }

  } catch (error) {
    console.log(`❌ secondary_sales插入测试失败: ${error.message}`);
  }

  console.log('\n📊 诊断结果:');
  console.log('如果看到 "permission denied" 或 403错误 → RLS权限问题');
  console.log('如果看到 404错误 → 表不存在');  
  console.log('如果看到字段相关错误 → 表结构不匹配');
  console.log('如果看到 401错误 → API Key权限不足');
}

testSupabaseDirectly().catch(console.error);
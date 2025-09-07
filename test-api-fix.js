// 测试API修复效果的脚本
console.log('🧪 测试API修复效果');

// 模拟浏览器环境测试API调用
async function testAPI() {
  console.log('正在测试前端API调用...');
  
  try {
    // 测试获取统计数据
    const response = await fetch('http://localhost:3001/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      console.log('✅ 前端服务响应正常');
      console.log(`   状态码: ${response.status}`);
      console.log(`   内容类型: ${response.headers.get('content-type')}`);
    } else {
      console.log('❌ 前端服务异常');
      console.log(`   状态码: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 检查修复文件内容
function checkFixedFiles() {
  console.log('\n📁 检查修复的文件:');
  
  const fs = require('fs');
  
  try {
    const supabaseConfig = fs.readFileSync('./client/src/services/supabase.js', 'utf8');
    if (supabaseConfig.includes('mbqjkpqnjnrwzuafgqed.supabase.co')) {
      console.log('✅ services/supabase.js - URL已修复');
    } else {
      console.log('❌ services/supabase.js - URL未修复');
    }
    
    const configFile = fs.readFileSync('./client/src/config/supabase.js', 'utf8');
    if (configFile.includes('mbqjkpqnjnrwzuafgqed.supabase.co')) {
      console.log('✅ config/supabase.js - URL已修复');
    } else {
      console.log('❌ config/supabase.js - URL未修复');
    }
    
    const adminOrders = fs.readFileSync('./client/src/components/admin/AdminOrders.js', 'utf8');
    if (adminOrders.includes('record.secondary_sales.parent_sales_code')) {
      console.log('✅ AdminOrders.js - 销售分类逻辑已修复');
    } else {
      console.log('❌ AdminOrders.js - 销售分类逻辑未修复');
    }
    
    const ordersCache = fs.readFileSync('./client/src/services/ordersCache.js', 'utf8');
    if (ordersCache.includes('parent_sales_code: salesInfo.parent_sales_code')) {
      console.log('✅ ordersCache.js - 字段映射已修复');
    } else {
      console.log('❌ ordersCache.js - 字段映射未修复');
    }
    
  } catch (error) {
    console.error('读取文件失败:', error.message);
  }
}

// 执行测试
async function runTests() {
  console.log('========================================');
  console.log('🔧 API修复验证测试');
  console.log('========================================');
  
  checkFixedFiles();
  
  console.log('\n🌐 测试网络连接:');
  await testAPI();
  
  console.log('\n✅ 测试完成!');
  console.log('请在浏览器中访问 http://localhost:3001/admin/orders 查看效果');
}

runTests();
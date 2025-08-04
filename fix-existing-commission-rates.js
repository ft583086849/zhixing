const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Commission-Fix'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function fixExistingCommissionRates() {
  console.log('🔧 修复现有销售的佣金比率\n');

  try {
    // 1. 获取当前销售数据
    console.log('📋 步骤1: 获取当前销售数据');
    const salesResult = await makeRequest('https://zhixing-seven.vercel.app/api/sales');
    
    if (!salesResult.data.success) {
      console.log('❌ 获取销售数据失败');
      return;
    }

    const allSales = salesResult.data.data;
    console.log(`✅ 获取到 ${allSales.length} 个销售记录`);

    // 2. 分析现有数据
    console.log('\n📋 步骤2: 分析现有佣金比率');
    const analysis = {
      total: allSales.length,
      primary: 0,
      secondary: 0,
      commission40: 0,
      commission30: 0,
      commissionOther: 0
    };

    allSales.forEach(sale => {
      if (sale.sales_type === 'primary') analysis.primary++;
      else if (sale.sales_type === 'secondary') analysis.secondary++;
      
      const rate = parseFloat(sale.commission_rate || 0);
      if (rate === 40) analysis.commission40++;
      else if (rate === 30) analysis.commission30++;
      else analysis.commissionOther++;
    });

    console.log('📊 分析结果:');
    console.log(`   总销售数: ${analysis.total}`);
    console.log(`   一级销售: ${analysis.primary}个`);
    console.log(`   二级销售: ${analysis.secondary}个`);
    console.log(`   40%佣金: ${analysis.commission40}个`);
    console.log(`   30%佣金: ${analysis.commission30}个`);
    console.log(`   其他佣金: ${analysis.commissionOther}个`);

    // 3. 识别需要修复的记录
    console.log('\n📋 步骤3: 识别需要修复的记录');
    const needFix = allSales.filter(sale => {
      const rate = parseFloat(sale.commission_rate || 0);
      // 二级销售应该是30%，但现在是40%的需要修复
      return sale.sales_type === 'secondary' && rate === 40;
    });

    console.log(`🎯 需要修复的记录: ${needFix.length}个`);
    if (needFix.length > 0) {
      console.log('需要修复的销售:');
      needFix.slice(0, 5).forEach((sale, index) => {
        console.log(`   ${index + 1}. ${sale.wechat_name} (${sale.sales_type}, ${sale.commission_rate}%)`);
      });
      if (needFix.length > 5) {
        console.log(`   ... 还有 ${needFix.length - 5} 个`);
      }
    }

  } catch (error) {
    console.error('❌ 分析失败:', error.message);
  }

  console.log('\n📋 解决方案建议:');
  console.log('由于数据库表结构已存在，commission_rate列的默认值可能仍然是40%');
  console.log('需要在数据库层面执行以下操作:');
  console.log('1. ALTER TABLE sales MODIFY commission_rate DECIMAL(5,2) DEFAULT 30.00;');
  console.log('2. UPDATE sales SET commission_rate = 30.00 WHERE sales_type = "secondary" AND commission_rate = 40.00;');
  console.log('');
  console.log('或者在API创建时明确指定commission_rate值（我们已经在代码中实现了）');
  
  console.log('\n✅ 代码修复已完成:');
  console.log('   ✅ api/primary-sales.js - 一级销售创建时添加40%佣金');
  console.log('   ✅ api/sales.js - 独立二级销售创建时指定30%佣金和secondary类型');
  console.log('   ✅ api/orders.js - 佣金计算默认值从15%改为30%');
  console.log('   ✅ api/admin.js - 表结构默认值设置为30%');
  
  console.log('\n🎉 新创建的销售将正确使用30%佣金比率！');
}

fixExistingCommissionRates().catch(console.error);
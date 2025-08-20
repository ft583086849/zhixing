const { Client } = require('pg');

// 直接数据库连接
const client = new Client({
  connectionString: 'postgresql://postgres.tfuhjtrluvjcgqjwlhze:Allinpay%40413@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function normalizeDuration() {
  try {
    await client.connect();
    console.log('✅ 已连接到数据库\n');
    
    // 先查看当前的duration值分布
    const checkQuery = `
      SELECT duration, COUNT(*) as count
      FROM orders_optimized
      WHERE duration IS NOT NULL
      GROUP BY duration
      ORDER BY count DESC
    `;
    
    const checkResult = await client.query(checkQuery);
    console.log('📊 当前duration值分布:');
    console.log('------------------------');
    checkResult.rows.forEach(row => {
      console.log(`  "${row.duration}": ${row.count} 条`);
    });
    
    // 定义更新映射
    const updates = [
      { 
        newValue: '7天',
        oldValues: ['7天免费', '7days', '7 days', '7日', '七天']
      },
      {
        newValue: '1个月', 
        oldValues: ['1月', '1month', '1 month', '一个月', '30天', '30 days']
      },
      {
        newValue: '3个月',
        oldValues: ['3月', '3months', '3 months', '三个月', '90天', '90 days']
      },
      {
        newValue: '6个月',
        oldValues: ['6月', '6months', '6 months', '六个月', '180天', '180 days', '半年']
      },
      {
        newValue: '1年',
        oldValues: ['1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days']
      }
    ];
    
    console.log('\n🔧 开始规范化...');
    console.log('------------------------');
    
    let totalUpdated = 0;
    
    // 执行更新
    for (const update of updates) {
      for (const oldValue of update.oldValues) {
        const updateQuery = `
          UPDATE orders_optimized
          SET duration = $1
          WHERE duration = $2
        `;
        
        const result = await client.query(updateQuery, [update.newValue, oldValue]);
        
        if (result.rowCount > 0) {
          console.log(`  ✅ 更新 ${result.rowCount} 条: "${oldValue}" → "${update.newValue}"`);
          totalUpdated += result.rowCount;
        }
      }
    }
    
    console.log(`\n✨ 规范化完成！共更新 ${totalUpdated} 条记录\n`);
    
    // 验证最终结果
    const finalResult = await client.query(checkQuery);
    console.log('📊 规范化后的duration值分布:');
    console.log('------------------------');
    finalResult.rows.forEach(row => {
      console.log(`  "${row.duration}": ${row.count} 条`);
    });
    
    // 检查是否还有非标准值
    const standardValues = ['7天', '1个月', '3个月', '6个月', '1年'];
    const nonStandard = finalResult.rows.filter(row => 
      !standardValues.includes(row.duration)
    );
    
    if (nonStandard.length > 0) {
      console.log('\n⚠️  发现非标准值:');
      nonStandard.forEach(row => {
        console.log(`  "${row.duration}": ${row.count} 条`);
      });
    } else {
      console.log('\n✅ 所有duration值已规范化为中文格式！');
    }
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

// 执行
console.log('========================================');
console.log('Duration字段中文规范化工具');
console.log('========================================\n');

normalizeDuration();
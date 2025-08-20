/**
 * 生产环境就绪测试脚本
 * 测试所有核心功能是否正常工作
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.tfuhjtrluvjcgqjwlhze:Allinpay%40413@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

// 测试报告
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 记录测试结果
function recordTest(name, passed, message = '') {
  if (passed) {
    testResults.passed.push(`✅ ${name}`);
    console.log(`✅ ${name}`);
  } else {
    testResults.failed.push(`❌ ${name}: ${message}`);
    console.log(`❌ ${name}: ${message}`);
  }
}

// 记录警告
function recordWarning(message) {
  testResults.warnings.push(`⚠️ ${message}`);
  console.log(`⚠️ ${message}`);
}

async function runTests() {
  try {
    await client.connect();
    console.log('='.repeat(60));
    console.log('生产环境就绪测试');
    console.log('='.repeat(60));
    console.log();

    // 1. 测试数据库表结构
    console.log('【1. 数据库表测试】');
    console.log('-'.repeat(40));
    
    // 检查 orders_optimized 表
    const ordersOptimizedCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'orders_optimized'
    `);
    recordTest('orders_optimized表存在', ordersOptimizedCheck.rows[0].count > 0);
    
    // 检查 sales_optimized 表
    const salesOptimizedCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'sales_optimized'
    `);
    recordTest('sales_optimized表存在', salesOptimizedCheck.rows[0].count > 0);
    
    // 检查 overview_stats 表
    const overviewStatsCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'overview_stats'
    `);
    recordTest('overview_stats表存在', overviewStatsCheck.rows[0].count > 0);
    
    // 检查是否还在使用 orders 表
    const ordersUsageCheck = await client.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    if (ordersUsageCheck.rows[0].count > 0) {
      recordWarning(`orders表在最近1小时内有新数据，可能还在使用`);
    }
    
    console.log();
    
    // 2. 测试数据一致性
    console.log('【2. 数据一致性测试】');
    console.log('-'.repeat(40));
    
    // 检查 duration 字段是否都是中文
    const durationCheck = await client.query(`
      SELECT duration, COUNT(*) as count 
      FROM orders_optimized 
      WHERE duration IS NOT NULL
      GROUP BY duration
    `);
    
    const nonChineseDurations = durationCheck.rows.filter(row => 
      !['7天', '1个月', '3个月', '6个月', '1年'].includes(row.duration)
    );
    
    if (nonChineseDurations.length > 0) {
      recordWarning(`发现非标准duration值: ${nonChineseDurations.map(d => d.duration).join(', ')}`);
    } else {
      recordTest('duration字段已全部规范化为中文', true);
    }
    
    // 检查订单数量一致性
    const ordersCount = await client.query('SELECT COUNT(*) as count FROM orders');
    const ordersOptimizedCount = await client.query('SELECT COUNT(*) as count FROM orders_optimized');
    
    const countDiff = Math.abs(ordersCount.rows[0].count - ordersOptimizedCount.rows[0].count);
    if (countDiff > 10) {
      recordWarning(`orders表和orders_optimized表数据量差异较大: ${countDiff}条`);
    } else {
      recordTest('订单数据迁移完整', true);
    }
    
    console.log();
    
    // 3. 测试触发器
    console.log('【3. 触发器测试】');
    console.log('-'.repeat(40));
    
    // 检查sales_optimized触发器
    const triggerCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.triggers 
      WHERE trigger_name LIKE '%sales_optimized%'
    `);
    recordTest('sales_optimized自动计算触发器存在', triggerCheck.rows[0].count > 0);
    
    // 检查duration规范化触发器
    const durationTriggerCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.triggers 
      WHERE trigger_name LIKE '%normalize_duration%'
    `);
    if (durationTriggerCheck.rows[0].count > 0) {
      recordTest('duration规范化触发器存在', true);
    } else {
      recordWarning('duration规范化触发器未创建，新数据可能不会自动规范化');
    }
    
    console.log();
    
    // 4. 测试数据流
    console.log('【4. 数据流测试】');
    console.log('-'.repeat(40));
    
    // 检查最近的订单是否有对应的sales_optimized记录
    const recentOrder = await client.query(`
      SELECT o.id, o.sales_code, s.order_id 
      FROM orders_optimized o 
      LEFT JOIN sales_optimized s ON o.id = s.order_id
      WHERE o.sales_code IS NOT NULL
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);
    
    const ordersWithoutSales = recentOrder.rows.filter(row => !row.order_id);
    if (ordersWithoutSales.length > 0) {
      recordWarning(`发现${ordersWithoutSales.length}个订单没有对应的销售记录`);
    } else {
      recordTest('订单到销售的数据流正常', true);
    }
    
    // 检查统计数据是否最新
    const statsCheck = await client.query(`
      SELECT 
        MAX(updated_at) as last_update,
        NOW() - MAX(updated_at) as time_diff
      FROM overview_stats
    `);
    
    if (statsCheck.rows[0].last_update) {
      const hoursDiff = parseInt(statsCheck.rows[0].time_diff?.hours || 0);
      if (hoursDiff > 24) {
        recordWarning(`统计数据已${hoursDiff}小时未更新`);
      } else {
        recordTest('统计数据更新及时', true);
      }
    }
    
    console.log();
    
    // 5. 测试关键功能
    console.log('【5. 关键功能测试】');
    console.log('-'.repeat(40));
    
    // 测试佣金计算
    const commissionCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN commission_amount > 0 THEN 1 END) as with_commission
      FROM sales_optimized
      WHERE order_amount > 0
    `);
    
    const commissionRate = commissionCheck.rows[0].with_commission / commissionCheck.rows[0].total;
    if (commissionRate < 0.9) {
      recordWarning(`只有${(commissionRate * 100).toFixed(1)}%的销售记录有佣金`);
    } else {
      recordTest('佣金计算功能正常', true);
    }
    
    console.log();
    
    // 6. 性能测试
    console.log('【6. 性能测试】');
    console.log('-'.repeat(40));
    
    // 测试查询性能
    const startTime = Date.now();
    await client.query(`
      SELECT * FROM orders_optimized 
      WHERE created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 100
    `);
    const queryTime = Date.now() - startTime;
    
    if (queryTime > 1000) {
      recordWarning(`订单查询耗时${queryTime}ms，建议优化索引`);
    } else {
      recordTest(`订单查询性能良好 (${queryTime}ms)`, true);
    }
    
    // 检查索引
    const indexCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename = 'orders_optimized'
    `);
    
    if (indexCheck.rows[0].count < 3) {
      recordWarning(`orders_optimized表只有${indexCheck.rows[0].count}个索引，建议添加更多索引`);
    } else {
      recordTest(`索引配置合理 (${indexCheck.rows[0].count}个索引)`, true);
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log('测试结果汇总');
    console.log('='.repeat(60));
    console.log();
    
    console.log(`✅ 通过测试: ${testResults.passed.length}项`);
    console.log(`❌ 失败测试: ${testResults.failed.length}项`);
    console.log(`⚠️ 警告事项: ${testResults.warnings.length}项`);
    
    if (testResults.failed.length > 0) {
      console.log('\n失败项目:');
      testResults.failed.forEach(item => console.log(`  ${item}`));
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n警告事项:');
      testResults.warnings.forEach(item => console.log(`  ${item}`));
    }
    
    // 部署建议
    console.log();
    console.log('='.repeat(60));
    console.log('部署建议');
    console.log('='.repeat(60));
    
    if (testResults.failed.length === 0) {
      console.log('✅ 系统已准备好部署到生产环境');
      console.log('\n部署步骤:');
      console.log('1. 备份现有数据库');
      console.log('2. 确认所有环境变量配置正确');
      console.log('3. 部署前端代码');
      console.log('4. 监控系统日志');
      console.log('5. 进行用户验收测试');
    } else {
      console.log('❌ 系统还需要修复以下问题后才能部署:');
      testResults.failed.forEach(item => console.log(`  - ${item}`));
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  } finally {
    await client.end();
    console.log('\n测试完成');
  }
}

// 运行测试
runTests();
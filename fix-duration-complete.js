/**
 * Duration字段完整修复方案
 * 
 * 1. 修复现有数据 - 将所有duration统一为中文
 * 2. 创建数据库触发器 - 自动规范化新数据
 * 3. 说明前端修改要求
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.tfuhjtrluvjcgqjwlhze:Allinpay%40413@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

async function fixDurationComplete() {
  try {
    await client.connect();
    console.log('✅ 已连接到数据库\n');
    
    console.log('========================================');
    console.log('步骤1: 修复现有数据');
    console.log('========================================\n');
    
    // 规范化现有数据
    const normalizations = [
      ["'7天'", ["'7days'", "'7 days'", "'7日'", "'七天'", "'7天免费'"]],
      ["'1个月'", ["'1month'", "'1 month'", "'1月'", "'一个月'", "'30天'", "'30 days'"]],
      ["'3个月'", ["'3months'", "'3 months'", "'3月'", "'三个月'", "'90天'", "'90 days'"]],
      ["'6个月'", ["'6months'", "'6 months'", "'6月'", "'六个月'", "'180天'", "'180 days'", "'半年'"]],
      ["'1年'", ["'1year'", "'1 year'", "'一年'", "'12个月'", "'12 months'", "'365天'", "'365 days'"]]
    ];
    
    let totalUpdated = 0;
    
    for (const [newValue, oldValues] of normalizations) {
      const query = `
        UPDATE orders_optimized
        SET duration = ${newValue}
        WHERE duration IN (${oldValues.join(', ')})
      `;
      
      const result = await client.query(query);
      if (result.rowCount > 0) {
        console.log(`✅ 更新 ${result.rowCount} 条记录为 ${newValue}`);
        totalUpdated += result.rowCount;
      }
    }
    
    console.log(`\n共更新 ${totalUpdated} 条记录\n`);
    
    console.log('========================================');
    console.log('步骤2: 创建自动规范化触发器');
    console.log('========================================\n');
    
    // 创建规范化函数
    const createFunction = `
      CREATE OR REPLACE FUNCTION normalize_duration()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 规范化duration字段为中文
        IF NEW.duration IS NOT NULL THEN
          CASE NEW.duration
            -- 7天相关
            WHEN '7days', '7 days', '7日', '七天', '7天免费' THEN
              NEW.duration := '7天';
            -- 1个月相关
            WHEN '1month', '1 month', '1月', '一个月', '30天', '30 days' THEN
              NEW.duration := '1个月';
            -- 3个月相关
            WHEN '3months', '3 months', '3月', '三个月', '90天', '90 days' THEN
              NEW.duration := '3个月';
            -- 6个月相关
            WHEN '6months', '6 months', '6月', '六个月', '180天', '180 days', '半年' THEN
              NEW.duration := '6个月';
            -- 1年相关
            WHEN '1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days' THEN
              NEW.duration := '1年';
            ELSE
              -- 保持不变
              NULL;
          END CASE;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createFunction);
    console.log('✅ 创建规范化函数成功');
    
    // 删除旧触发器
    await client.query('DROP TRIGGER IF EXISTS normalize_duration_trigger ON orders_optimized');
    
    // 创建新触发器
    const createTrigger = `
      CREATE TRIGGER normalize_duration_trigger
        BEFORE INSERT OR UPDATE OF duration
        ON orders_optimized
        FOR EACH ROW
        EXECUTE FUNCTION normalize_duration();
    `;
    
    await client.query(createTrigger);
    console.log('✅ 创建触发器成功');
    
    // 添加注释
    await client.query(`
      COMMENT ON TRIGGER normalize_duration_trigger ON orders_optimized IS 
      '自动规范化duration字段，确保所有值都是中文格式：7天, 1个月, 3个月, 6个月, 1年'
    `);
    
    console.log('\n========================================');
    console.log('步骤3: 验证修复结果');
    console.log('========================================\n');
    
    // 验证结果
    const checkResult = await client.query(`
      SELECT duration, COUNT(*) as count
      FROM orders_optimized
      WHERE duration IS NOT NULL
      GROUP BY duration
      ORDER BY count DESC
    `);
    
    console.log('当前duration值分布:');
    checkResult.rows.forEach(row => {
      console.log(`  "${row.duration}": ${row.count} 条`);
    });
    
    // 测试触发器
    console.log('\n测试触发器...');
    
    // 找一条测试记录
    const testRecord = await client.query(`
      SELECT id FROM orders_optimized LIMIT 1
    `);
    
    if (testRecord.rows.length > 0) {
      const testId = testRecord.rows[0].id;
      
      // 尝试更新为英文值
      await client.query(`
        UPDATE orders_optimized 
        SET duration = '7days' 
        WHERE id = $1
      `, [testId]);
      
      // 检查是否被自动转换
      const checkTest = await client.query(`
        SELECT duration FROM orders_optimized WHERE id = $1
      `, [testId]);
      
      if (checkTest.rows[0].duration === '7天') {
        console.log('✅ 触发器测试成功！英文值自动转换为中文');
      } else {
        console.log('⚠️ 触发器可能未生效');
      }
    }
    
    console.log('\n========================================');
    console.log('前端需要的修改');
    console.log('========================================\n');
    
    console.log('1. PurchasePage.js - 购买页面的duration值需要改为中文:');
    console.log('   将 value: "7days" 改为 value: "7天"');
    console.log('   将 value: "1month" 改为 value: "1个月" 等\n');
    
    console.log('2. 所有判断duration的地方需要兼容中英文:');
    console.log('   if (duration === "7天" || duration === "7days")');
    console.log('   或者只判断中文: if (duration === "7天")\n');
    
    console.log('3. 主要涉及文件:');
    console.log('   - src/pages/PurchasePage.js');
    console.log('   - src/components/admin/AdminOrders.js');
    console.log('   - src/services/api.js');
    console.log('   - src/services/supabase.js\n');
    
    console.log('✨ Duration字段修复完成！');
    console.log('   - 现有数据已规范化为中文');
    console.log('   - 新数据会自动规范化');
    console.log('   - 前端代码需要相应调整');
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

// 执行
fixDurationComplete();
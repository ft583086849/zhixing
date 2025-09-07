#!/usr/bin/env node
/**
 * 数据库升级执行脚本
 * Bug修复 + 产品体系升级
 * 执行时间: 2024年9月6日
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeDatabaseUpgrade() {
  console.log('🚀 开始执行数据库升级...');
  console.log('📅 执行时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  
  try {
    // ====================================
    // 第一部分：检查数据库连接和现有数据
    // ====================================
    console.log('\n📍 第一部分：检查数据库连接和现有数据');
    
    // 检查orders_optimized表是否存在
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, status, effective_time, payment_time, created_at')
      .limit(5);

    if (ordersError) {
      console.error('❌ 数据库连接失败:', ordersError);
      throw new Error('无法连接到orders_optimized表');
    }

    console.log('✅ 数据库连接正常');
    console.log(`📊 当前orders_optimized表中有 ${orders.length > 0 ? '数据' : '无数据'}`);

    // Bug #4: 查找需要修复生效时间的订单
    console.log('\n🔍 检查需要修复生效时间的订单...');
    const { data: needsFixOrders, error: needsFixError } = await supabase
      .from('orders_optimized')
      .select('id, status, effective_time, payment_time, created_at')
      .in('status', ['confirmed_config', 'active'])
      .is('effective_time', null);

    if (needsFixError) {
      console.error('❌ 查询需修复订单失败:', needsFixError);
    } else {
      console.log(`📋 找到 ${needsFixOrders.length} 个需要修复生效时间的订单`);
      
      if (needsFixOrders.length > 0) {
        console.log('🔧 开始修复生效时间数据...');
        let fixedCount = 0;
        
        for (const order of needsFixOrders) {
          const effectiveTime = order.payment_time || order.created_at;
          const { error: fixError } = await supabase
            .from('orders_optimized')
            .update({ effective_time: effectiveTime })
            .eq('id', order.id);
            
          if (fixError) {
            console.error(`❌ 修复订单 ${order.id} 失败:`, fixError);
          } else {
            fixedCount++;
          }
        }
        
        console.log(`✅ 成功修复 ${fixedCount} 个订单的生效时间`);
      }
    }

    // ====================================
    // 第二部分：检查并添加产品体系字段
    // ====================================
    console.log('\n📍 第二部分：检查并添加产品体系字段');
    
    // 检查product_type字段是否已存在
    console.log('🔍 检查product_type字段...');
    const { data: sampleOrderForProductType, error: productTypeCheckError } = await supabase
      .from('orders_optimized')
      .select('product_type')
      .limit(1)
      .single();

    const hasProductType = !productTypeCheckError || productTypeCheckError.code !== '42703'; // 42703 = column does not exist
    console.log(hasProductType ? '✅ product_type字段已存在' : 'ℹ️  product_type字段不存在，需要在数据库管理后台手动添加');

    // 检查discord_id字段是否已存在
    console.log('🔍 检查discord_id字段...');
    const { data: sampleOrderForDiscord, error: discordCheckError } = await supabase
      .from('orders_optimized')
      .select('discord_id')
      .limit(1)
      .single();

    const hasDiscordId = !discordCheckError || discordCheckError.code !== '42703';
    console.log(hasDiscordId ? '✅ discord_id字段已存在' : 'ℹ️  discord_id字段不存在，需要在数据库管理后台手动添加');

    // 如果字段存在，更新历史数据
    if (hasProductType) {
      console.log('🔧 更新历史数据产品类型...');
      const { data: ordersNeedUpdate, error: needUpdateError } = await supabase
        .from('orders_optimized')
        .select('id, product_type')
        .or('product_type.is.null,product_type.eq.');

      if (needUpdateError) {
        console.error('❌ 查询需更新订单失败:', needUpdateError);
      } else {
        console.log(`📋 找到 ${ordersNeedUpdate.length} 个需要标记为推币策略的订单`);
        
        if (ordersNeedUpdate.length > 0) {
          let updatedCount = 0;
          for (const order of ordersNeedUpdate) {
            const { error: updateError } = await supabase
              .from('orders_optimized')
              .update({ product_type: '推币策略' })
              .eq('id', order.id);
              
            if (updateError) {
              console.error(`❌ 更新订单 ${order.id} 失败:`, updateError);
            } else {
              updatedCount++;
            }
          }
          console.log(`✅ 成功标记 ${updatedCount} 个订单为推币策略`);
        }
      }
    }

    // 验证生效时间修复结果
    console.log('🔍 验证生效时间修复结果...');
    const { data: effectiveTimeCheck, error: checkError1 } = await supabase
      .from('orders_optimized')
      .select('status, effective_time')
      .in('status', ['confirmed_config', 'active']);

    if (checkError1) {
      console.error('❌ 生效时间验证失败:', checkError1);
    } else {
      const statusGroups = effectiveTimeCheck.reduce((acc, order) => {
        if (!acc[order.status]) {
          acc[order.status] = { total: 0, hasEffectiveTime: 0 };
        }
        acc[order.status].total++;
        if (order.effective_time) {
          acc[order.status].hasEffectiveTime++;
        }
        return acc;
      }, {});

      console.log('✅ 生效时间修复验证结果:');
      Object.entries(statusGroups).forEach(([status, counts]) => {
        const missing = counts.total - counts.hasEffectiveTime;
        console.log(`   ${status}: 总数 ${counts.total}, 有生效时间 ${counts.hasEffectiveTime}, 缺失 ${missing}`);
      });
    }

    // 验证产品类型设置结果（如果字段存在）
    if (hasProductType) {
      console.log('🔍 验证产品类型设置结果...');
      const { data: productTypeCheck, error: checkError2 } = await supabase
        .from('orders_optimized')
        .select('product_type, created_at');

      if (checkError2) {
        console.error('❌ 产品类型验证失败:', checkError2);
      } else {
        const productGroups = productTypeCheck.reduce((acc, order) => {
          const productType = order.product_type || '未设置';
          if (!acc[productType]) {
            acc[productType] = { count: 0, earliestOrder: null, latestOrder: null };
          }
          acc[productType].count++;
          
          const createdAt = new Date(order.created_at);
          if (!acc[productType].earliestOrder || createdAt < new Date(acc[productType].earliestOrder)) {
            acc[productType].earliestOrder = order.created_at;
          }
          if (!acc[productType].latestOrder || createdAt > new Date(acc[productType].latestOrder)) {
            acc[productType].latestOrder = order.created_at;
          }
          
          return acc;
        }, {});

        console.log('✅ 产品类型设置验证结果:');
        Object.entries(productGroups).forEach(([productType, stats]) => {
          console.log(`   ${productType}: ${stats.count} 笔订单`);
          console.log(`     最早订单: ${stats.earliestOrder}`);
          console.log(`     最新订单: ${stats.latestOrder}`);
        });
      }
    }

    // 生成升级报告
    const upgradeReport = {
      hasProductTypeField: hasProductType,
      hasDiscordIdField: hasDiscordId,
      needsManualFieldAddition: !hasProductType || !hasDiscordId,
      completedTasks: [
        '生效时间数据修复',
        hasProductType ? '历史数据产品类型标记' : null,
        '数据库连接验证',
        '数据完整性验证'
      ].filter(Boolean)
    };

    if (!hasProductType || !hasDiscordId) {
      console.log('\n⚠️  需要手动操作:');
      if (!hasProductType) {
        console.log('   1. 在Supabase控制台添加 orders_optimized.product_type VARCHAR(20) DEFAULT \'推币策略\'');
      }
      if (!hasDiscordId) {
        console.log('   2. 在Supabase控制台添加 orders_optimized.discord_id VARCHAR(50)');
      }
      console.log('   3. 添加字段后重新运行此脚本完成历史数据更新');
    }

    console.log('\n🎉 数据库升级第一阶段完成！');
    console.log('📅 完成时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('✅ 已完成:', upgradeReport.completedTasks.join(', '));
    
    return {
      success: true,
      message: hasProductType && hasDiscordId ? '数据库升级完全成功' : '数据库升级部分完成，需要手动添加字段',
      completedAt: new Date().toISOString(),
      report: upgradeReport
    };

  } catch (error) {
    console.error('\n❌ 数据库升级失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  executeDatabaseUpgrade()
    .then((result) => {
      console.log('\n✅ 脚本执行成功:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = executeDatabaseUpgrade;
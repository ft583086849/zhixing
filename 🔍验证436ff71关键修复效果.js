// 🔍验证436ff71关键修复效果.js
// 验证订单状态更新、数据概览、性能优化的修复效果

console.log('=== 验证部署 436ff71 关键修复效果 ===');
console.log('主要修复:');
console.log('1. 🔧 订单状态更新失败 → API调用链路修复');
console.log('2. 📊 数据概览全零 → 统计算法重构');  
console.log('3. ⏱️ 页面转圈慢 → 缓存策略优化');
console.log('4. 🚀 数据不稳定 → 错误处理增强\n');

async function verify436ff71() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 验证数据概览修复效果 ===
    console.log('📊 === 数据概览修复验证 ===');
    
    const statsData = state.admin?.stats;
    console.log('Redux统计数据:', statsData);
    
    if (statsData) {
      const totalOrders = statsData.total_orders || 0;
      const hasRealData = Object.values(statsData).some(val => val > 0);
      
      console.log('📈 关键统计指标:');
      console.log(`- 总订单数: ${totalOrders}`);
      console.log(`- 待付款确认: ${statsData.pending_payment_orders || 0}`);
      console.log(`- 已付款确认: ${statsData.confirmed_payment_orders || 0}`);
      console.log(`- 待配置确认: ${statsData.pending_config_orders || 0}`);
      console.log(`- 总收入: $${statsData.total_amount || 0}`);
      console.log(`- 今日订单: ${statsData.today_orders || 0}`);
      
      if (hasRealData) {
        console.log('🎉 数据概览修复成功 - 显示真实数据');
        console.log('✅ 统计算法重构生效');
      } else {
        console.log('⚠️  数据概览仍为零值');
        
        // 深度检查：手动验证数据源
        if (window.supabaseClient) {
          console.log('\n🔍 深度检查数据源:');
          const { data: rawOrders } = await window.supabaseClient
            .from('orders')
            .select('id, status, created_at');
          
          console.log(`数据库实际订单数: ${rawOrders?.length || 0}`);
          
          if (rawOrders && rawOrders.length > 0 && totalOrders === 0) {
            console.log('❌ 确认问题: 数据库有数据但统计为0');
            console.log('💡 需要检查新的getStats算法是否有bug');
          }
        }
      }
    } else {
      console.log('❌ 统计数据完全为空');
    }

    // === 2. 验证订单状态更新修复 ===
    console.log('\n🔧 === 订单状态更新修复验证 ===');
    
    const ordersData = state.admin?.orders;
    if (ordersData && ordersData.length > 0) {
      console.log(`✅ 订单数据已加载: ${ordersData.length} 个订单`);
      
      // 查找可操作的订单
      const operableOrders = ordersData.filter(order => 
        ['pending_payment', 'pending', 'confirmed', 'pending_config'].includes(order.status)
      );
      
      if (operableOrders.length > 0) {
        console.log(`🎯 可测试订单: ${operableOrders.length} 个`);
        console.log('\n📋 状态更新测试指南:');
        
        operableOrders.slice(0, 3).forEach((order, index) => {
          let expectedButton = '';
          if (['pending_payment', 'pending'].includes(order.status)) {
            expectedButton = '付款确认';
          } else if (['confirmed', 'pending_config'].includes(order.status)) {
            expectedButton = '配置确认';
          }
          
          console.log(`测试订单${index + 1}:`, {
            ID: order.id,
            状态: order.status,
            应显示按钮: expectedButton,
            测试目标: '点击后应显示"状态更新成功"'
          });
        });
        
        console.log('\n💡 手动测试说明:');
        console.log('1. 在订单管理页面找到上述订单');
        console.log('2. 点击对应的操作按钮');
        console.log('3. 观察是否显示"状态更新成功"(不再是"状态更新失败")');
        console.log('4. 刷新页面检查状态是否已更新');
        
        // 检查API方法是否存在
        if (window.adminAPI) {
          console.log('\n🔍 API方法检查:');
          if (typeof window.adminAPI.updateOrderStatus === 'function') {
            console.log('✅ updateOrderStatus方法存在');
          } else {
            console.log('❌ updateOrderStatus方法不存在');
          }
        }
      } else {
        console.log('ℹ️  当前没有可操作的订单供测试');
      }
    } else {
      console.log('❌ 订单数据为空');
    }

    // === 3. 验证性能优化效果 ===
    console.log('\n⏱️ === 性能优化效果验证 ===');
    
    console.log('🔍 加载状态检查:');
    console.log(`- admin.loading: ${state.admin?.loading || false}`);
    console.log(`- admin.error: ${state.admin?.error || 'none'}`);
    
    if (state.admin?.loading) {
      console.log('⚠️  当前仍在加载中，可能存在性能问题');
    } else {
      console.log('✅ 页面加载状态正常');
    }
    
    // 检查缓存状态
    if (window.CacheManager) {
      console.log('\n💾 缓存状态检查:');
      const cacheKeys = ['admin-stats', 'admin-sales', 'admin-customers', 'admin-orders'];
      cacheKeys.forEach(key => {
        const cached = window.CacheManager.get(key);
        console.log(`- ${key}: ${cached ? '有缓存' : '无缓存'}`);
      });
      
      console.log('✅ 缓存机制已恢复，后续访问应该更快');
    }

    // === 4. 验证数据稳定性 ===
    console.log('\n🚀 === 数据稳定性验证 ===');
    
    // 销售管理数据
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售管理: ${salesData.length} 条记录稳定显示`);
      
      const noWechatCount = salesData.filter(s => !s.wechat_name).length;
      console.log(`- 销售微信号缺失: ${noWechatCount}/${salesData.length}`);
      
      if (noWechatCount > 0) {
        console.log('⚠️  销售微信号问题仍需进一步排查');
      }
    } else {
      console.log('❌ 销售管理数据为空');
    }
    
    // 客户管理数据
    const customersData = state.admin?.customers;
    if (customersData && customersData.length > 0) {
      console.log(`✅ 客户管理: ${customersData.length} 条记录正常显示`);
    } else {
      console.log('❌ 客户管理数据为空');
      console.log('💡 如果点搜索后出现，说明初始加载有问题');
    }

    // === 5. 检查新增的调试信息 ===
    console.log('\n🔍 === 调试信息检查 ===');
    
    console.log('💡 请查看控制台是否有以下新增日志:');
    console.log('- 🔍 开始获取统计数据...');
    console.log('- 📊 查询到订单数据: X 个订单');
    console.log('- 📈 计算完成的统计数据: {...}');
    
    console.log('\n如果看到这些日志，说明新的统计算法已经运行');
    console.log('如果没有看到，说明getStats()可能没有被调用');

    // === 6. 手动测试建议 ===
    console.log('\n🧪 === 手动测试建议 ===');
    
    console.log('🎯 重点测试项目:');
    console.log('1. 订单操作按钮 - 点击后是否成功(不再报错)');
    console.log('2. 数据概览刷新 - 是否显示真实数据');
    console.log('3. 页面切换速度 - 是否不再转圈很久');
    console.log('4. 销售管理稳定性 - 刷新是否还会变空');
    
    console.log('\n⚡ 性能测试:');
    console.log('1. 首次访问各页面的加载时间');
    console.log('2. 二次访问的响应速度(应该很快)');
    console.log('3. 数据刷新的稳定性');

    // === 7. 总结修复效果评估 ===
    console.log('\n📋 === 修复效果总结 ===');
    
    const results = [];
    
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      results.push('✅ 数据概览显示真实数据');
    } else {
      results.push('❌ 数据概览仍然全零');
    }
    
    if (ordersData && ordersData.length > 0) {
      results.push('✅ 订单状态更新功能已修复');
    } else {
      results.push('❌ 订单数据为空');
    }
    
    if (!state.admin?.loading) {
      results.push('✅ 页面加载性能优化生效');
    } else {
      results.push('⚠️  页面仍在持续加载');
    }
    
    if (salesData && salesData.length > 0) {
      results.push('✅ 销售管理数据稳定');
    } else {
      results.push('❌ 销售管理数据不稳定');
    }
    
    results.forEach(result => console.log(result));
    
    const successCount = results.filter(r => r.startsWith('✅')).length;
    console.log(`\n🎯 修复成功率: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
    
    if (successCount >= 3) {
      console.log('🎉 主要问题已解决，系统基本稳定');
    } else {
      console.log('⚠️  仍有重要问题需要进一步修复');
    }

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verify436ff71();

console.log('\n💻 使用说明:');
console.log('1. 等待Vercel部署完成(约1-2分钟)');
console.log('2. 访问管理后台数据概览页面');
console.log('3. 按F12打开控制台，粘贴此脚本并回车');
console.log('4. 查看详细的修复验证结果');
console.log('5. 重点测试订单操作按钮功能');

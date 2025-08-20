// 直接使用客户端的服务配置
const path = require('path');
const clientPath = path.join(__dirname, 'client');

// 设置NODE_PATH以便找到client中的模块
process.env.NODE_PATH = clientPath + '/node_modules';
require('module')._initPaths();

const { supabase } = require('./client/src/services/supabase.js');

async function queryReminderOrders() {
  console.log('查询最近需要催单的订单状态...\n');
  
  try {
    // 先查询基本数据，不加复杂条件
    console.log('正在查询orders_optimized表的结构和数据...');
    
    // 先查询所有字段，了解表结构
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('查询错误:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('没有找到符合条件的催单订单');
      
      // 查询一下是否有其他状态的订单
      console.log('\n检查是否有其他状态的订单...');
      const { data: otherData, error: otherError } = await supabase
        .from('orders_optimized')
        .select('id, status, expiry_time')
        .not('expiry_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (otherData && otherData.length > 0) {
        console.log('最近的有到期时间的订单：');
        otherData.forEach(order => {
          console.log(`订单 ${order.id}: 状态=${order.status}, 到期时间=${order.expiry_time}`);
        });
      }
      return;
    }

    console.log('查询结果：');
    console.log('==========================================');
    console.log('订单ID | 状态 | 已催单 | 到期时间 | 金额 | 微信号 | 微信昵称');
    console.log('------------------------------------------');
    
    data.forEach(order => {
      const reminderStatus = order.is_reminded ? '是' : '否';
      const expiryDate = new Date(order.expiry_time).toLocaleDateString();
      console.log(`${order.id} | ${order.status} | ${reminderStatus} | ${expiryDate} | ¥${order.total_amount} | ${order.customer_wechat || 'N/A'} | ${order.wechat_name || 'N/A'}`);
    });
    
    console.log('------------------------------------------');
    console.log(`共找到 ${data.length} 条催单订单记录`);

    // 统计各状态数量
    const statusCount = {};
    const reminderCount = { reminded: 0, notReminded: 0 };
    
    data.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      if (order.is_reminded) {
        reminderCount.reminded++;
      } else {
        reminderCount.notReminded++;
      }
    });
    
    console.log('\n状态统计：');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} 个订单`);
    });
    
    console.log('\n催单状态统计：');
    console.log(`- 已催单: ${reminderCount.reminded} 个`);
    console.log(`- 未催单: ${reminderCount.notReminded} 个`);
    
    // 检查今天和明天到期的订单
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const urgentOrders = data.filter(order => {
      const orderDate = order.expiry_time.split('T')[0];
      return orderDate === todayStr || orderDate === tomorrowStr;
    });
    
    if (urgentOrders.length > 0) {
      console.log('\n紧急催单订单（今明两天到期）：');
      urgentOrders.forEach(order => {
        const isToday = order.expiry_time.split('T')[0] === todayStr;
        const urgency = isToday ? '今天到期' : '明天到期';
        console.log(`订单 ${order.id}: ${urgency}, 状态=${order.status}, 已催单=${order.is_reminded ? '是' : '否'}`);
      });
    }
    
  } catch (err) {
    console.error('执行查询时出错:', err);
  }
}

queryReminderOrders();
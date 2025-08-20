/**
 * 更新 API 以使用 customers_optimized 表
 * 这是新的 getCustomers 方法实现
 */

// 在 api.js 中的 AdminAPI 对象里，替换 getCustomers 方法：

const newGetCustomersMethod = `
  /**
   * 获取客户列表（使用优化表）
   */
  async getCustomers(params = {}) {
    try {
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 直接查询 customers_optimized 表
      let query = supabaseClient
        .from('customers_optimized')
        .select('*');
      
      // 应用筛选条件
      if (params.customer_wechat) {
        query = query.ilike('customer_wechat', \`%\${params.customer_wechat}%\`);
      }
      
      if (params.sales_wechat) {
        query = query.or(\`sales_wechat_name.ilike.%\${params.sales_wechat}%,primary_sales_name.ilike.%\${params.sales_wechat}%\`);
      }
      
      // 催单状态筛选
      if (params.is_reminded !== undefined && params.is_reminded !== '') {
        query = query.eq('is_reminded', params.is_reminded === 'true' || params.is_reminded === true);
      }
      
      // 催单建议筛选
      if (params.reminder_suggestion) {
        const today = new Date();
        
        if (params.reminder_suggestion === 'need_reminder') {
          // 需要催单：已生效且即将到期
          query = query
            .in('latest_order_status', ['confirmed_config', 'active'])
            .not('latest_expiry_time', 'is', null)
            .gte('latest_expiry_time', today.toISOString());
            
          // 根据金额判断催单时间（通过SQL计算）
          // 有金额订单7天内，无金额订单3天内
          // 这里简化处理，在前端过滤
        } else {
          // 无需催单
          query = query.or(\`latest_expiry_time.is.null,latest_order_status.not.in.(confirmed_config,active)\`);
        }
      }
      
      // 日期范围筛选
      if (params.start_date && params.end_date) {
        query = query
          .gte('latest_order_time', params.start_date)
          .lte('latest_order_time', params.end_date + ' 23:59:59');
      }
      
      // 排序：最新订单时间降序
      query = query.order('latest_order_time', { ascending: false, nullsFirst: false });
      
      // 执行查询
      const { data, error } = await query;
      
      if (error) {
        console.error('获取客户列表失败:', error);
        return [];
      }
      
      // 如果有催单建议筛选，需要在前端进一步过滤
      let customers = data || [];
      
      if (params.reminder_suggestion === 'need_reminder' && customers.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        customers = customers.filter(customer => {
          if (!customer.latest_expiry_time) return false;
          
          const expiryDate = new Date(customer.latest_expiry_time);
          expiryDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          const isActiveOrder = customer.latest_order_status === 'confirmed_config' || 
                               customer.latest_order_status === 'active';
          const hasAmount = customer.total_amount > 0;
          const reminderDays = hasAmount ? 7 : 3;
          
          return isActiveOrder && daysDiff >= 0 && daysDiff <= reminderDays;
        });
      }
      
      console.log(\`获取到 \${customers.length} 个客户\`);
      return customers;
      
    } catch (error) {
      console.error('获取客户列表失败:', error);
      return [];
    }
  }
`;

console.log('新的 getCustomers 方法实现：');
console.log(newGetCustomersMethod);

console.log('\n使用说明：');
console.log('1. 先执行 create-customers-optimized-table.sql 创建表');
console.log('2. 执行 create-customer-sync-trigger.sql 创建触发器');
console.log('3. 运行 node init-customers-data.js 初始化数据');
console.log('4. 将上面的方法替换到 api.js 中的 getCustomers');
console.log('5. 客户管理页面就会使用新的优化表了');
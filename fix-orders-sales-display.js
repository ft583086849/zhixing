#!/usr/bin/env node
/**
 * 🔧 修复订单管理页面销售信息显示问题
 * 
 * 问题：
 * 1. getOrdersWithFilters 查询的是旧的 primary_sales/secondary_sales 表
 * 2. 应该查询 sales_optimized 表
 * 3. 需要正确关联销售信息到订单
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复订单销售信息显示问题...');

const supabaseFilePath = './client/src/services/supabase.js';

try {
  // 读取文件内容
  let content = fs.readFileSync(supabaseFilePath, 'utf8');
  
  console.log('📄 正在修复 getOrdersWithFilters 函数...');
  
  // 找到并替换有问题的查询逻辑
  const oldQueryLogic = `    // 🔧 修复：先获取所有二级销售，以便获取他们的primary_sales_id
    // 并行获取销售数据
    const queries = [];
    
    if (salesCodes.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes),
        supabase.from('sales_optimized').select('id, sales_code, name, wechat_name, phone, primary_sales_id').in('sales_code', salesCodes)
      );
    }
    
    if (primarySalesIds.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('id', primarySalesIds)
      );
    }
    
    if (secondarySalesIds.length > 0) {
      queries.push(`;

  const newQueryLogic = `    // 🔧 修复：使用 sales_optimized 表获取销售信息
    // 并行获取销售数据
    const salesDataMap = new Map();
    
    if (salesCodes.length > 0) {
      // 从 sales_optimized 表获取销售信息
      const { data: salesData, error: salesError } = await supabase
        .from('sales_optimized')
        .select('id, sales_code, wechat_name, name, sales_type, commission_rate, parent_sales_code, parent_sales_id')
        .in('sales_code', salesCodes);
      
      if (salesError) {
        console.error('获取销售信息失败:', salesError);
      } else if (salesData) {
        // 建立销售代码到销售信息的映射
        salesData.forEach(sale => {
          salesDataMap.set(sale.sales_code, sale);
        });
      }
    }
    
    // 为每个订单添加销售信息
    const ordersWithSalesInfo = orders.map(order => {
      const salesInfo = salesDataMap.get(order.sales_code);
      
      if (!salesInfo) {
        return {
          ...order,
          sales_wechat_name: '-',
          sales_type: '-'
        };
      }
      
      // 根据销售类型设置字段
      let primary_sales = null;
      let secondary_sales = null;
      let sales_wechat_name = salesInfo.wechat_name || '-';
      
      if (salesInfo.sales_type === 'primary') {
        // 一级销售
        primary_sales = {
          id: salesInfo.id,
          wechat_name: salesInfo.wechat_name,
          sales_code: salesInfo.sales_code,
          sales_type: 'primary',
          commission_rate: salesInfo.commission_rate
        };
      } else {
        // 二级或独立销售
        secondary_sales = {
          id: salesInfo.id,
          wechat_name: salesInfo.wechat_name,
          sales_code: salesInfo.sales_code,
          sales_type: salesInfo.sales_type || 'secondary',
          primary_sales_id: salesInfo.parent_sales_id,
          commission_rate: salesInfo.commission_rate
        };
      }
      
      return {
        ...order,
        primary_sales,
        secondary_sales,
        sales_wechat_name,
        salesInfo
      };
    });
    
    return ordersWithSalesInfo;`;

  if (content.includes(oldQueryLogic)) {
    // 替换有问题的查询逻辑
    content = content.replace(oldQueryLogic, newQueryLogic);
    
    // 还需要移除后续的查询处理代码，因为我们已经在上面处理完了
    // 找到 return orders; 之前的所有旧逻辑并替换
    const returnPattern = /const queries = \[\];[\s\S]*?return orders;/;
    const newReturnCode = `return ordersWithSalesInfo;`;
    
    if (content.match(returnPattern)) {
      content = content.replace(returnPattern, newReturnCode);
    }
    
    console.log('✅ 已修复 getOrdersWithFilters 函数的销售信息查询逻辑');
  } else {
    console.log('⚠️ 未找到目标代码段，可能文件已经被修改');
  }
  
  // 写回文件
  fs.writeFileSync(supabaseFilePath, content, 'utf8');
  console.log('💾 已保存修复后的文件');
  
  console.log('✅ 修复完成！');
  console.log('📋 修复内容：');
  console.log('1. 使用 sales_optimized 表查询销售信息');
  console.log('2. 正确关联销售信息到订单');
  console.log('3. 添加 sales_wechat_name 字段');
  console.log('4. 设置 primary_sales 和 secondary_sales 对象');

} catch (error) {
  console.error('❌ 修复失败:', error.message);
}
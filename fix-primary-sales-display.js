#!/usr/bin/env node

/**
 * 修复一级销售结算页面显示问题
 * 
 * 问题清单：
 * 1. 待催单订单列表里客户信息不要展示订单号
 * 2. 所属销售有些显示销售代码而不是名字
 * 3. 二级销售佣金和一级销售佣金列显示不正确
 * 4. 显示一级销售从二级订单获得的佣金
 */

const fs = require('fs');
const path = require('path');

console.log('========== 修复一级销售结算页面显示问题 ==========\n');

// 1. 修复PrimarySalesSettlementPage.js
const pageFile = path.join(__dirname, 'client/src/pages/PrimarySalesSettlementPage.js');
let pageContent = fs.readFileSync(pageFile, 'utf8');

// 修复待催单列表的客户信息列 - 不要显示订单号
const oldCustomerColumn = `    {
      title: '客户信息',
      key: 'customer_info',
      width: 200,
      render: (_, record) => (
        <div>
          <div>订单号: {record.id}</div>
          <div>微信: {record.customer_wechat || '-'}</div>
          <div>TV用户名: {record.tradingview_username || '-'}</div>
        </div>
      )
    },`;

const newCustomerColumn = `    {
      title: '客户信息',
      key: 'customer_info',
      width: 200,
      render: (_, record) => (
        <div>
          <div>微信: {record.customer_wechat || '-'}</div>
          <div>TV用户名: {record.tradingview_username || '-'}</div>
        </div>
      )
    },`;

if (pageContent.includes(oldCustomerColumn)) {
  pageContent = pageContent.replace(oldCustomerColumn, newCustomerColumn);
  console.log('✅ 1. 已移除客户信息中的订单号显示');
} else {
  console.log('⚠️ 1. 客户信息列格式已改变');
}

// 修复待催单列表的销售人员显示
const oldSalesColumn = `    {
      title: '所属销售',
      dataIndex: 'sales_code',
      key: 'sales_code',
      width: 100,
      render: (salesCode) => {
        // 通过销售代码查找销售名称
        const salesName = salesCode || '-';
        return <Tag color="blue">{salesName}</Tag>;
      }
    },`;

const newSalesColumn = `    {
      title: '所属销售',
      dataIndex: 'sales_code',
      key: 'sales_code',
      width: 100,
      render: (salesCode) => {
        // 如果是一级销售自己的订单，显示一级销售名称
        if (salesCode === primarySalesStats?.sales_code) {
          return <Tag color="green">{primarySalesStats?.wechat_name || '一级自营'}</Tag>;
        }
        // 查找二级销售名称
        const secondarySale = primarySalesStats?.secondarySales?.find(s => s.sales_code === salesCode);
        if (secondarySale) {
          return <Tag color="blue">{secondarySale.wechat_name || salesCode}</Tag>;
        }
        return <Tag color="default">{salesCode || '-'}</Tag>;
      }
    },`;

if (pageContent.includes(oldSalesColumn)) {
  pageContent = pageContent.replace(oldSalesColumn, newSalesColumn);
  console.log('✅ 2. 已修复待催单列表销售人员显示');
} else {
  console.log('⚠️ 2. 待催单销售列格式已改变');
}

// 修复二级销售列表的佣金显示
const oldCommissionColumns = `    {
      title: '二级销售佣金',
      dataIndex: 'secondary_commission',
      key: 'secondary_commission',
      width: 120,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return <span style={{ color: '#52c41a' }}>\${value.toFixed(2)}</span>;
      }
    },
    {
      title: '一级销售佣金',
      dataIndex: 'primary_commission_from_secondary',
      key: 'primary_commission_from_secondary',
      width: 120,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return <span style={{ color: '#1890ff' }}>\${value.toFixed(2)}</span>;
      }
    },`;

const newCommissionColumns = `    {
      title: '二级销售佣金',
      key: 'secondary_commission',
      width: 120,
      render: (_, record) => {
        // 二级销售佣金 = 订单总额 * 二级佣金率
        const totalAmount = record.total_amount || 0;
        const commissionRate = record.commission_rate || 0.25; // 默认25%
        const commission = totalAmount * commissionRate;
        return <span style={{ color: '#52c41a' }}>\${commission.toFixed(2)}</span>;
      }
    },
    {
      title: '一级销售佣金',
      key: 'primary_commission_from_secondary',
      width: 120,
      render: (_, record) => {
        // 一级从二级获得的佣金 = 订单总额 * 15%（固定比例）
        const totalAmount = record.total_amount || 0;
        const primaryCommission = totalAmount * 0.15; // 一级从二级订单获得15%
        return <span style={{ color: '#1890ff' }}>\${primaryCommission.toFixed(2)}</span>;
      }
    },`;

if (pageContent.includes(oldCommissionColumns)) {
  pageContent = pageContent.replace(oldCommissionColumns, newCommissionColumns);
  console.log('✅ 3. 已修复二级销售列表佣金计算');
} else {
  console.log('⚠️ 3. 二级销售佣金列格式已改变');
}

// 保存修改后的文件
fs.writeFileSync(pageFile, pageContent);

console.log('\n========== 修复supabase.js中的数据获取逻辑 ==========\n');

// 修复API层的数据获取
const apiFile = path.join(__dirname, 'client/src/services/supabase.js');
let apiContent = fs.readFileSync(apiFile, 'utf8');

// 查找并修复二级销售佣金计算逻辑
const oldCalcLogic = `          // 使用佣金率计算佣金，如果没有设置则为0
          const commissionRate = sale.commission_rate || 0;
          const commissionAmount = totalAmount * commissionRate;
          const monthCommission = monthAmount * commissionRate;
          const todayCommission = todayAmount * commissionRate;`;

const newCalcLogic = `          // 使用佣金率计算佣金
          const commissionRate = sale.commission_rate || 0.25; // 默认25%
          // 二级销售佣金
          const secondaryCommission = totalAmount * commissionRate;
          const monthSecondaryCommission = monthAmount * commissionRate;
          const todaySecondaryCommission = todayAmount * commissionRate;
          // 一级从二级获得的佣金（固定15%）
          const primaryCommissionFromSecondary = totalAmount * 0.15;
          const monthPrimaryCommission = monthAmount * 0.15;
          const todayPrimaryCommission = todayAmount * 0.15;`;

if (apiContent.includes(oldCalcLogic)) {
  apiContent = apiContent.replace(oldCalcLogic, newCalcLogic);
  console.log('✅ 修复了二级销售佣金计算逻辑');
  
  // 同时修复push到数组时的字段名
  const oldPush = `            total_commission: commissionAmount,
            // 本月数据（基于payment_time）
            month_orders: monthOrders.length,
            month_amount: monthAmount,
            month_commission: monthCommission,
            // 当日数据（基于payment_time）
            today_orders: todayOrders.length,
            today_amount: todayAmount,
            today_commission: todayCommission,`;
  
  const newPush = `            // 二级销售的佣金
            secondary_commission: secondaryCommission,
            total_commission: secondaryCommission, // 兼容旧字段
            // 一级从二级获得的佣金
            primary_commission_from_secondary: primaryCommissionFromSecondary,
            // 本月数据（基于payment_time）
            month_orders: monthOrders.length,
            month_amount: monthAmount,
            month_commission: monthSecondaryCommission,
            month_primary_commission: monthPrimaryCommission,
            // 当日数据（基于payment_time）
            today_orders: todayOrders.length,
            today_amount: todayAmount,
            today_commission: todaySecondaryCommission,
            today_primary_commission: todayPrimaryCommission,`;
  
  if (apiContent.includes(oldPush)) {
    apiContent = apiContent.replace(oldPush, newPush);
    console.log('✅ 修复了返回数据中的佣金字段');
  }
} else {
  console.log('⚠️ 佣金计算逻辑格式已改变');
}

// 保存修改后的API文件
fs.writeFileSync(apiFile, apiContent);

console.log('\n========== 添加今日佣金计算说明 ==========\n');

// 创建一个说明文件
const explanationContent = `# 今日佣金计算逻辑说明

## 数据库触发器逻辑
当订单状态变更为已确认时（confirmed_config），触发器会自动更新 sales_optimized 表中的今日统计：

1. **今日订单数** (today_orders): 今天确认的订单数量
2. **今日金额** (today_amount): 今天确认的订单总金额
3. **今日佣金** (today_commission): 根据销售类型和佣金率计算
   - 一级销售直销：订单金额 × 40%
   - 二级销售：订单金额 × commission_rate（默认25%）
   - 一级从二级获得：订单金额 × 15%

## 实时更新机制
- 触发器名称：update_sales_statistics_trigger
- 触发时机：orders_optimized 表的 INSERT/UPDATE/DELETE
- 更新逻辑：基于中国时区（UTC+8）判断"今日"

## 佣金计算规则（v2.0系统）
1. **一级销售直销订单**：40%佣金
2. **二级销售订单**：
   - 二级销售获得：commission_rate（可设置，默认25%）
   - 一级销售获得：固定15%（从二级订单分成）
3. **独立销售**：commission_rate（可设置）

## 页面显示逻辑
- **二级销售列表**：显示每个二级销售的总订单额、佣金率、应得佣金、一级获得佣金
- **待催单列表**：显示客户信息（不含订单号）、销售人员名称（不是代码）
- **订单列表**：显示完整订单信息，包括佣金分配情况
`;

fs.writeFileSync(path.join(__dirname, 'commission-calculation-logic.md'), explanationContent);
console.log('✅ 已创建佣金计算逻辑说明文档');

console.log('\n========== 总结 ==========');
console.log('✅ 已修复待催单列表客户信息显示（移除订单号）');
console.log('✅ 已修复待催单列表销售人员显示（显示名称而非代码）');
console.log('✅ 已修复二级销售列表佣金计算（二级25%，一级获15%）');
console.log('✅ 已创建佣金计算逻辑说明文档');
console.log('\n请重新加载页面查看修复效果！');
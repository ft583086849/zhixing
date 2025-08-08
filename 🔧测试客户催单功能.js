/**
 * 测试客户管理页面的催单功能
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/customers
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔧 测试客户管理催单功能\n');
console.log('='.repeat(50));

// 1. 检查页面元素
function checkPageElements() {
  console.log('\n📋 1. 检查页面元素:');
  
  // 检查催单建议筛选框
  const reminderSelect = document.querySelector('[name="reminder_suggestion"]');
  if (reminderSelect) {
    console.log('✅ 催单建议筛选框: 存在');
  } else {
    console.log('❌ 催单建议筛选框: 未找到');
  }
  
  // 检查表格列
  const tableHeaders = document.querySelectorAll('.ant-table-thead th');
  const headerTexts = Array.from(tableHeaders).map(th => th.textContent);
  
  console.log('\n📊 表格列顺序:');
  headerTexts.forEach((text, index) => {
    console.log(`  ${index + 1}. ${text}`);
  });
  
  // 验证关键列存在
  const expectedColumns = ['客户微信号', '销售微信号', '催单建议', '催单状态'];
  const missingColumns = expectedColumns.filter(col => !headerTexts.includes(col));
  
  if (missingColumns.length === 0) {
    console.log('✅ 所有必要列都存在');
  } else {
    console.log('⚠️ 缺少列:', missingColumns.join(', '));
  }
}

// 2. 检查销售层级显示
function checkHierarchyDisplay() {
  console.log('\n👥 2. 检查销售层级显示:');
  
  // 查找所有销售类型标签
  const salesTags = document.querySelectorAll('.ant-tag');
  const tagTypes = {
    '一级': 0,
    '二级': 0,
    '独立': 0
  };
  
  salesTags.forEach(tag => {
    const text = tag.textContent;
    if (tagTypes.hasOwnProperty(text)) {
      tagTypes[text]++;
    }
  });
  
  console.log('销售类型分布:');
  Object.entries(tagTypes).forEach(([type, count]) => {
    console.log(`  ${type}销售: ${count} 个`);
  });
  
  // 检查是否显示上级销售信息
  const parentSalesInfo = document.querySelectorAll('span[style*="color: #999"]');
  if (parentSalesInfo.length > 0) {
    console.log(`✅ 找到 ${parentSalesInfo.length} 个上级销售信息显示`);
  } else {
    console.log('⚠️ 未找到上级销售信息显示（可能没有二级销售）');
  }
}

// 3. 测试催单建议逻辑
async function testReminderLogic() {
  console.log('\n⏰ 3. 测试催单建议逻辑:');
  
  try {
    // 获取API模块
    const { AdminAPI } = await import('./services/api.js');
    
    // 获取所有客户数据
    const customers = await AdminAPI.getCustomers();
    
    if (!customers || customers.length === 0) {
      console.log('⚠️ 没有客户数据');
      return;
    }
    
    console.log(`\n分析 ${customers.length} 个客户:`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let needReminderCount = 0;
    let noReminderCount = 0;
    const reminderDetails = [];
    
    customers.forEach(customer => {
      if (customer.expiry_time || customer.expiry_date) {
        const expiryDate = new Date(customer.expiry_time || customer.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        const needReminder = daysDiff <= 7 && daysDiff >= 0 && 
                            customer.status !== 'confirmed_config' && 
                            customer.status !== 'active' && 
                            customer.status !== 'expired';
        
        if (needReminder) {
          needReminderCount++;
          reminderDetails.push({
            customer: customer.customer_wechat || customer.tradingview_username,
            daysLeft: daysDiff,
            sales: customer.sales_wechat_name,
            salesType: customer.sales_type,
            primarySales: customer.primary_sales_name
          });
        } else {
          noReminderCount++;
        }
      } else {
        noReminderCount++;
      }
    });
    
    console.log(`  建议催单: ${needReminderCount} 个`);
    console.log(`  无需催单: ${noReminderCount} 个`);
    
    if (reminderDetails.length > 0) {
      console.log('\n📝 需要催单的客户详情:');
      reminderDetails.forEach((detail, index) => {
        console.log(`\n  ${index + 1}. 客户: ${detail.customer}`);
        console.log(`     剩余天数: ${detail.daysLeft} 天`);
        console.log(`     销售: ${detail.sales} (${detail.salesType || '未知'})`);
        if (detail.primarySales) {
          console.log(`     上级销售: ${detail.primarySales}`);
          console.log(`     💡 建议: 催上级销售 ${detail.primarySales}`);
        } else {
          console.log(`     💡 建议: 直接催 ${detail.sales}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 4. 测试筛选功能
function testFilterFunction() {
  console.log('\n🔍 4. 测试筛选功能:');
  
  console.log('\n建议操作步骤:');
  console.log('1. 在催单建议下拉框选择"建议催单"');
  console.log('2. 点击搜索按钮');
  console.log('3. 应该只显示需要催单的客户');
  console.log('4. 查看销售层级信息决定催谁');
  
  console.log('\n催单原则:');
  console.log('✓ 有上级销售的 → 催上级销售');
  console.log('✓ 独立销售 → 直接催独立销售');
  console.log('✓ 一级销售 → 直接催一级销售');
}

// 5. 生成催单报告
async function generateReminderReport() {
  console.log('\n📊 5. 生成催单报告:');
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    const customers = await AdminAPI.getCustomers({ reminder_suggestion: 'need_reminder' });
    
    if (!customers || customers.length === 0) {
      console.log('✅ 当前没有需要催单的客户');
      return;
    }
    
    // 按销售分组
    const salesGroups = {};
    customers.forEach(customer => {
      const targetSales = customer.primary_sales_name || customer.sales_wechat_name || '未知';
      if (!salesGroups[targetSales]) {
        salesGroups[targetSales] = [];
      }
      salesGroups[targetSales].push(customer);
    });
    
    console.log('\n📋 催单任务分配:');
    Object.entries(salesGroups).forEach(([sales, customers]) => {
      console.log(`\n销售: ${sales}`);
      console.log(`需要催单的客户数: ${customers.length}`);
      customers.forEach(c => {
        const expiryDate = new Date(c.expiry_time || c.expiry_date);
        const today = new Date();
        const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        console.log(`  - ${c.customer_wechat || c.tradingview_username} (剩余${daysLeft}天)`);
      });
    });
    
  } catch (error) {
    console.error('❌ 生成报告失败:', error);
  }
}

// 主测试流程
async function runAllTests() {
  console.log('\n🚀 开始测试客户管理催单功能...\n');
  
  // 1. 检查页面元素
  checkPageElements();
  
  // 2. 检查销售层级显示
  checkHierarchyDisplay();
  
  // 3. 测试催单建议逻辑
  await testReminderLogic();
  
  // 4. 测试筛选功能
  testFilterFunction();
  
  // 5. 生成催单报告
  await generateReminderReport();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 测试完成！\n');
  
  console.log('总结:');
  console.log('1. 催单功能已从订单管理移到客户管理');
  console.log('2. 可以看到销售层级关系');
  console.log('3. 便于决定催单对象（催上级还是直接催）');
}

// 导出函数
window.checkPageElements = checkPageElements;
window.checkHierarchyDisplay = checkHierarchyDisplay;
window.testReminderLogic = testReminderLogic;
window.testFilterFunction = testFilterFunction;
window.generateReminderReport = generateReminderReport;
window.runAllTests = runAllTests;

// 自动运行提示
console.log('可用命令:');
console.log('- runAllTests()           : 运行所有测试');
console.log('- generateReminderReport() : 生成催单报告');
console.log('- checkHierarchyDisplay()  : 检查层级显示');
console.log('\n运行 runAllTests() 开始测试');

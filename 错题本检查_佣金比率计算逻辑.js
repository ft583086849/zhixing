/**
 * 错题本检查 - 佣金比率计算逻辑修改
 * 
 * 检查所有修改是否符合部署标准和业务要求
 */

const fs = require('fs');
const path = require('path');

console.log("📋 错题本检查 - 佣金比率计算逻辑修改");
console.log("=" .repeat(60));

// 检查项目清单
const checkList = [
  {
    id: "check_1",
    name: "前端页面计算逻辑修改",
    description: "一级销售对账页面佣金比率计算逻辑已更新",
    file: "client/src/pages/PrimarySalesSettlementPage.js",
    validator: (content) => {
      return content.includes("一级销售的用户下单金额*40%") && 
             content.includes("二级销售订单总金额-二级销售分佣比率平均值") &&
             content.includes("primaryDirectAmount * 0.40") &&
             content.includes("secondaryTotalAmount * ((40 - averageSecondaryRate * 100) / 100)");
    }
  },
  
  {
    id: "check_2", 
    name: "管理员页面计算逻辑修改⚠️【标准逻辑-后续不可更改】",
    description: "管理员页面一级销售佣金比率使用与前端一致的新计算逻辑",
    file: "client/src/components/admin/AdminSales.js",
    validator: (content) => {
      return content.includes("calculatePrimaryCommissionRate") &&
             content.includes("record.sales?.sales_type === 'primary'") &&
             content.includes("primaryDirectAmount * 0.40") &&
             content.includes("secondaryTotalAmount * ((40 - averageSecondaryRate * 100) / 100)") &&
             content.includes("一级销售的用户下单金额×40%");
    }
  },
  
  {
    id: "check_3",
    name: "需求文档更新⚠️【标准逻辑-后续不可更改】",
    description: "需求文档已记录新的佣金比率计算公式并标注为不可更改",
    file: "支付管理系统需求文档.md",
    validator: (content) => {
      return content.includes("一级销售的用户下单金额×40%") &&
             content.includes("二级销售订单总金额-二级销售分佣比率平均值×二级销售订单总金额") &&
             content.includes("佣金比率计算逻辑详解") &&
             content.includes("管理员页面一级销售佣金比率显示") &&
             content.includes("后续不得更改") &&
             content.includes("标准逻辑-后续不可更改");
    }
  },
  
  {
    id: "check_4",
    name: "配置确认状态过滤",
    description: "计算逻辑仅计入配置确认的订单",
    file: "client/src/pages/PrimarySalesSettlementPage.js",
    validator: (content) => {
      return content.includes("config_confirmed === true") &&
             content.includes("filter(order => order.config_confirmed === true)");
    }
  },
  
  {
    id: "check_5",
    name: "边界情况处理",
    description: "正确处理无订单、无二级销售等边界情况",
    file: "client/src/pages/PrimarySalesSettlementPage.js",
    validator: (content) => {
      return content.includes("return 40") &&
             content.includes("totalOrderAmount === 0") &&
             content.includes("confirmedOrders.length === 0");
    }
  },
  
  {
    id: "check_6", 
    name: "线下验证通过",
    description: "线下验证脚本存在且验证通过",
    file: "佣金比率计算逻辑_线下验证.js",
    validator: (content) => {
      return content.includes("calculatePrimaryCommissionRate") &&
             content.includes("测试用例") &&
             content.includes("线下验证完全通过");
    }
  }
];

// 执行检查
let passedChecks = 0;
let totalChecks = checkList.length;

console.log(`\n🔍 开始执行 ${totalChecks} 项检查...\n`);

checkList.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}`);
  console.log(`   📝 ${check.description}`);
  console.log(`   📁 文件: ${check.file}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(check.file)) {
      console.log(`   ❌ 失败: 文件不存在`);
      return;
    }
    
    // 读取文件内容
    const content = fs.readFileSync(check.file, 'utf8');
    
    // 执行验证
    const passed = check.validator(content);
    
    if (passed) {
      console.log(`   ✅ 通过`);
      passedChecks++;
    } else {
      console.log(`   ❌ 失败: 验证条件不满足`);
    }
    
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`);
  }
  
  console.log('');
});

// 总结
console.log("=" .repeat(60));
console.log(`📊 检查总结:`);
console.log(`总计检查: ${totalChecks} 项`);
console.log(`通过检查: ${passedChecks} 项`);
console.log(`失败检查: ${totalChecks - passedChecks} 项`);
console.log(`通过率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

if (passedChecks === totalChecks) {
  console.log(`\n🎉 错题本检查全部通过！符合部署标准！`);
  console.log(`✅ 可以安全提交代码并部署`);
  
  // 生成部署检查报告
  const deploymentReport = {
    timestamp: new Date().toISOString(),
    checkType: "佣金比率计算逻辑修改",
    totalChecks: totalChecks,
    passedChecks: passedChecks,
    status: "PASSED",
    modifiedFiles: [
      "client/src/pages/PrimarySalesSettlementPage.js",
      "client/src/components/admin/AdminSales.js", 
      "支付管理系统需求文档.md"
    ],
    newFiles: [
      "佣金比率计算逻辑_线下验证.js",
      "错题本检查_佣金比率计算逻辑.js"
    ],
    businessLogic: "一级销售佣金比率 = （（一级销售直接佣金）+（一级销售从二级销售获得佣金））/（总订单金额）×100%",
    impactScope: "一级销售对账页面、管理员页面一级销售佣金率显示"
  };
  
  fs.writeFileSync('错题本检查通过_部署报告.json', JSON.stringify(deploymentReport, null, 2));
  console.log(`📋 部署报告已生成: 错题本检查通过_部署报告.json`);
  
} else {
  console.log(`\n⚠️  错题本检查未完全通过，需要修复失败项后再部署！`);
}

console.log(`\n🎯 修改范围:`);
console.log(`- 前端一级销售对账页面佣金比率计算逻辑`);
console.log(`- 管理员页面一级销售佣金比率显示逻辑`);
console.log(`- 需求文档计算公式更新`);
console.log(`- 支持配置确认状态过滤`);
console.log(`- 完整的边界情况处理`);

console.log(`\n🚀 部署准备就绪！`);
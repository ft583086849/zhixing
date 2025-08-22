#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPaginationFunction() {
  console.log('🧪 开始测试一级销售结算页面翻页功能...');
  
  let browser = null;
  let page = null;
  
  try {
    // 启动浏览器
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1400, height: 900 }
    });
    
    page = await browser.newPage();
    
    // 访问页面
    console.log('📱 访问一级销售结算页面...');
    await page.goto('http://localhost:3000/primary-sales-settlement', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 等待页面加载
    await page.waitForSelector('input[placeholder="请输入微信号"]', { timeout: 10000 });
    console.log('✅ 页面加载完成');
    
    // 测试用的销售微信号（选择订单数较多的）
    const testWechatName = 'WML792355703'; // 46个订单
    
    // 输入微信号
    console.log(`🔍 输入测试微信号: ${testWechatName}`);
    await page.click('input[placeholder="请输入微信号"]');
    await page.type('input[placeholder="请输入微信号"]', testWechatName);
    
    // 点击查询按钮
    await page.click('button[type="submit"]');
    console.log('🔍 点击查询按钮...');
    
    // 等待查询结果加载
    await page.waitForTimeout(3000);
    
    // 检查是否有错误提示
    const errorMessage = await page.$('.ant-message-error');
    if (errorMessage) {
      const errorText = await page.evaluate(el => el.textContent, errorMessage);
      console.log(`❌ 查询出现错误: ${errorText}`);
      return;
    }
    
    // 等待订单列表加载
    await page.waitForSelector('.ant-table-tbody', { timeout: 10000 });
    console.log('✅ 订单列表加载完成');
    
    // 查找"我的订单列表"卡片
    const orderListCard = await page.waitForSelector('div.ant-card:has(.ant-card-head-title:contains("我的订单列表"))', { timeout: 5000 }).catch(() => null);
    
    if (!orderListCard) {
      console.log('❌ 未找到"我的订单列表"卡片');
      return;
    }
    
    // 检查订单数据
    const orderRows = await page.$$eval('.ant-card:has(.ant-card-head-title) .ant-table-tbody tr', rows => 
      rows.map(row => ({
        cells: Array.from(row.cells).map(cell => cell.textContent.trim())
      }))
    );
    
    console.log(`📊 找到 ${orderRows.length} 行订单数据`);
    
    // 检查分页组件
    const paginationExists = await page.$('.ant-pagination') !== null;
    console.log(`📄 分页组件存在: ${paginationExists ? '✅ 是' : '❌ 否'}`);
    
    if (paginationExists) {
      // 获取分页信息
      const paginationInfo = await page.$eval('.ant-pagination-total-text', el => el.textContent).catch(() => '未找到');
      console.log(`📊 分页信息: ${paginationInfo}`);
      
      // 检查是否有下一页按钮
      const nextPageButton = await page.$('.ant-pagination-next:not(.ant-pagination-disabled)');
      const hasNextPage = nextPageButton !== null;
      console.log(`➡️ 是否有下一页: ${hasNextPage ? '✅ 是' : '❌ 否'}`);
      
      if (hasNextPage) {
        console.log('🧪 测试翻页功能...');
        
        // 记录当前页面的第一行数据
        const currentFirstRow = await page.$eval('.ant-table-tbody tr:first-child', row => row.textContent).catch(() => '');
        
        // 点击下一页
        await nextPageButton.click();
        console.log('👆 点击下一页按钮');
        
        // 等待页面更新
        await page.waitForTimeout(2000);
        
        // 检查数据是否改变
        const newFirstRow = await page.$eval('.ant-table-tbody tr:first-child', row => row.textContent).catch(() => '');
        
        const dataChanged = currentFirstRow !== newFirstRow;
        console.log(`🔄 翻页后数据是否改变: ${dataChanged ? '✅ 是' : '❌ 否'}`);
        
        if (dataChanged) {
          console.log('🎉 翻页功能正常工作！');
        } else {
          console.log('⚠️ 翻页功能可能有问题 - 数据未改变');
        }
        
        // 测试页面跳转
        const pageJumper = await page.$('.ant-pagination-options-quick-jumper input');
        if (pageJumper) {
          console.log('🧪 测试快速跳转功能...');
          await pageJumper.click();
          await pageJumper.clear();
          await pageJumper.type('1');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
          console.log('✅ 快速跳转测试完成');
        }
        
        // 测试每页显示数量调整
        const pageSizeSelector = await page.$('.ant-select-selector:has(.ant-select-selection-item:contains("10"))');
        if (pageSizeSelector) {
          console.log('🧪 测试每页显示数量调整...');
          await pageSizeSelector.click();
          await page.waitForTimeout(500);
          
          const option20 = await page.$('.ant-select-item[title="20"]');
          if (option20) {
            await option20.click();
            await page.waitForTimeout(2000);
            console.log('✅ 每页显示数量调整测试完成');
          }
        }
      } else {
        console.log('ℹ️ 当前数据量不足以触发翻页（可能少于10条记录）');
      }
    } else {
      console.log('❌ 未找到分页组件');
    }
    
    // 生成测试报告
    console.log('\n📋 测试报告:');
    console.log('=====================================');
    console.log(`✅ 页面访问: 正常`);
    console.log(`✅ 数据查询: 正常`);
    console.log(`✅ 订单列表显示: 正常 (${orderRows.length} 条记录)`);
    console.log(`${paginationExists ? '✅' : '❌'} 分页组件: ${paginationExists ? '存在' : '缺失'}`);
    
    if (paginationExists) {
      const paginationInfo = await page.$eval('.ant-pagination-total-text', el => el.textContent).catch(() => '未找到总数信息');
      console.log(`📊 总记录数显示: ${paginationInfo}`);
      
      const nextPageButton = await page.$('.ant-pagination-next:not(.ant-pagination-disabled)');
      console.log(`${nextPageButton ? '✅' : '❌'} 翻页功能: ${nextPageButton ? '可用' : '不可用/数据不足'}`);
    }
    
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 检查是否有Puppeteer
async function checkPuppeteer() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('❌ 未安装Puppeteer，无法进行自动化测试');
    console.log('💡 手动测试说明:');
    console.log('1. 打开浏览器访问: http://localhost:3000/primary-sales-settlement');
    console.log('2. 输入微信号: WML792355703 (有46个订单)');
    console.log('3. 点击查询按钮');
    console.log('4. 查看"我的订单列表"部分的翻页功能');
    return false;
  }
}

// 主函数
async function main() {
  const hasPuppeteer = await checkPuppeteer();
  if (hasPuppeteer) {
    await testPaginationFunction();
  }
}

main().catch(console.error);
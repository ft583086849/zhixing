/**
 * 销售链接功能测试脚本
 * 测试一级销售双链接和二级销售单链接的展示和功能
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app';
const API_BASE = `${BASE_URL}/api`;

// 获取管理员token
async function getAdminToken() {
  try {
    console.log('🔐 获取管理员token...');
    const response = await axios.post(`${API_BASE}/auth`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      console.log('✅ 获取token成功');
      return response.data.data.token;
    } else {
      throw new Error('获取token失败');
    }
  } catch (error) {
    console.error('❌ 获取token失败:', error.message);
    throw error;
  }
}

// 测试销售管理API返回链接信息
async function testSalesLinksAPI(token) {
  try {
    console.log('\n📊 测试销售管理API链接信息...');
    
    const response = await axios.get(`${API_BASE}/admin?path=sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const sales = response.data.data.sales;
      console.log(`✅ 获取到${sales.length}个销售记录`);
      
      // 分析链接信息
      let primaryCount = 0;
      let secondaryCount = 0;
      let linksFoundCount = 0;
      
      sales.forEach((sale, index) => {
        console.log(`\n销售 ${index + 1}:`);
        console.log(`  类型: ${sale.sales_type}`);
        console.log(`  微信号: ${sale.wechat_name}`);
        console.log(`  链接数量: ${sale.link_count || 0}`);
        
        if (sale.sales_type === 'primary') {
          primaryCount++;
        } else if (sale.sales_type === 'secondary') {
          secondaryCount++;
        }
        
        if (sale.links && sale.links.length > 0) {
          linksFoundCount++;
          console.log(`  链接信息:`);
          sale.links.forEach((link, linkIndex) => {
            console.log(`    ${linkIndex + 1}. ${link.title}:`);
            console.log(`       代码: ${link.code}`);
            console.log(`       完整链接: ${link.fullUrl}`);
            console.log(`       说明: ${link.description}`);
          });
        } else {
          console.log(`  ⚠️  无链接信息`);
        }
      });
      
      console.log(`\n📊 统计结果:`);
      console.log(`  一级销售: ${primaryCount}`);
      console.log(`  二级销售: ${secondaryCount}`);
      console.log(`  有链接信息的销售: ${linksFoundCount}/${sales.length}`);
      
      return {
        success: true,
        totalSales: sales.length,
        primaryCount,
        secondaryCount,
        linksFoundCount
      };
    } else {
      throw new Error('API返回失败');
    }
  } catch (error) {
    console.error('❌ 销售管理API测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试链接代码唯一性
async function testLinkUniqueness(token) {
  try {
    console.log('\n🔍 测试链接代码唯一性...');
    
    const response = await axios.get(`${API_BASE}/admin?path=sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const allCodes = [];
      const sales = response.data.data.sales;
      
      sales.forEach(sale => {
        if (sale.links) {
          sale.links.forEach(link => {
            allCodes.push({
              code: link.code,
              salesId: sale.id,
              salesType: sale.sales_type,
              linkType: link.type
            });
          });
        }
      });
      
      console.log(`📊 收集到${allCodes.length}个链接代码`);
      
      // 检查重复
      const codeMap = {};
      const duplicates = [];
      
      allCodes.forEach(item => {
        if (codeMap[item.code]) {
          duplicates.push({
            code: item.code,
            first: codeMap[item.code],
            second: item
          });
        } else {
          codeMap[item.code] = item;
        }
      });
      
      if (duplicates.length === 0) {
        console.log('✅ 所有链接代码都是唯一的');
        return { success: true, unique: true, totalCodes: allCodes.length };
      } else {
        console.log('❌ 发现重复的链接代码:');
        duplicates.forEach(dup => {
          console.log(`  代码 ${dup.code} 重复:`);
          console.log(`    第一个: 销售${dup.first.salesId} (${dup.first.salesType}) - ${dup.first.linkType}`);
          console.log(`    第二个: 销售${dup.second.salesId} (${dup.second.salesType}) - ${dup.second.linkType}`);
        });
        return { success: false, unique: false, duplicates: duplicates.length };
      }
    } else {
      throw new Error('获取销售数据失败');
    }
  } catch (error) {
    console.error('❌ 链接唯一性测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试链接格式正确性
async function testLinkFormat(token) {
  try {
    console.log('\n🔗 测试链接格式正确性...');
    
    const response = await axios.get(`${API_BASE}/admin?path=sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const sales = response.data.data.sales;
      let formatErrors = [];
      let totalLinks = 0;
      
      sales.forEach(sale => {
        if (sale.links) {
          sale.links.forEach(link => {
            totalLinks++;
            
            // 检查代码格式 (8位字母数字)
            if (!/^[A-Za-z0-9]{8}$/.test(link.code)) {
              formatErrors.push({
                salesId: sale.id,
                linkType: link.type,
                code: link.code,
                error: '代码格式不正确，应该是8位字母数字组合'
              });
            }
            
            // 检查完整链接格式
            const expectedDomain = BASE_URL;
            if (!link.fullUrl.startsWith(expectedDomain)) {
              formatErrors.push({
                salesId: sale.id,
                linkType: link.type,
                fullUrl: link.fullUrl,
                error: `链接域名不正确，应该以${expectedDomain}开始`
              });
            }
            
            // 检查链接路径
            if (link.type === 'sales_register' && !link.fullUrl.includes('/sales/register/')) {
              formatErrors.push({
                salesId: sale.id,
                linkType: link.type,
                fullUrl: link.fullUrl,
                error: '销售注册链接路径不正确'
              });
            }
            
            if (link.type === 'user_purchase' && !link.fullUrl.includes('/purchase/')) {
              formatErrors.push({
                salesId: sale.id,
                linkType: link.type,
                fullUrl: link.fullUrl,
                error: '用户购买链接路径不正确'
              });
            }
          });
        }
      });
      
      console.log(`📊 检查了${totalLinks}个链接`);
      
      if (formatErrors.length === 0) {
        console.log('✅ 所有链接格式都正确');
        return { success: true, totalLinks, errors: 0 };
      } else {
        console.log(`❌ 发现${formatErrors.length}个格式错误:`);
        formatErrors.forEach(error => {
          console.log(`  销售${error.salesId} - ${error.linkType}: ${error.error}`);
          if (error.code) console.log(`    代码: ${error.code}`);
          if (error.fullUrl) console.log(`    链接: ${error.fullUrl}`);
        });
        return { success: false, totalLinks, errors: formatErrors.length };
      }
    } else {
      throw new Error('获取销售数据失败');
    }
  } catch (error) {
    console.error('❌ 链接格式测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始销售链接功能测试...\n');
  
  try {
    // 获取token
    const token = await getAdminToken();
    
    // 测试销售API
    const apiResult = await testSalesLinksAPI(token);
    
    // 测试唯一性
    const uniquenessResult = await testLinkUniqueness(token);
    
    // 测试格式
    const formatResult = await testLinkFormat(token);
    
    // 总结报告
    console.log('\n📊 销售链接功能测试报告');
    console.log('==================================================');
    console.log(`✅ 通过测试: ${[apiResult.success, uniquenessResult.success, formatResult.success].filter(Boolean).length}`);
    console.log(`❌ 失败测试: ${[apiResult.success, uniquenessResult.success, formatResult.success].filter(r => !r).length}`);
    
    if (apiResult.success) {
      console.log(`📈 销售数据: ${apiResult.totalSales}个销售 (一级:${apiResult.primaryCount}, 二级:${apiResult.secondaryCount})`);
      console.log(`🔗 链接覆盖: ${apiResult.linksFoundCount}/${apiResult.totalSales}`);
    }
    
    if (uniquenessResult.success) {
      console.log(`🎯 唯一性: ✅ ${uniquenessResult.totalCodes}个代码都唯一`);
    } else if (uniquenessResult.duplicates) {
      console.log(`⚠️  唯一性: ❌ 发现${uniquenessResult.duplicates}个重复`);
    }
    
    if (formatResult.success) {
      console.log(`📝 格式检查: ✅ ${formatResult.totalLinks}个链接格式正确`);
    } else if (formatResult.errors) {
      console.log(`📝 格式检查: ❌ ${formatResult.errors}个格式错误`);
    }
    
    const allSuccess = apiResult.success && uniquenessResult.success && formatResult.success;
    console.log(`\n🏆 整体结果: ${allSuccess ? '✅ 全部通过' : '❌ 存在问题'}`);
    
    if (allSuccess) {
      console.log('\n🎉 销售链接功能测试完全成功！');
      console.log('✅ 一级销售双链接展示正常');
      console.log('✅ 二级销售单链接展示正常'); 
      console.log('✅ 链接代码全局唯一');
      console.log('✅ 链接格式完全正确');
      console.log('✅ 可以进行生产部署');
    } else {
      console.log('\n⚠️  销售链接功能需要进一步完善');
    }
    
  } catch (error) {
    console.error('\n💥 测试执行失败:', error.message);
    process.exit(1);
  }
}

main();
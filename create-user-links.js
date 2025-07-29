const axios = require('axios');

async function createUserLinks() {
  console.log('🔗 创建用户页面可用的模拟链接...\n');

  try {
    // 1. 获取现有的销售链接
    console.log('1️⃣ 获取现有销售链接...');
    const salesResponse = await axios.get('http://localhost:5000/api/admin/links', {
      headers: { 'Authorization': 'Bearer test-token' }
    });

    const salesLinks = salesResponse.data.data || [];
    console.log(`✅ 获取到 ${salesLinks.length} 个销售链接`);

    // 2. 生成用户可用的链接
    console.log('\n2️⃣ 生成用户可用链接...');
    const userLinks = salesLinks.map(link => {
      const fullUrl = `http://localhost:3000/#/purchase/${link.link_code}`;
      return {
        link_code: link.link_code,
        sales_wechat: link.sales?.wechat_name || '未知',
        full_url: fullUrl,
        status: '可用'
      };
    });

    // 3. 显示链接信息
    console.log('\n📋 用户可用链接列表:');
    console.log('='.repeat(80));
    
    userLinks.forEach((link, index) => {
      console.log(`${index + 1}. 链接代码: ${link.link_code}`);
      console.log(`   销售微信: ${link.sales_wechat}`);
      console.log(`   完整链接: ${link.full_url}`);
      console.log(`   状态: ${link.status}`);
      console.log('-'.repeat(60));
    });

    // 4. 提供快速访问链接
    console.log('\n🚀 快速访问链接:');
    if (userLinks.length > 0) {
      console.log(`第一个链接: ${userLinks[0].full_url}`);
      console.log(`第二个链接: ${userLinks[1]?.full_url || '无'}`);
      console.log(`第三个链接: ${userLinks[2]?.full_url || '无'}`);
    }

    // 5. 测试链接有效性
    console.log('\n3️⃣ 测试链接有效性...');
    if (userLinks.length > 0) {
      try {
        const testResponse = await axios.get(`http://localhost:5000/api/sales/link/${userLinks[0].link_code}`);
        console.log('✅ 链接测试成功');
        console.log('   销售信息:', testResponse.data.data?.sales?.wechat_name);
        console.log('   收款方式:', testResponse.data.data?.sales?.payment_method);
      } catch (error) {
        console.log('⚠️  链接测试失败:', error.message);
      }
    }

    console.log('\n📝 使用说明:');
    console.log('1. 复制上面的完整链接到浏览器地址栏');
    console.log('2. 或者直接访问: http://localhost:3000/#/purchase/[链接代码]');
    console.log('3. 在用户页面选择购买时长和付款方式');
    console.log('4. 上传付款截图完成购买');

    console.log('\n🎉 链接生成完成！');

  } catch (error) {
    console.error('❌ 创建链接失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行脚本
createUserLinks(); 
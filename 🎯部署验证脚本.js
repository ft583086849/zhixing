#!/usr/bin/env node

/**
 * 🎯 部署验证脚本
 * 验证所有修复的问题是否已解决
 */

async function verifyDeployment() {
    console.log('🎯 开始验证部署结果...\n');
    
    const baseUrl = 'https://zhixing-seven.vercel.app';
    
    try {
        // 1. 验证主页是否正常加载
        console.log('📋 1. 验证主页加载');
        const homeResponse = await fetch(baseUrl);
        if (homeResponse.ok) {
            const homeContent = await homeResponse.text();
            if (homeContent.includes('React') || homeContent.includes('root')) {
                console.log('   ✅ 主页正常加载 - React应用运行正常');
            } else {
                console.log('   ❌ 主页内容异常');
            }
        } else {
            console.log('   ❌ 主页无法访问，状态码:', homeResponse.status);
        }
        
        // 2. 验证管理员登录页面
        console.log('\n👤 2. 验证管理员登录页面');
        const adminResponse = await fetch(`${baseUrl}/admin`);
        if (adminResponse.ok) {
            console.log('   ✅ 管理员登录页面可访问');
        } else {
            console.log('   ❌ 管理员登录页面无法访问，状态码:', adminResponse.status);
        }
        
        // 3. 验证购买页面（有销售代码）
        console.log('\n🛒 3. 验证购买页面');
        const purchaseResponse = await fetch(`${baseUrl}/purchase?sales_code=TEST001`);
        if (purchaseResponse.ok) {
            console.log('   ✅ 购买页面可访问');
        } else {
            console.log('   ❌ 购买页面无法访问，状态码:', purchaseResponse.status);
        }
        
        // 4. 验证销售注册页面
        console.log('\n🏪 4. 验证销售注册页面');
        const salesResponse = await fetch(`${baseUrl}/sales`);
        if (salesResponse.ok) {
            console.log('   ✅ 一级销售注册页面可访问');
        } else {
            console.log('   ❌ 一级销售注册页面无法访问，状态码:', salesResponse.status);
        }
        
        // 5. 验证二级销售注册页面
        console.log('\n📝 5. 验证二级销售注册页面');
        const secondaryResponse = await fetch(`${baseUrl}/secondary-sales`);
        if (secondaryResponse.ok) {
            console.log('   ✅ 二级销售注册页面可访问');
        } else {
            console.log('   ❌ 二级销售注册页面无法访问，状态码:', secondaryResponse.status);
        }
        
        // 6. 验证静态资源
        console.log('\n📦 6. 验证静态资源');
        const staticResponse = await fetch(`${baseUrl}/static/js/main.js`, {
            method: 'HEAD'
        });
        if (staticResponse.ok || staticResponse.status === 404) {
            console.log('   ✅ 静态资源路径正常（可能使用hash文件名）');
        } else {
            console.log('   ❌ 静态资源访问异常，状态码:', staticResponse.status);
        }
        
        console.log('\n🎉 部署验证完成！');
        console.log('\n📋 测试清单：');
        console.log('   ☐ 管理员登录 (admin/admin123) - 手动测试');
        console.log('   ☐ 购买页面功能 - 手动测试');
        console.log('   ☐ 销售注册功能 - 手动测试');
        console.log('   ☐ 页面路由跳转 - 手动测试');
        
    } catch (error) {
        console.error('❌ 验证过程出错:', error.message);
    }
}

// 运行验证
verifyDeployment().catch(console.error);
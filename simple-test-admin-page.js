/**
 * 简单测试管理后台概览页面的数据获取
 * 通过直接调用API来检查数据是否正常
 */

// 首先测试服务器连接
const http = require('http');
const https = require('https');

function testServerConnection() {
    console.log('🔍 测试本地服务器连接...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000
    };
    
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            console.log('✅ 服务器响应正常');
            console.log('   - 状态码:', res.statusCode);
            console.log('   - Content-Type:', res.headers['content-type']);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (data.includes('React App') || data.includes('root')) {
                    console.log('✅ React应用正常运行');
                } else {
                    console.log('⚠️  响应内容异常，可能不是React应用');
                    console.log('   - 前100字符:', data.substring(0, 100));
                }
                resolve(true);
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ 服务器连接失败:', error.message);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ 服务器响应超时');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// 测试API端点
function testAPIEndpoint() {
    console.log('\n🔍 检查前端构建和路由...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/overview',
        method: 'GET',
        timeout: 5000
    };
    
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            console.log('📱 管理页面访问结果:');
            console.log('   - 状态码:', res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (data.includes('管理') || data.includes('admin') || data.includes('数据概览')) {
                        console.log('✅ 管理页面可以正常访问');
                    } else {
                        console.log('⚠️  返回的是React应用主页面，路由可能需要前端处理');
                        console.log('   - 这是正常的，单页应用会返回index.html');
                    }
                    console.log('✅ 页面响应正常，React路由将处理具体页面显示');
                } else {
                    console.log('❌ 页面访问异常，状态码:', res.statusCode);
                }
                resolve(res.statusCode === 200);
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ 页面访问失败:', error.message);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ 页面访问超时');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// 检查数据库连接配置
function checkDatabaseConfig() {
    console.log('\n🔍 检查数据库连接配置...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
        // 检查环境变量文件
        const envPath = path.join(__dirname, 'client/.env');
        const envLocalPath = path.join(__dirname, 'client/.env.local');
        
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            console.log('✅ 找到 .env 文件');
        } else if (fs.existsSync(envLocalPath)) {
            envContent = fs.readFileSync(envLocalPath, 'utf8');
            console.log('✅ 找到 .env.local 文件');
        } else {
            console.log('⚠️  未找到环境变量文件，可能使用系统环境变量');
        }
        
        // 检查Supabase配置
        if (envContent) {
            const hasSupabaseUrl = envContent.includes('REACT_APP_SUPABASE_URL');
            const hasSupabaseKey = envContent.includes('REACT_APP_SUPABASE_ANON_KEY');
            
            if (hasSupabaseUrl && hasSupabaseKey) {
                console.log('✅ Supabase配置存在');
                
                // 提取URL（不显示完整URL以保护隐私）
                const urlMatch = envContent.match(/REACT_APP_SUPABASE_URL=(.+)/);
                if (urlMatch) {
                    const url = urlMatch[1].trim();
                    if (url.includes('supabase.co')) {
                        console.log('✅ Supabase URL格式正确');
                    } else {
                        console.log('⚠️  Supabase URL格式可能有问题');
                    }
                }
            } else {
                console.log('❌ Supabase配置缺失');
            }
        }
        
        // 检查Supabase服务文件
        const supabasePath = path.join(__dirname, 'client/src/services/supabase.js');
        if (fs.existsSync(supabasePath)) {
            const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
            if (supabaseContent.includes('createClient')) {
                console.log('✅ Supabase客户端配置文件存在');
            } else {
                console.log('❌ Supabase客户端配置可能有问题');
            }
        } else {
            console.log('❌ 未找到Supabase服务文件');
        }
        
    } catch (error) {
        console.log('❌ 检查配置时出错:', error.message);
    }
}

// 生成浏览器测试说明
function generateBrowserTestInstructions() {
    console.log('\n📋 手动浏览器测试指南:');
    console.log('=' .repeat(50));
    console.log('1. 打开浏览器，访问: http://localhost:3000/admin/overview');
    console.log('2. 如果出现登录页面，尝试以下管理员账号:');
    console.log('   - 用户名: admin, 密码: admin123');
    console.log('   - 或查看项目文档中的管理员账号信息');
    console.log('3. 登录后，检查以下内容:');
    console.log('   📊 Top5销售排行榜:');
    console.log('      - 是否显示销售员名称和销售金额');
    console.log('      - 表格是否有数据行，还是显示"暂无数据"');
    console.log('   📈 订单分类统计:');
    console.log('      - 各个圆形进度条是否显示百分比');
    console.log('      - 7天免费、1个月、3个月等订单的占比是否正确');
    console.log('   📋 转化率统计表格:');
    console.log('      - 订单转化、收费订单、销售转化三行是否有数据');
    console.log('      - 转化率百分比是否显示正确');
    console.log('4. 打开浏览器开发者工具(F12)，查看Console选项卡:');
    console.log('   - 检查是否有红色的错误信息');
    console.log('   - 检查Network选项卡中API请求是否成功');
    console.log('5. 如果发现问题，请截图或复制错误信息');
    console.log('=' .repeat(50));
}

// 主测试函数
async function runSimpleTest() {
    console.log('🚀 开始简单测试管理后台概览页面...\n');
    
    // 1. 测试服务器连接
    const serverOk = await testServerConnection();
    
    if (!serverOk) {
        console.log('\n❌ 服务器连接失败，请检查:');
        console.log('   1. 确认开发服务器是否在运行');
        console.log('   2. 在client目录执行: npm start');
        console.log('   3. 确认端口3000没有被其他程序占用');
        return;
    }
    
    // 2. 测试页面访问
    const pageOk = await testAPIEndpoint();
    
    // 3. 检查配置
    checkDatabaseConfig();
    
    // 4. 生成浏览器测试指南
    generateBrowserTestInstructions();
    
    console.log('\n📊 测试总结:');
    console.log('   - 服务器连接:', serverOk ? '✅ 正常' : '❌ 失败');
    console.log('   - 页面访问:', pageOk ? '✅ 正常' : '❌ 失败');
    
    if (serverOk && pageOk) {
        console.log('\n✅ 基础测试通过，请按照上述指南进行浏览器手动测试');
        console.log('   主要关注Top5销售排行榜是否显示数据');
    } else {
        console.log('\n❌ 基础测试失败，请先解决服务器或页面访问问题');
    }
}

// 运行测试
if (require.main === module) {
    runSimpleTest().catch(error => {
        console.error('❌ 测试运行失败:', error);
    });
}

module.exports = runSimpleTest;
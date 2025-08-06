#!/usr/bin/env node

/**
 * 🚀 修复React应用挂载问题
 * 确保前端正确构建和部署
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🚀 开始修复React应用挂载问题'));

// 检查和修复步骤
async function fixReactApp() {
    const fixes = [];
    
    try {
        // 1. 检查package.json配置
        console.log(chalk.yellow('\n📦 1. 检查package.json配置'));
        await checkPackageJson(fixes);
        
        // 2. 检查public/index.html
        console.log(chalk.yellow('\n🏠 2. 检查public/index.html'));
        await checkIndexHtml(fixes);
        
        // 3. 检查src/index.js
        console.log(chalk.yellow('\n⚙️  3. 检查src/index.js'));
        await checkIndexJs(fixes);
        
        // 4. 创建环境变量文件
        console.log(chalk.yellow('\n🔧 4. 创建环境变量文件'));
        await createEnvFile(fixes);
        
        // 5. 验证构建配置
        console.log(chalk.yellow('\n🏗️  5. 验证构建配置'));
        await verifyBuildConfig(fixes);
        
        // 输出修复结果
        outputResults(fixes);
        
    } catch (error) {
        console.error(chalk.red('❌ 修复过程出错:'), error.message);
    }
}

// 1. 检查package.json配置
async function checkPackageJson(fixes) {
    const packagePath = path.join(__dirname, 'client', 'package.json');
    
    try {
        if (fs.existsSync(packagePath)) {
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);
            
            // 检查必要的依赖
            const requiredDeps = ['react', 'react-dom', 'react-scripts'];
            const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies || !packageJson.dependencies[dep]);
            
            if (missingDeps.length === 0) {
                fixes.push({
                    task: 'package.json检查',
                    status: 'PASS',
                    details: '所有必要依赖都存在'
                });
            } else {
                fixes.push({
                    task: 'package.json检查',
                    status: 'FAIL',
                    details: `缺少依赖: ${missingDeps.join(', ')}`
                });
            }
            
            // 检查scripts
            if (packageJson.scripts && packageJson.scripts.build) {
                fixes.push({
                    task: 'build脚本检查',
                    status: 'PASS',
                    details: 'build脚本存在'
                });
            } else {
                fixes.push({
                    task: 'build脚本检查',
                    status: 'FAIL',
                    details: '缺少build脚本'
                });
            }
            
        } else {
            fixes.push({
                task: 'package.json检查',
                status: 'FAIL',
                details: 'client/package.json文件不存在'
            });
        }
    } catch (error) {
        fixes.push({
            task: 'package.json检查',
            status: 'FAIL',
            details: `解析错误: ${error.message}`
        });
    }
}

// 2. 检查public/index.html
async function checkIndexHtml(fixes) {
    const indexPath = path.join(__dirname, 'client', 'public', 'index.html');
    
    try {
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // 检查root div
            if (indexContent.includes('id="root"')) {
                fixes.push({
                    task: 'index.html root元素',
                    status: 'PASS',
                    details: '检测到root div'
                });
            } else {
                // 创建正确的index.html
                const correctIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="知行财库管理系统" />
    <title>知行财库</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
                
                fs.writeFileSync(indexPath, correctIndexHtml);
                fixes.push({
                    task: 'index.html root元素',
                    status: 'FIXED',
                    details: '已创建正确的index.html'
                });
            }
        } else {
            // 创建index.html文件
            const publicDir = path.join(__dirname, 'client', 'public');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }
            
            const correctIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="知行财库管理系统" />
    <title>知行财库</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
            
            fs.writeFileSync(indexPath, correctIndexHtml);
            fixes.push({
                task: 'index.html文件',
                status: 'FIXED',
                details: '已创建index.html文件'
            });
        }
    } catch (error) {
        fixes.push({
            task: 'index.html检查',
            status: 'FAIL',
            details: `处理错误: ${error.message}`
        });
    }
}

// 3. 检查src/index.js
async function checkIndexJs(fixes) {
    const indexJsPath = path.join(__dirname, 'client', 'src', 'index.js');
    
    try {
        if (fs.existsSync(indexJsPath)) {
            const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');
            
            // 检查React渲染代码
            if (indexJsContent.includes('ReactDOM.render') || indexJsContent.includes('createRoot')) {
                fixes.push({
                    task: 'index.js React渲染',
                    status: 'PASS',
                    details: '检测到React渲染代码'
                });
            } else {
                fixes.push({
                    task: 'index.js React渲染',
                    status: 'FAIL',
                    details: '缺少React渲染代码'
                });
            }
        } else {
            fixes.push({
                task: 'index.js文件',
                status: 'FAIL',
                details: 'client/src/index.js文件不存在'
            });
        }
    } catch (error) {
        fixes.push({
            task: 'index.js检查',
            status: 'FAIL',
            details: `检查错误: ${error.message}`
        });
    }
}

// 4. 创建环境变量文件
async function createEnvFile(fixes) {
    const envPath = path.join(__dirname, 'client', '.env');
    
    try {
        const envContent = `REACT_APP_SUPABASE_URL=https://itvmeamoqthfqtkpubdv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0
GENERATE_SOURCEMAP=false
`;
        
        fs.writeFileSync(envPath, envContent);
        fixes.push({
            task: '环境变量文件',
            status: 'FIXED',
            details: '已创建.env文件'
        });
    } catch (error) {
        fixes.push({
            task: '环境变量文件',
            status: 'FAIL',
            details: `创建失败: ${error.message}`
        });
    }
}

// 5. 验证构建配置
async function verifyBuildConfig(fixes) {
    try {
        const vercelConfigPath = path.join(__dirname, 'vercel.json');
        
        if (fs.existsSync(vercelConfigPath)) {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
            
            // 检查关键配置
            if (vercelConfig.framework === 'create-react-app') {
                fixes.push({
                    task: 'Vercel框架配置',
                    status: 'PASS',
                    details: '已设置为create-react-app'
                });
            } else {
                fixes.push({
                    task: 'Vercel框架配置',
                    status: 'FAIL',
                    details: '未设置framework: create-react-app'
                });
            }
            
            if (vercelConfig.outputDirectory === 'client/build') {
                fixes.push({
                    task: 'Vercel输出目录',
                    status: 'PASS',
                    details: '输出目录配置正确'
                });
            } else {
                fixes.push({
                    task: 'Vercel输出目录',
                    status: 'FAIL',
                    details: '输出目录配置错误'
                });
            }
        }
    } catch (error) {
        fixes.push({
            task: '构建配置验证',
            status: 'FAIL',
            details: `验证错误: ${error.message}`
        });
    }
}

// 输出修复结果
function outputResults(fixes) {
    console.log(chalk.blue('\n📊 修复结果汇总'));
    console.log(chalk.gray('=' * 60));
    
    let passCount = 0;
    let failCount = 0;
    let fixedCount = 0;
    
    fixes.forEach(fix => {
        const icon = fix.status === 'PASS' ? '✅' : 
                    fix.status === 'FAIL' ? '❌' : 
                    fix.status === 'FIXED' ? '🔧' : '⚠️';
        const color = fix.status === 'PASS' ? 'green' : 
                     fix.status === 'FAIL' ? 'red' : 
                     fix.status === 'FIXED' ? 'blue' : 'yellow';
        
        console.log(chalk[color](`${icon} ${fix.task}: ${fix.details}`));
        
        if (fix.status === 'PASS') passCount++;
        else if (fix.status === 'FAIL') failCount++;
        else if (fix.status === 'FIXED') fixedCount++;
    });
    
    console.log(chalk.blue('\n📈 统计信息'));
    console.log(chalk.green(`✅ 正常: ${passCount}`));
    console.log(chalk.blue(`🔧 已修复: ${fixedCount}`));
    console.log(chalk.red(`❌ 失败: ${failCount}`));
    
    // 下一步操作
    console.log(chalk.blue('\n🚀 下一步操作'));
    if (fixedCount > 0) {
        console.log(chalk.blue('已进行修复，现在需要重新部署：'));
        console.log('1. git add .');
        console.log('2. git commit -m "🔧 修复React应用挂载配置"');
        console.log('3. git push');
        console.log('4. 等待Vercel自动部署完成');
    } else if (failCount === 0) {
        console.log(chalk.green('所有配置正常，可能需要清除缓存重新部署'));
    } else {
        console.log(chalk.red('仍有问题需要手动解决'));
    }
}

// 运行修复
fixReactApp().catch(console.error);
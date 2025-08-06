#!/usr/bin/env node

/**
 * 🚨 Vercel配置诊断
 * 发现Vercel显示Hexo而非React应用的问题
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.red('🚨 Vercel配置诊断 - 发现错误内容问题'));
console.log(chalk.gray('当前线上显示: Hexo博客'));
console.log(chalk.gray('预期显示: React应用'));
console.log(chalk.gray('=' * 60));

async function diagnoseVercelIssue() {
    const issues = [];
    
    try {
        // 1. 检查项目结构
        console.log(chalk.yellow('\n📁 1. 检查项目结构'));
        await checkProjectStructure(issues);
        
        // 2. 检查Vercel配置
        console.log(chalk.yellow('\n⚙️  2. 检查Vercel配置'));
        await checkVercelConfig(issues);
        
        // 3. 检查构建输出
        console.log(chalk.yellow('\n🏗️  3. 检查构建输出'));
        await checkBuildOutput(issues);
        
        // 4. 分析可能原因
        console.log(chalk.yellow('\n🔍 4. 分析可能原因'));
        await analyzePossibleCauses(issues);
        
        // 输出诊断结果和解决方案
        outputDiagnosisAndSolution(issues);
        
    } catch (error) {
        console.error(chalk.red('❌ 诊断过程出错:'), error.message);
    }
}

// 1. 检查项目结构
async function checkProjectStructure(issues) {
    const expectedStructure = [
        'client/src',
        'client/public',
        'client/package.json',
        'vercel.json'
    ];
    
    expectedStructure.forEach(item => {
        const itemPath = path.join(__dirname, item);
        if (fs.existsSync(itemPath)) {
            console.log(chalk.green(`   ✅ ${item} 存在`));
            issues.push({
                category: 'structure',
                item: item,
                status: 'OK',
                details: '文件/目录存在'
            });
        } else {
            console.log(chalk.red(`   ❌ ${item} 不存在`));
            issues.push({
                category: 'structure',
                item: item,
                status: 'MISSING',
                details: '文件/目录缺失'
            });
        }
    });
    
    // 检查是否有冲突的文件
    const conflictingFiles = [
        'public/index.html',  // 根目录的public可能与Hexo冲突
        'index.html',
        '_config.yml',        // Hexo配置文件
        'themes/',           // Hexo主题目录
        'source/'            // Hexo源文件目录
    ];
    
    conflictingFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(chalk.red(`   ⚠️  发现冲突文件: ${file}`));
            issues.push({
                category: 'conflict',
                item: file,
                status: 'CONFLICT',
                details: '可能与Hexo冲突的文件'
            });
        }
    });
}

// 2. 检查Vercel配置
async function checkVercelConfig(issues) {
    const vercelConfigPath = path.join(__dirname, 'vercel.json');
    
    try {
        if (fs.existsSync(vercelConfigPath)) {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
            console.log(chalk.blue('   当前Vercel配置:'));
            console.log(JSON.stringify(vercelConfig, null, 2));
            
            // 检查关键配置
            const checks = [
                { key: 'framework', expected: 'create-react-app', actual: vercelConfig.framework },
                { key: 'outputDirectory', expected: 'client/build', actual: vercelConfig.outputDirectory },
                { key: 'buildCommand', expected: 'cd client && npm ci && npm run build', actual: vercelConfig.buildCommand }
            ];
            
            checks.forEach(check => {
                if (check.actual === check.expected) {
                    issues.push({
                        category: 'config',
                        item: check.key,
                        status: 'OK',
                        details: `配置正确: ${check.actual}`
                    });
                } else {
                    issues.push({
                        category: 'config',
                        item: check.key,
                        status: 'WRONG',
                        details: `预期: ${check.expected}, 实际: ${check.actual || '未设置'}`
                    });
                }
            });
            
        } else {
            issues.push({
                category: 'config',
                item: 'vercel.json',
                status: 'MISSING',
                details: 'Vercel配置文件不存在'
            });
        }
    } catch (error) {
        issues.push({
            category: 'config',
            item: 'vercel.json',
            status: 'ERROR',
            details: `配置文件解析错误: ${error.message}`
        });
    }
}

// 3. 检查构建输出
async function checkBuildOutput(issues) {
    const buildPath = path.join(__dirname, 'client', 'build');
    
    if (fs.existsSync(buildPath)) {
        console.log(chalk.green('   ✅ client/build 目录存在'));
        
        // 检查关键文件
        const buildFiles = ['index.html', 'static'];
        buildFiles.forEach(file => {
            const filePath = path.join(buildPath, file);
            if (fs.existsSync(filePath)) {
                console.log(chalk.green(`   ✅ build/${file} 存在`));
                issues.push({
                    category: 'build',
                    item: `build/${file}`,
                    status: 'OK',
                    details: '构建文件存在'
                });
            } else {
                console.log(chalk.red(`   ❌ build/${file} 不存在`));
                issues.push({
                    category: 'build',
                    item: `build/${file}`,
                    status: 'MISSING',
                    details: '构建文件缺失'
                });
            }
        });
        
        // 检查build/index.html内容
        const buildIndexPath = path.join(buildPath, 'index.html');
        if (fs.existsSync(buildIndexPath)) {
            const buildIndexContent = fs.readFileSync(buildIndexPath, 'utf8');
            if (buildIndexContent.includes('id="root"')) {
                console.log(chalk.green('   ✅ build/index.html 包含React root'));
                issues.push({
                    category: 'build',
                    item: 'build/index.html content',
                    status: 'OK',
                    details: '包含React root元素'
                });
            } else {
                console.log(chalk.red('   ❌ build/index.html 不包含React root'));
                issues.push({
                    category: 'build',
                    item: 'build/index.html content',
                    status: 'WRONG',
                    details: '不是React应用的HTML'
                });
            }
        }
    } else {
        console.log(chalk.red('   ❌ client/build 目录不存在'));
        issues.push({
            category: 'build',
            item: 'client/build',
            status: 'MISSING',
            details: '构建输出目录不存在'
        });
    }
}

// 4. 分析可能原因
async function analyzePossibleCauses(issues) {
    const structureIssues = issues.filter(i => i.category === 'structure' && i.status !== 'OK');
    const configIssues = issues.filter(i => i.category === 'config' && i.status !== 'OK');
    const buildIssues = issues.filter(i => i.category === 'build' && i.status !== 'OK');
    const conflictIssues = issues.filter(i => i.category === 'conflict');
    
    console.log(chalk.blue('   分析结果:'));
    
    if (conflictIssues.length > 0) {
        console.log(chalk.red('   🚨 发现Hexo相关文件冲突'));
        console.log(chalk.yellow('   → 可能原因: Vercel检测到Hexo项目并优先使用'));
    }
    
    if (configIssues.length > 0) {
        console.log(chalk.red('   🚨 Vercel配置有问题'));
        console.log(chalk.yellow('   → 可能原因: 框架或构建配置错误'));
    }
    
    if (buildIssues.length > 0) {
        console.log(chalk.red('   🚨 构建输出有问题'));
        console.log(chalk.yellow('   → 可能原因: React应用构建失败'));
    }
    
    if (structureIssues.length > 0) {
        console.log(chalk.red('   🚨 项目结构有问题'));
        console.log(chalk.yellow('   → 可能原因: 必要文件缺失'));
    }
}

// 输出诊断结果和解决方案
function outputDiagnosisAndSolution(issues) {
    console.log(chalk.blue('\n📋 诊断结果总结'));
    console.log(chalk.gray('=' * 60));
    
    const categoryCounts = {
        structure: { ok: 0, issues: 0 },
        config: { ok: 0, issues: 0 },
        build: { ok: 0, issues: 0 },
        conflict: { ok: 0, issues: 0 }
    };
    
    issues.forEach(issue => {
        if (issue.status === 'OK') {
            categoryCounts[issue.category].ok++;
        } else {
            categoryCounts[issue.category].issues++;
        }
    });
    
    Object.entries(categoryCounts).forEach(([category, counts]) => {
        const total = counts.ok + counts.issues;
        if (total > 0) {
            const status = counts.issues === 0 ? '✅' : '❌';
            console.log(chalk[counts.issues === 0 ? 'green' : 'red'](
                `${status} ${category}: ${counts.ok}/${total} 正常`
            ));
        }
    });
    
    // 解决方案
    console.log(chalk.blue('\n🛠️  解决方案'));
    console.log(chalk.gray('=' * 60));
    
    const conflictIssues = issues.filter(i => i.category === 'conflict');
    if (conflictIssues.length > 0) {
        console.log(chalk.red('1. 🚨 优先处理: 清理Hexo冲突文件'));
        conflictIssues.forEach(issue => {
            console.log(chalk.yellow(`   - 删除或移动: ${issue.item}`));
        });
    }
    
    const configIssues = issues.filter(i => i.category === 'config' && i.status !== 'OK');
    if (configIssues.length > 0) {
        console.log(chalk.red('2. 修复Vercel配置'));
        configIssues.forEach(issue => {
            console.log(chalk.yellow(`   - 修复: ${issue.item} (${issue.details})`));
        });
    }
    
    const buildIssues = issues.filter(i => i.category === 'build' && i.status !== 'OK');
    if (buildIssues.length > 0) {
        console.log(chalk.red('3. 重新构建React应用'));
        console.log(chalk.yellow('   - cd client && npm run build'));
    }
    
    console.log(chalk.blue('\n🚀 推荐立即执行:'));
    console.log(chalk.green('1. 清理冲突文件'));
    console.log(chalk.green('2. 强制重新部署'));
    console.log(chalk.green('3. 验证部署结果'));
}

// 运行诊断
diagnoseVercelIssue().catch(console.error);
#!/usr/bin/env node

/**
 * 🚑 紧急修复三个关键问题
 * 1. 修复getSalesByLink函数引用错误
 * 2. 修复管理员登录Redux状态错误
 * 3. 确认二级销售注册页面路由
 */

const fs = require('fs');
const path = require('path');

console.log('🚑 开始紧急修复关键问题...');

// 问题分析
console.log('\n🔍 问题分析:');
console.log('1. getSalesByLink函数存在但导入有问题');
console.log('2. 管理员登录Redux状态数据结构不匹配');
console.log('3. 二级销售注册页面路由已存在: /secondary-sales');

// 修复计划
console.log('\n🛠️ 修复计划:');
console.log('1. 检查并修复authSlice的数据结构');
console.log('2. 检查salesAPI.getSalesByLink实现');
console.log('3. 验证二级销售注册页面UnifiedSecondarySalesPage存在');

async function diagnoseIssues() {
    try {
        // 1. 检查authSlice
        console.log('\n📋 1. 检查authSlice数据结构...');
        const authSlicePath = path.join(__dirname, 'client/src/store/slices/authSlice.js');
        if (fs.existsSync(authSlicePath)) {
            const authSliceContent = fs.readFileSync(authSlicePath, 'utf8');
            
            // 检查是否有数据结构问题
            if (authSliceContent.includes('action.payload.data.admin')) {
                console.log('   ⚠️  发现问题: authSlice期望action.payload.data.admin结构');
                console.log('   💡 但AuthService.login返回的是不同结构');
                console.log('   🔧 需要修正数据结构匹配');
            }
        }
        
        // 2. 检查salesAPI
        console.log('\n📋 2. 检查salesAPI实现...');
        const apiPath = path.join(__dirname, 'client/src/services/api.js');
        if (fs.existsSync(apiPath)) {
            const apiContent = fs.readFileSync(apiPath, 'utf8');
            
            if (!apiContent.includes('getSalesByLink')) {
                console.log('   ❌ salesAPI.getSalesByLink函数缺失');
            } else {
                console.log('   ✅ salesAPI.getSalesByLink函数存在');
            }
            
            if (!apiContent.includes('export const authAPI')) {
                console.log('   ❌ authAPI导出缺失');
            } else {
                console.log('   ✅ authAPI导出存在');
            }
        }
        
        // 3. 检查UnifiedSecondarySalesPage
        console.log('\n📋 3. 检查二级销售注册页面...');
        const secondaryPagePath = path.join(__dirname, 'client/src/pages/UnifiedSecondarySalesPage.js');
        if (fs.existsSync(secondaryPagePath)) {
            console.log('   ✅ UnifiedSecondarySalesPage.js 存在');
        } else {
            console.log('   ❌ UnifiedSecondarySalesPage.js 缺失');
        }
        
        console.log('\n🎯 修复建议:');
        console.log('1. 修正authSlice中的数据结构匹配');
        console.log('2. 确保salesAPI完整导出');
        console.log('3. 检查二级销售注册页面组件');
        
    } catch (error) {
        console.error('❌ 诊断失败:', error.message);
    }
}

// 运行诊断
diagnoseIssues().catch(console.error);
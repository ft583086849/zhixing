/**
 * 部署验证测试脚本
 * 验证核心功能修复效果
 */

const axios = require('axios');

// 配置
const API_BASE = 'https://zhixing-seven.vercel.app';
const FRONTEND_URL = 'https://zhixing-seven.vercel.app';

async function verifyDeployment() {
    console.log('🚀 开始部署验证...\n');
    
    let results = {
        apiHealth: false,
        orderStatusFix: false,
        salesDataFix: false,
        adminFunctionality: false,
        frontendAccess: false
    };

    try {
        // 1. API健康检查
        console.log('1️⃣ 检查API健康状态...');
        try {
            const healthResponse = await axios.get(`${API_BASE}/api/health`, {
                timeout: 10000
            });
            if (healthResponse.status === 200) {
                console.log('✅ API服务正常运行');
                results.apiHealth = true;
            }
        } catch (error) {
            console.log('❌ API健康检查失败:', error.message);
        }

        // 2. 验证订单状态修复
        console.log('\n2️⃣ 验证订单状态修复...');
        try {
            // 测试订单列表API
            const ordersResponse = await axios.get(`${API_BASE}/api/orders`, {
                timeout: 10000
            });
            
            if (ordersResponse.status === 200) {
                const orders = ordersResponse.data.orders || [];
                console.log(`✅ 订单API正常，共${orders.length}条记录`);
                
                // 检查状态字段是否正确
                if (orders.length > 0) {
                    const statuses = [...new Set(orders.map(o => o.status))];
                    console.log('📊 当前订单状态:', statuses);
                    
                    // 验证不应该有"待审核"状态
                    if (!statuses.includes('待审核')) {
                        console.log('✅ 订单状态修复成功 - 不再有"待审核"状态');
                        results.orderStatusFix = true;
                    } else {
                        console.log('❌ 订单状态修复失败 - 仍有"待审核"状态');
                    }
                }
            }
        } catch (error) {
            console.log('❌ 订单API测试失败:', error.response?.status || error.message);
        }

        // 3. 验证销售数据显示修复
        console.log('\n3️⃣ 验证销售数据显示修复...');
        try {
            const ordersResponse = await axios.get(`${API_BASE}/api/orders`, {
                timeout: 10000
            });
            
            if (ordersResponse.status === 200) {
                const orders = ordersResponse.data.orders || [];
                
                if (orders.length > 0) {
                    const hasWechatData = orders.some(order => 
                        order.sales_wechat_name && order.sales_wechat_name.trim() !== ''
                    );
                    
                    if (hasWechatData) {
                        console.log('✅ 销售微信号数据显示正常');
                        results.salesDataFix = true;
                    } else {
                        console.log('⚠️ 销售微信号数据为空（可能是数据问题）');
                    }
                }
            }
        } catch (error) {
            console.log('❌ 销售数据测试失败:', error.response?.status || error.message);
        }

        // 4. 验证前端访问
        console.log('\n4️⃣ 验证前端访问...');
        try {
            const frontendResponse = await axios.get(FRONTEND_URL, {
                timeout: 10000
            });
            
            if (frontendResponse.status === 200) {
                console.log('✅ 前端应用正常访问');
                results.frontendAccess = true;
            }
        } catch (error) {
            console.log('❌ 前端访问失败:', error.response?.status || error.message);
        }

        // 5. 测试用户购买流程（错误处理）
        console.log('\n5️⃣ 测试用户购买流程错误处理...');
        try {
            // 测试不存在的销售链接
            const invalidLinkResponse = await axios.get(`${API_BASE}/api/sales/nonexistent123`, {
                timeout: 10000,
                validateStatus: () => true // 不抛出错误
            });
            
            if (invalidLinkResponse.status === 404) {
                console.log('✅ 无效销售链接正确返回404');
                console.log('📝 新需求：需要添加友好错误提示"下单拥挤，请等待"');
            }
        } catch (error) {
            console.log('⚠️ 销售链接测试异常:', error.message);
        }

    } catch (error) {
        console.log('❌ 验证过程出现异常:', error.message);
    }

    // 生成验证报告
    console.log('\n📋 部署验证报告');
    console.log('='.repeat(50));
    console.log(`API健康状态: ${results.apiHealth ? '✅ 正常' : '❌ 异常'}`);
    console.log(`订单状态修复: ${results.orderStatusFix ? '✅ 成功' : '❌ 失败'}`);
    console.log(`销售数据修复: ${results.salesDataFix ? '✅ 成功' : '⚠️ 待确认'}`);
    console.log(`前端访问: ${results.frontendAccess ? '✅ 正常' : '❌ 异常'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n总体评分: ${successCount}/${totalCount} 项通过`);
    
    if (successCount === totalCount) {
        console.log('🎉 部署验证完全成功！');
    } else if (successCount >= totalCount * 0.8) {
        console.log('✅ 部署验证基本成功，有少量问题需要关注');
    } else {
        console.log('⚠️ 部署验证发现重要问题，需要进一步检查');
    }
    
    return results;
}

// 运行验证
verifyDeployment().catch(console.error);
// 在一级销售对账页面运行此脚本，快速测试佣金设置功能
// 页面: https://zhixing-seven.vercel.app/primary-sales-settlement

(async function() {
    console.log('🚀 快速测试佣金设置功能...\n');
    
    // 1. 检查是否在正确的页面
    if (!window.location.href.includes('primary-sales-settlement')) {
        console.error('❌ 请先访问一级销售对账页面');
        console.log('正在跳转...');
        window.location.href = '/primary-sales-settlement';
        return;
    }
    
    // 2. 自动填充查询条件
    console.log('1️⃣ 填充查询条件...');
    
    // 查找微信号输入框
    const wechatInput = document.querySelector('input[placeholder*="微信"]');
    const codeInput = document.querySelector('input[placeholder*="销售代码"]');
    
    if (wechatInput) {
        // 使用一个测试账号
        const testWechat = prompt('请输入一级销售微信号（例如: 89上线, 88测试下午, 测试测试）:', '89上线');
        
        if (!testWechat) {
            console.log('❌ 未输入微信号');
            return;
        }
        
        // 填充输入框
        wechatInput.value = testWechat;
        
        // 触发 React 的 onChange 事件
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(wechatInput, testWechat);
        
        const inputEvent = new Event('input', { bubbles: true });
        wechatInput.dispatchEvent(inputEvent);
        
        console.log('✅ 已填充微信号:', testWechat);
        
        // 3. 自动点击查询按钮
        console.log('\n2️⃣ 执行查询...');
        
        setTimeout(() => {
            // 查找查询按钮
            const searchButtons = document.querySelectorAll('button');
            const queryButton = Array.from(searchButtons).find(btn => 
                btn.textContent === '查询' || btn.textContent.includes('查询')
            );
            
            if (queryButton) {
                queryButton.click();
                console.log('✅ 已点击查询按钮');
                
                // 4. 等待数据加载
                console.log('\n3️⃣ 等待数据加载...');
                
                setTimeout(() => {
                    // 检查查询结果
                    console.log('\n4️⃣ 检查查询结果...');
                    
                    // 查找二级销售数量
                    const statsCards = document.querySelectorAll('.ant-statistic-title');
                    const secondarySalesCard = Array.from(statsCards).find(card => 
                        card.textContent.includes('二级销售数量')
                    );
                    
                    if (secondarySalesCard) {
                        const valueElement = secondarySalesCard.nextElementSibling;
                        const value = valueElement ? valueElement.textContent : '0';
                        console.log('二级销售数量:', value);
                        
                        if (value === '0' || value === '0人') {
                            console.log('\n⚠️ 该一级销售下没有二级销售');
                            console.log('\n📝 创建二级销售的步骤:');
                            console.log('1. 一级销售注册后会获得二级销售注册链接');
                            console.log('2. 将注册链接发给二级销售');
                            console.log('3. 二级销售通过链接注册');
                            console.log('4. 注册成功后立即可以在这里看到并设置佣金');
                        } else {
                            // 查找设置佣金按钮
                            const commissionButtons = document.querySelectorAll('button');
                            const setCommissionButtons = Array.from(commissionButtons).filter(btn => 
                                btn.textContent === '设置佣金' || btn.textContent.includes('设置佣金')
                            );
                            
                            if (setCommissionButtons.length > 0) {
                                console.log('\n✅ 找到', setCommissionButtons.length, '个设置佣金按钮');
                                console.log('\n📋 操作说明:');
                                console.log('1. 在"二级销售信息"表格中找到要设置佣金的二级销售');
                                console.log('2. 点击该行的"设置佣金"按钮');
                                console.log('3. 在弹窗中输入佣金百分比（如: 25）');
                                console.log('4. 点击"确定"保存');
                                
                                console.log('\n💡 提示:');
                                console.log('- 默认佣金率是 25%');
                                console.log('- 佣金率会立即生效');
                                console.log('- 管理员页面也会同步显示');
                                
                                // 高亮第一个按钮
                                if (setCommissionButtons[0]) {
                                    setCommissionButtons[0].style.backgroundColor = '#52c41a';
                                    setCommissionButtons[0].style.animation = 'pulse 2s infinite';
                                    
                                    // 添加动画样式
                                    const style = document.createElement('style');
                                    style.textContent = `
                                        @keyframes pulse {
                                            0% { transform: scale(1); }
                                            50% { transform: scale(1.1); }
                                            100% { transform: scale(1); }
                                        }
                                    `;
                                    document.head.appendChild(style);
                                    
                                    console.log('\n✨ 已高亮显示第一个"设置佣金"按钮');
                                }
                            } else {
                                console.log('\n⚠️ 未找到设置佣金按钮');
                                console.log('可能表格还在加载中，请稍等片刻');
                            }
                        }
                    } else {
                        console.log('⚠️ 未找到统计数据，可能查询失败');
                        console.log('请检查输入的微信号是否正确');
                    }
                }, 2000);
            } else {
                console.log('❌ 未找到查询按钮');
            }
        }, 500);
    } else {
        console.log('❌ 未找到查询输入框');
        console.log('页面可能还在加载，请稍后再试');
    }
})();

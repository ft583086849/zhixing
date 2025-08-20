// 检查e8257订单的详细数据
const state = window.store?.getState();
if (state) {
  const orders = state.admin?.orders || [];
  const e8257Order = orders.find(order => 
    order.tradingview_username?.toLowerCase() === 'e8257'
  );
  
  if (e8257Order) {
    console.log('e8257订单完整数据:');
    console.log('-------------------');
    console.log('订单ID:', e8257Order.id);
    console.log('用户名:', e8257Order.tradingview_username);
    console.log('购买时长(duration):', e8257Order.duration);
    console.log('订单金额(amount):', e8257Order.amount);
    console.log('支付方式(payment_method):', e8257Order.payment_method);
    console.log('支付宝金额(alipay_amount):', e8257Order.alipay_amount);
    console.log('加密货币金额(crypto_amount):', e8257Order.crypto_amount);
    console.log('实付金额(paid_amount):', e8257Order.paid_amount);
    console.log('-------------------');
    
    // 模拟实付金额列的渲染逻辑
    let displayAmount;
    if (e8257Order.payment_method === 'alipay' && e8257Order.alipay_amount) {
      displayAmount = `¥${e8257Order.alipay_amount}`;
    } else if (e8257Order.payment_method === 'crypto' && e8257Order.crypto_amount) {
      displayAmount = `$${e8257Order.crypto_amount}`;
    } else {
      displayAmount = `$${e8257Order.amount}`;
    }
    console.log('页面显示的实付金额:', displayAmount);
    
    // 检查是否有数据异常
    if (e8257Order.alipay_amount === 1588 && e8257Order.amount === 300) {
      console.warn('⚠️ 数据异常: 订单金额是$300（3个月），但支付宝金额是¥1588');
      console.warn('可能是数据录入错误，需要修正数据库中的数据');
    }
  }
}
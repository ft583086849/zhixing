/**
 * 全局数据刷新管理器
 * 用于在订单状态更新后刷新所有相关数据
 */

import { store } from '../store';
import { getStats, getAdminOrders, getSales, getCustomers } from '../store/slices/adminSlice';
import { CacheManager } from '../services/api';

class DataRefreshManager {
  /**
   * 刷新所有管理员相关数据
   */
  static async refreshAllAdminData() {
    console.log('🔄 开始刷新所有管理员数据...');
    
    // 清除所有缓存
    CacheManager.clearAll();
    
    // 并行刷新所有数据
    const promises = [
      // 刷新统计数据
      store.dispatch(getStats({ usePaymentTime: true })),
      // 刷新订单列表
      store.dispatch(getAdminOrders({ limit: 100 })),
      // 刷新销售列表
      store.dispatch(getSales()),
      // 刷新客户列表
      store.dispatch(getCustomers())
    ];
    
    try {
      await Promise.all(promises);
      console.log('✅ 所有管理员数据刷新完成');
    } catch (error) {
      console.error('❌ 数据刷新失败:', error);
    }
  }
  
  /**
   * 刷新统计相关数据
   */
  static async refreshStatistics() {
    console.log('📊 刷新统计数据...');
    CacheManager.remove('admin-stats');
    await store.dispatch(getStats({ usePaymentTime: true }));
  }
  
  /**
   * 刷新订单相关数据
   */
  static async refreshOrders() {
    console.log('📦 刷新订单数据...');
    CacheManager.remove('admin-orders');
    await store.dispatch(getAdminOrders({ limit: 100 }));
  }
  
  /**
   * 刷新销售相关数据
   */
  static async refreshSales() {
    console.log('💼 刷新销售数据...');
    CacheManager.remove('admin-sales');
    await store.dispatch(getSales());
  }
  
  /**
   * 刷新客户相关数据
   */
  static async refreshCustomers() {
    console.log('👥 刷新客户数据...');
    CacheManager.remove('admin-customers');
    await store.dispatch(getCustomers());
  }
  
  /**
   * 订单状态更新后的刷新策略
   */
  static async onOrderStatusUpdate() {
    console.log('🔄 订单状态更新，开始刷新相关数据...');
    
    // 并行刷新所有相关数据
    await Promise.all([
      this.refreshStatistics(),
      this.refreshOrders(),
      this.refreshSales(),
      this.refreshCustomers()
    ]);
    
    console.log('✅ 订单状态更新后的数据刷新完成');
  }
  
  /**
   * 销售佣金更新后的刷新策略
   */
  static async onCommissionUpdate() {
    console.log('💰 佣金更新，开始刷新相关数据...');
    
    await Promise.all([
      this.refreshSales(),
      this.refreshStatistics()
    ]);
    
    console.log('✅ 佣金更新后的数据刷新完成');
  }
  
  /**
   * 创建新订单后的刷新策略
   */
  static async onOrderCreate() {
    console.log('🆕 新订单创建，开始刷新相关数据...');
    
    await Promise.all([
      this.refreshOrders(),
      this.refreshStatistics(),
      this.refreshCustomers()
    ]);
    
    console.log('✅ 新订单创建后的数据刷新完成');
  }
}

// 导出单例
export default DataRefreshManager;

// 也导出具体方法方便使用
export const {
  refreshAllAdminData,
  refreshStatistics,
  refreshOrders,
  refreshSales,
  refreshCustomers,
  onOrderStatusUpdate,
  onCommissionUpdate,
  onOrderCreate
} = DataRefreshManager;

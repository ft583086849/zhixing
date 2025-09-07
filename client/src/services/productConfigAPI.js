/**
 * 产品配置API - 动态获取产品配置信息
 * 支持从数据库读取，回退到硬编码配置
 */

import { SupabaseService } from './supabase';

// 硬编码配置作为回退方案
const HARDCODED_PRODUCT_CONFIGS = [
  // 免费试用配置
  {
    product_type: '信号策略',
    duration_months: 0,
    price_usd: 0.00,
    trial_days: 3,
    is_trial: true,
    status: 'active',
    effective_date: '2024-09-06'
  },
  {
    product_type: '推币系统',
    duration_months: 0,
    price_usd: 0.00,
    trial_days: 3,
    is_trial: true,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '套餐组合',
    duration_months: 0,
    price_usd: 0.00,
    trial_days: 3,
    is_trial: true,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  // 付费配置 - 信号策略
  {
    product_type: '信号策略',
    duration_months: 1,
    price_usd: 288.00,
    trial_days: 0,
    is_trial: false,
    status: 'active',
    effective_date: '2024-09-06'
  },
  {
    product_type: '信号策略',
    duration_months: 3,
    price_usd: 588.00,
    trial_days: 0,
    is_trial: false,
    status: 'active',
    effective_date: '2024-09-06'
  },
  {
    product_type: '信号策略',
    duration_months: 6,
    price_usd: 1088.00,
    trial_days: 0,
    is_trial: false,
    status: 'active',
    effective_date: '2024-09-06'
  },
  {
    product_type: '信号策略',
    duration_months: 12,
    price_usd: 1888.00,
    trial_days: 0,
    is_trial: false,
    status: 'active',
    effective_date: '2024-09-06'
  },
  // 付费配置 - 推币系统
  {
    product_type: '推币系统',
    duration_months: 1,
    price_usd: 588.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '推币系统',
    duration_months: 3,
    price_usd: 1588.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '推币系统',
    duration_months: 6,
    price_usd: 2588.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '推币系统',
    duration_months: 12,
    price_usd: 3999.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  // 付费配置 - 套餐组合
  {
    product_type: '套餐组合',
    duration_months: 1,
    price_usd: 688.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '套餐组合',
    duration_months: 3,
    price_usd: 1888.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '套餐组合',
    duration_months: 6,
    price_usd: 3188.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  },
  {
    product_type: '套餐组合',
    duration_months: 12,
    price_usd: 4688.00,
    trial_days: 0,
    is_trial: false,
    status: 'coming_soon',
    effective_date: '2024-09-06'
  }
];

const HARDCODED_PRODUCT_FEATURES = [
  // 信号策略特性
  { product_type: '信号策略', feature_name: '信号策略分析', feature_description: '专业的市场分析和交易策略' },
  { product_type: '信号策略', feature_name: 'TradingView信号', feature_description: '实时TradingView信号推送' },
  { product_type: '信号策略', feature_name: '24小时客服', feature_description: '全天候专业客服支持' },
  
  // 推币系统特性
  { product_type: '推币系统', feature_name: 'Discord专属频道', feature_description: 'Discord平台独家交易频道' },
  { product_type: '推币系统', feature_name: '实时推币信号', feature_description: '即时推送高质量交易信号' },
  { product_type: '推币系统', feature_name: '3天免费试用', feature_description: '新用户享受3天完整功能体验' },
  { product_type: '推币系统', feature_name: '高级分析工具', feature_description: '专业的技术分析工具集' },
  
  // 套餐组合特性
  { product_type: '套餐组合', feature_name: '包含信号策略', feature_description: '完整的信号策略功能' },
  { product_type: '套餐组合', feature_name: '包含推币系统', feature_description: '完整的推币系统功能' },
  { product_type: '套餐组合', feature_name: '最优价格组合', feature_description: '相比单独购买节省更多费用' }
];

// 环境配置
const USE_DYNAMIC_PRODUCTS = process.env.REACT_APP_USE_DYNAMIC_PRODUCTS === 'true';
const FALLBACK_TO_HARDCODE = process.env.REACT_APP_FALLBACK_TO_HARDCODE !== 'false';

class ProductConfigAPI {
  /**
   * 获取所有产品配置
   */
  static async getProductConfigs() {
    console.log('🔍 获取产品配置...');
    
    if (!USE_DYNAMIC_PRODUCTS) {
      console.log('📋 使用硬编码配置（环境变量控制）');
      return {
        data: HARDCODED_PRODUCT_CONFIGS,
        source: 'hardcoded'
      };
    }

    try {
      // 尝试从数据库获取
      const { data, error } = await SupabaseService.supabase
        .from('product_config')
        .select('*')
        .eq('is_active', true)
        .order('product_type, duration_months');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ 从数据库获取产品配置:', data.length, '条');
        return { data, source: 'database' };
      }

      // 数据库无数据，回退到硬编码
      if (FALLBACK_TO_HARDCODE) {
        console.log('⚠️ 数据库无配置，回退到硬编码');
        return {
          data: HARDCODED_PRODUCT_CONFIGS,
          source: 'fallback'
        };
      }

      return { data: [], source: 'empty' };

    } catch (error) {
      console.warn('❌ 数据库获取失败:', error.message);
      
      if (FALLBACK_TO_HARDCODE) {
        console.log('⚠️ 回退到硬编码配置');
        return {
          data: HARDCODED_PRODUCT_CONFIGS,
          source: 'fallback'
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取免费试用配置
   */
  static async getTrialConfigs() {
    console.log('🔍 获取免费试用配置...');
    
    try {
      const result = await this.getProductConfigs();
      const trialConfigs = result.data.filter(config => config.is_trial === true);
      
      console.log('✅ 免费试用配置:', trialConfigs.length, '个产品');
      return {
        data: trialConfigs,
        source: result.source
      };

    } catch (error) {
      console.error('❌ 获取免费试用配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品特性
   */
  static async getProductFeatures() {
    console.log('🔍 获取产品特性...');

    if (!USE_DYNAMIC_PRODUCTS) {
      return {
        data: HARDCODED_PRODUCT_FEATURES,
        source: 'hardcoded'
      };
    }

    try {
      const { data, error } = await SupabaseService.supabase
        .from('product_features')
        .select('*')
        .eq('is_active', true)
        .order('product_type, feature_name');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ 从数据库获取产品特性:', data.length, '条');
        return { data, source: 'database' };
      }

      if (FALLBACK_TO_HARDCODE) {
        console.log('⚠️ 数据库无特性，回退到硬编码');
        return {
          data: HARDCODED_PRODUCT_FEATURES,
          source: 'fallback'
        };
      }

      return { data: [], source: 'empty' };

    } catch (error) {
      console.warn('❌ 获取产品特性失败:', error.message);
      
      if (FALLBACK_TO_HARDCODE) {
        return {
          data: HARDCODED_PRODUCT_FEATURES,
          source: 'fallback'
        };
      }
      
      throw error;
    }
  }

  /**
   * 检查免费试用资格
   */
  static async checkTrialEligibility(tradingViewUsername, productType) {
    console.log('🔍 检查免费试用资格:', { tradingViewUsername, productType });

    try {
      // 获取试用配置
      const trialResult = await this.getTrialConfigs();
      const trialConfig = trialResult.data.find(config => 
        config.product_type === productType
      );

      if (!trialConfig) {
        return {
          eligible: false,
          trialDays: 0,
          message: '该产品不支持免费试用'
        };
      }

      // 检查是否已申请过免费试用
      const { data: existingOrders, error } = await SupabaseService.supabase
        .from('orders_optimized')
        .select('id')
        .eq('tradingview_username', tradingViewUsername)
        .eq('product_type', productType)
        .eq('amount', 0)
        .limit(1);

      if (error) {
        console.warn('检查试用资格失败:', error);
        // 继续执行，不阻塞用户
      }

      const hasUsedTrial = existingOrders && existingOrders.length > 0;
      
      return {
        eligible: !hasUsedTrial,
        trialDays: trialConfig.trial_days,
        message: hasUsedTrial ? 
          `您已申请过${productType}免费试用` : 
          `可申请${trialConfig.trial_days}天免费试用`
      };

    } catch (error) {
      console.error('❌ 检查试用资格失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品配置（按产品类型分组）
   */
  static async getGroupedProductConfigs() {
    try {
      const result = await this.getProductConfigs();
      const features = await this.getProductFeatures();
      
      // 按产品类型分组
      const grouped = result.data.reduce((groups, config) => {
        const { product_type } = config;
        
        if (!groups[product_type]) {
          groups[product_type] = {
            productType: product_type,
            status: config.status,
            configs: [],
            features: features.data.filter(f => f.product_type === product_type)
          };
        }
        
        groups[product_type].configs.push(config);
        return groups;
      }, {});

      console.log('✅ 分组产品配置:', Object.keys(grouped));
      
      return {
        data: grouped,
        source: result.source
      };

    } catch (error) {
      console.error('❌ 获取分组配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据产品和时长获取价格
   */
  static async getPrice(productType, durationMonths, isTrial = false) {
    try {
      const result = await this.getProductConfigs();
      const config = result.data.find(c => 
        c.product_type === productType && 
        c.duration_months === durationMonths &&
        c.is_trial === isTrial
      );

      return config ? config.price_usd : null;

    } catch (error) {
      console.error('❌ 获取价格失败:', error);
      return null;
    }
  }

  /**
   * 判断是否为免费订单
   */
  static async isFreeOrder(productType, duration) {
    try {
      const trialResult = await this.getTrialConfigs();
      
      return trialResult.data.some(config => 
        config.product_type === productType && 
        duration === `${config.trial_days}天` &&
        config.is_trial === true
      );

    } catch (error) {
      console.warn('判断免费订单失败，使用默认逻辑:', error);
      
      // 回退逻辑
      return duration === '3天' && 
        ['信号策略', '推币系统', '套餐组合'].includes(productType);
    }
  }
}

export default ProductConfigAPI;
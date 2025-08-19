import React, { useState, useEffect } from 'react';
import { Table, message } from 'antd';
import { AdminAPI } from '../../services/api';

const ConversionRateTable = ({ timeRange, customRange, salesTypeFilter, salesNameFilter }) => {
  const [loading, setLoading] = useState(false);
  const [conversionData, setConversionData] = useState([]);

  // 加载转化率数据
  const loadConversionData = async () => {
    setLoading(true);
    try {
      // 构建参数
      const params = {
        timeRange: timeRange === 'custom' && customRange.length > 0 ? 'custom' : timeRange,
        usePaymentTime: true
      };

      // 添加自定义时间范围
      if (timeRange === 'custom' && customRange.length > 0) {
        params.customRange = customRange;
      }

      // 添加销售筛选参数
      if (salesTypeFilter) {
        params.sales_type = salesTypeFilter;
      }
      if (salesNameFilter) {
        params.wechat_name = salesNameFilter;
      }

      console.log('📊 获取转化率数据，参数:', params);

      // 获取销售列表和订单数据
      const salesData = await AdminAPI.getSalesConversionStats(params);
      
      if (salesData && salesData.length > 0) {
        // 构建表格数据
        const tableData = salesData.map((item, index) => {
          const validOrders = item.total_orders || 0;
          const paidOrders = item.paid_orders || 0;
          const conversionRate = validOrders > 0 
            ? ((paidOrders / validOrders) * 100).toFixed(2)
            : '0.00';

          return {
            key: `${index + 1}`,
            rank: index + 1,
            wechat_name: item.wechat_name || '-',
            sales_type: item.sales_type || '-',
            total: validOrders,
            paid: paidOrders,
            rate: parseFloat(conversionRate)
          };
        });

        // 添加汇总行
        const totalValidOrders = salesData.reduce((sum, item) => sum + (item.total_orders || 0), 0);
        const totalPaidOrders = salesData.reduce((sum, item) => sum + (item.paid_orders || 0), 0);
        const totalRate = totalValidOrders > 0 
          ? ((totalPaidOrders / totalValidOrders) * 100).toFixed(2)
          : '0.00';

        tableData.push({
          key: 'total',
          rank: '',
          wechat_name: '转化率统计',
          sales_type: '',
          total: totalValidOrders,
          paid: totalPaidOrders,
          rate: parseFloat(totalRate),
          isTotal: true
        });

        setConversionData(tableData);

        console.log('✅ 转化率数据更新:', {
          销售数: salesData.length,
          总有效订单: totalValidOrders,
          总收费订单: totalPaidOrders,
          总转化率: totalRate + '%'
        });
      } else {
        setConversionData([]);
      }
    } catch (error) {
      console.error('获取转化率数据失败:', error);
      message.error('获取转化率数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听筛选条件变化
  useEffect(() => {
    loadConversionData();
  }, [timeRange, customRange, salesTypeFilter, salesNameFilter]);

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (text, record) => {
        if (record.isTotal) return '';
        if (text <= 3) {
          const medals = ['🥇', '🥈', '🥉'];
          return <span style={{ fontSize: '16px' }}>{medals[text - 1]} {text}</span>;
        }
        return text;
      }
    },
    {
      title: '销售名称',
      dataIndex: 'wechat_name',
      key: 'wechat_name',
      width: 150,
      render: (text, record) => {
        if (record.isTotal) {
          return <strong style={{ color: '#52c41a' }}>✅ {text}</strong>;
        }
        return text || '-';
      }
    },
    {
      title: '销售类型',
      dataIndex: 'sales_type',
      key: 'sales_type',
      width: 100,
      align: 'center',
      render: (text, record) => {
        if (record.isTotal) return '';
        const typeMap = {
          'primary': <span style={{ color: '#1890ff' }}>一级销售</span>,
          'secondary': <span style={{ color: '#52c41a' }}>二级销售</span>,
          'independent': <span style={{ color: '#fa8c16' }}>独立销售</span>
        };
        return typeMap[text] || text || '-';
      }
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      align: 'center',
      render: (text, record) => (
        <span style={{ 
          fontSize: '13px', 
          color: '#1890ff', 
          fontWeight: record.isTotal ? 'bold' : 'normal' 
        }}>
          {text} 笔
        </span>
      )
    },
    {
      title: '收费订单总数',
      dataIndex: 'paid',
      key: 'paid',
      width: 120,
      align: 'center',
      render: (text, record) => (
        <span style={{ 
          fontSize: '13px', 
          color: '#52c41a', 
          fontWeight: record.isTotal ? 'bold' : 'normal' 
        }}>
          {text} 笔
        </span>
      )
    },
    {
      title: '转化率',
      dataIndex: 'rate',
      key: 'rate',
      align: 'center',
      width: 100,
      render: (rate, record) => {
        const rateNum = parseFloat(rate);
        let color = '#ff4d4f';
        if (rateNum >= 80) color = '#52c41a';
        else if (rateNum >= 50) color = '#faad14';
        else if (rateNum >= 20) color = '#fa8c16';
        
        return (
          <span style={{ 
            fontSize: record.isTotal ? '15px' : '14px', 
            fontWeight: 'bold',
            color 
          }}>
            {rate.toFixed(2)}%
          </span>
        );
      }
    }
  ];

  return (
    <Table
      bordered
      pagination={false}
      size="small"
      loading={loading}
      style={{ 
        fontSize: '12px',
        '& .ant-table-cell': {
          padding: '8px 12px'
        }
      }}
      dataSource={conversionData}
      columns={columns}
    />
  );
};

export default ConversionRateTable;
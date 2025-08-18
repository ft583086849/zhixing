import React, { useState } from 'react';
import { Button, Card, Table, Space, message, Spin, Typography } from 'antd';
import { supabase } from '../services/supabase';

const { Title, Text } = Typography;

// Duration字段规范化工具页面
const FixDurationPage = () => {
  const [loading, setLoading] = useState(false);
  const [beforeData, setBeforeData] = useState([]);
  const [afterData, setAfterData] = useState([]);
  const [updateLog, setUpdateLog] = useState([]);

  // 分析当前duration值
  const analyzeDuration = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders_optimized')
        .select('duration')
        .not('duration', 'is', null);

      if (error) throw error;

      // 统计各个值的数量
      const counts = {};
      data.forEach(row => {
        const val = row.duration || 'NULL';
        counts[val] = (counts[val] || 0) + 1;
      });

      // 转换为表格数据
      const tableData = Object.entries(counts)
        .map(([value, count]) => ({
          key: value,
          value,
          count,
          percentage: ((count / data.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);

      setBeforeData(tableData);
      return tableData;
    } catch (error) {
      message.error('分析失败: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 执行规范化
  const normalizeDuration = async () => {
    setLoading(true);
    setUpdateLog([]);
    
    const updates = [
      { 
        newValue: '7天',
        oldValues: ['7天免费', '7days', '7 days', '7日', '七天']
      },
      {
        newValue: '1个月', 
        oldValues: ['1月', '1month', '1 month', '一个月', '30天', '30 days']
      },
      {
        newValue: '3个月',
        oldValues: ['3月', '3months', '3 months', '三个月', '90天', '90 days']
      },
      {
        newValue: '6个月',
        oldValues: ['6月', '6months', '6 months', '六个月', '180天', '180 days', '半年']
      },
      {
        newValue: '1年',
        oldValues: ['1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days']
      }
    ];

    const logs = [];
    let totalUpdated = 0;

    try {
      for (const update of updates) {
        for (const oldValue of update.oldValues) {
          const { data, error } = await supabase
            .from('orders_optimized')
            .update({ duration: update.newValue })
            .eq('duration', oldValue)
            .select('id');

          if (error) {
            logs.push({
              status: 'error',
              message: `失败 "${oldValue}": ${error.message}`
            });
          } else if (data && data.length > 0) {
            logs.push({
              status: 'success',
              message: `成功更新 ${data.length} 条: "${oldValue}" → "${update.newValue}"`
            });
            totalUpdated += data.length;
          }
        }
      }

      logs.push({
        status: 'info',
        message: `规范化完成！共更新 ${totalUpdated} 条记录`
      });

      setUpdateLog(logs);
      
      // 重新分析
      const afterTableData = await analyzeDuration();
      setAfterData(afterTableData);
      
      message.success(`规范化完成！共更新 ${totalUpdated} 条记录`);
    } catch (error) {
      message.error('规范化失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '百分比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (text) => `${text}%`
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Duration字段规范化工具</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="操作">
          <Space>
            <Button type="primary" onClick={analyzeDuration} loading={loading}>
              分析当前值
            </Button>
            <Button 
              type="danger" 
              onClick={normalizeDuration} 
              loading={loading}
              disabled={beforeData.length === 0}
            >
              执行规范化（转为中文）
            </Button>
          </Space>
        </Card>

        {beforeData.length > 0 && (
          <Card title="规范化前的duration值分布">
            <Table 
              columns={columns} 
              dataSource={beforeData}
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {updateLog.length > 0 && (
          <Card title="更新日志">
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {updateLog.map((log, index) => (
                <div key={index} style={{ 
                  color: log.status === 'error' ? 'red' : 
                         log.status === 'success' ? 'green' : 
                         'blue',
                  marginBottom: 4
                }}>
                  {log.status === 'error' && '❌ '}
                  {log.status === 'success' && '✅ '}
                  {log.status === 'info' && 'ℹ️ '}
                  {log.message}
                </div>
              ))}
            </div>
          </Card>
        )}

        {afterData.length > 0 && (
          <Card title="规范化后的duration值分布">
            <Table 
              columns={columns} 
              dataSource={afterData}
              pagination={false}
              size="small"
            />
          </Card>
        )}
      </Space>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Spin size="large" tip="处理中..." />
        </div>
      )}
    </div>
  );
};

export default FixDurationPage;

import React from 'react';
import { Table, Skeleton } from 'antd';

const CommonTable = ({
  columns,
  dataSource,
  loading = false,
  pagination = {},
  scroll = {},
  size = 'middle',
  bordered = false,
  rowKey = 'id',
  onRow,
  ...props
}) => {
  const LoadingSkeleton = () => (
    <div style={{ padding: '20px' }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      scroll={scroll}
      size={size}
      bordered={bordered}
      rowKey={rowKey}
      onRow={onRow}
      locale={{ 
        emptyText: loading ? <LoadingSkeleton /> : "暂无数据" 
      }}
      {...props}
    />
  );
};

export default CommonTable;

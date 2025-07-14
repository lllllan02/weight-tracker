import React from 'react';
import { List, Card, Button, Space, Empty, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, CalendarOutlined, DashboardOutlined } from '@ant-design/icons';
import { WeightRecord } from '../types';
import { formatDateFull } from '../utils/helpers';
import { deleteRecord } from '../utils/api';

interface WeightListProps {
  records: WeightRecord[];
  onDelete: () => void;
}

export const WeightList: React.FC<WeightListProps> = ({ records, onDelete }) => {
  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      onDelete();
    } catch (error) {
      console.error('删除记录失败:', error);
    }
  };

  if (records.length === 0) {
    return (
      <Card className="records-container">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无体重记录"
        >
          <span style={{ color: '#8c8c8c' }}>开始记录你的体重吧！</span>
        </Empty>
      </Card>
    );
  }

  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card 
      title="体重记录" 
      className="records-container"
      extra={<DashboardOutlined style={{ color: '#1890ff' }} />}
    >
      <List
        dataSource={sortedRecords}
        renderItem={(record) => (
          <List.Item
            actions={[
              <Popconfirm
                title="确定要删除这条记录吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  size="small"
                >
                  删除
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={<DashboardOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
              title={
                <Space>
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {record.weight} kg
                  </span>
                  <Tag color={record.fasting === '空腹' ? 'blue' : 'orange'} style={{ fontWeight: 500, fontSize: 13 }}>
                    {record.fasting}
                  </Tag>
                  {record.note && (
                    <Tag color="blue">{record.note}</Tag>
                  )}
                </Space>
              }
              description={
                <Space>
                  <CalendarOutlined />
                  {formatDateFull(record.date)}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}; 
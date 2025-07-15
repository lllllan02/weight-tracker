import React, { useState } from 'react';
import { Card, Button, Modal, Statistic, List, Tag, Typography, Divider } from 'antd';
import { FileTextOutlined, CalendarOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import { Report } from '../types';

const { Text, Title } = Typography;

interface ReportCardProps {
  report: Report;
  loading?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, loading = false }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getReportIcon = () => {
    return report.type === 'weekly' ? <CalendarOutlined /> : <FileTextOutlined />;
  };

  const getReportTitle = () => {
    return report.type === 'weekly' ? '周报' : '月报';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#ff4d4f';
    if (change < 0) return '#52c41a';
    return '#8c8c8c';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  return (
    <>
      <Card
        title={
          <span>
            {getReportIcon()} {getReportTitle()}
          </span>
        }
        extra={
          <Button type="primary" onClick={showModal} loading={loading}>
            查看详情
          </Button>
        }
        style={{ marginBottom: 0, padding: 0 }}
        styles={{ body: { padding: 16 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>{report.period}</Text>
            <br />
            <Text type="secondary">记录数: {report.stats.recordCount}</Text>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: getChangeColor(report.stats.change) }}>
              {getChangeIcon(report.stats.change)} {report.stats.change > 0 ? '+' : ''}{report.stats.change}kg
            </div>
            <Text type="secondary">体重变化</Text>
          </div>
        </div>

        {report.insights.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">主要发现:</Text>
            <div style={{ marginTop: 4 }}>
              {report.insights.slice(0, 2).map((insight, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                  {insight}
                </Tag>
              ))}
              {report.insights.length > 2 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  +{report.insights.length - 2} 更多
                </Text>
              )}
            </div>
          </div>
        )}
      </Card>

      <Modal
        title={
          <span>
            {getReportIcon()} {getReportTitle()} - {report.period}
          </span>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 16 }}>
          {/* 统计概览 - 统一网格布局 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 16, 
            marginBottom: 24,
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {/* 第一行 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>起始体重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {report.stats.startWeight}kg
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>结束体重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {report.stats.endWeight}kg
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>体重变化</div>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 'bold', 
                color: getChangeColor(report.stats.change) 
              }}>
                {getChangeIcon(report.stats.change)} {report.stats.change > 0 ? '+' : ''}{report.stats.change}kg
              </div>
            </div>
            
            {/* 第二行 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>平均体重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {report.stats.average}kg
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>最高体重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                {report.stats.max}kg
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>最低体重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#13c2c2' }}>
                {report.stats.min}kg
              </div>
            </div>
          </div>

          {/* 每周平均体重（仅月报） */}
          {report.type === 'monthly' && report.stats.weeklyAverages && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>
                <RiseOutlined style={{ marginRight: 8 }} />
                每周平均体重趋势
              </Title>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {report.stats.weeklyAverages.map((avg, index) => (
                  <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                      {avg > 0 ? `${avg}kg` : '-'}
                    </div>
                    <Text type="secondary">第{index + 1}周</Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* 洞察分析 */}
          <div style={{ 
            marginBottom: 24,
            padding: '16px',
            backgroundColor: '#fff7e6',
            borderRadius: '8px',
            border: '1px solid #ffd591'
          }}>
            <Title level={5} style={{ marginBottom: 16, color: '#d46b08' }}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              洞察分析
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.insights.map((insight, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #ffd591'
                }}>
                  <span style={{ 
                    color: '#d46b08', 
                    fontWeight: 'bold', 
                    marginRight: 8,
                    minWidth: '20px'
                  }}>
                    {index + 1}.
                  </span>
                  <Text style={{ flex: 1, lineHeight: '1.5' }}>{insight}</Text>
                </div>
              ))}
            </div>
          </div>

          {/* 记录列表 */}
          {report.records.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={5}>详细记录</Title>
                <div style={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}>
                  {report.records.map((record, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: index < report.records.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                    }}>
                      <div>
                        <Text strong>{new Date(record.date).toLocaleDateString('zh-CN')}</Text>
                        <br />
                        <Text type="secondary">{new Date(record.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 100, paddingRight: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>{record.weight}kg</Text>
                        <br />
                        <Tag color={record.fasting === '空腹' ? 'green' : 'orange'} style={{ marginTop: 4 }}>
                          {record.fasting}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}; 
import React from 'react';
import { Card, Progress, Statistic, Typography } from 'antd';
import { AimOutlined, TrophyOutlined } from '@ant-design/icons';
import { WeightStats } from '../types';

const { Text } = Typography;

interface TargetProgressProps {
  stats: WeightStats;
  targetWeight?: number;
}

export const TargetProgress: React.FC<TargetProgressProps> = ({ stats, targetWeight }) => {
  if (!targetWeight || targetWeight <= 0) {
    return (
      <Card 
        title={
                  <span>
          <AimOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          目标进度
        </span>
        }
        style={{ marginBottom: 0 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">请在设置中配置目标体重</Text>
        </div>
      </Card>
    );
  }

  const getProgressColor = () => {
    if (stats.targetProgress >= 80) return '#52c41a';
    if (stats.targetProgress >= 50) return '#faad14';
    return '#1890ff';
  };

  const getProgressStatus = () => {
    if (stats.targetProgress >= 100) return 'success';
    if (stats.targetProgress >= 80) return 'active';
    return 'normal';
  };

  const getTargetDirection = () => {
    // 基于初始体重和目标体重的关系判断方向
    return targetWeight > stats.initialWeight ? '增重' : '减重';
  };

  const getRemainingText = () => {
    if (Math.abs(stats.targetRemaining) <= 0.5) {
      return '目标达成！';
    }
    const direction = getTargetDirection();
    return `还需${direction} ${Math.abs(stats.targetRemaining)}kg`;
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AimOutlined style={{ color: '#1890ff' }} />
          <span>目标进度</span>
          <span style={{ color: '#1890ff', fontWeight: 'bold', marginLeft: 8 }}>
            {stats.current}kg
          </span>
          <span style={{ color: getProgressColor(), fontSize: 12 }}>
            {getRemainingText()}
          </span>
        </div>
      }
      style={{ marginBottom: 0, padding: 0 }}
              styles={{ body: { padding: 16 } }}
    >
      <div>
        {/* 进度条 */}
        <div style={{ marginBottom: 8 }}>
          <Progress
            percent={Math.min(100, stats.targetProgress)}
            status={getProgressStatus()}
            strokeColor={getProgressColor()}
            format={(percent) => `${percent?.toFixed(1)}%`}
            showInfo={false}
          />
        </div>
        
        {/* 体重范围和进度信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: '#666' }}>初始: {stats.initialWeight}kg</span>
          <span style={{ color: getProgressColor(), fontWeight: 'bold' }}>
            {stats.targetProgress.toFixed(1)}% 完成
          </span>
          <span style={{ color: '#666' }}>目标: {targetWeight}kg ({getTargetDirection()})</span>
        </div>
      </div>

      {stats.targetProgress >= 100 && (
        <div style={{ textAlign: 'center', color: '#52c41a', fontSize: 16 }}>
          <TrophyOutlined style={{ marginRight: 4 }} />
          目标达成！
        </div>
      )}
    </Card>
  );
}; 
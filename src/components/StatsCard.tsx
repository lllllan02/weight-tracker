import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { WeightStats } from '../types';

interface StatsCardProps {
  stats: WeightStats;
  height: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, height }) => {
  const getChangeIcon = () => {
    if (stats.change > 0) return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
    if (stats.change < 0) return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
    return <MinusOutlined style={{ color: '#8c8c8c' }} />;
  };

  const getChangeColor = () => {
    if (stats.change > 0) return '#ff4d4f';
    if (stats.change < 0) return '#52c41a';
    return '#8c8c8c';
  };

  const getBMIColor = () => {
    if (stats.bmi < 18.5) return '#1890ff';
    if (stats.bmi < 24) return '#52c41a';
    if (stats.bmi < 28) return '#faad14';
    return '#ff4d4f';
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '正常';
    if (bmi < 28) return '偏胖';
    return '肥胖';
  };

  return (
    <div className="stats-grid">
      <Card>
        <Statistic
          title="当前体重"
          value={stats.current}
          suffix="kg"
          valueStyle={{ color: '#1890ff' }}
        />
        {stats.change !== 0 && (
          <div style={{ marginTop: 8, fontSize: 14, color: getChangeColor() }}>
            {getChangeIcon()} {stats.change > 0 ? '+' : ''}{stats.change} kg
          </div>
        )}
      </Card>

      <Card>
        <Statistic
          title="平均体重"
          value={stats.average}
          suffix="kg"
          valueStyle={{ color: '#722ed1' }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          历史平均
        </div>
      </Card>

      <Card>
        <Statistic
          title="BMI 指数"
          value={stats.bmi}
          valueStyle={{ color: getBMIColor() }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: getBMIColor() }}>
          {getBMICategory(stats.bmi)}
        </div>
      </Card>

      <Card>
        <Statistic
          title="体重范围"
          value={`${stats.min} - ${stats.max}`}
          suffix="kg"
          valueStyle={{ color: '#13c2c2' }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          最高 - 最低
        </div>
      </Card>
    </div>
  );
}; 
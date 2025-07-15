import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, Empty } from 'antd';
import { ChartData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightChartProps {
  chartData: ChartData;
}

export const WeightChart: React.FC<WeightChartProps> = ({ chartData }) => {
  if (!chartData || chartData.labels.length === 0) {
    return (
      <Card className="chart-container">
        <Empty
          description="暂无体重数据"
        >
          <span style={{ color: '#8c8c8c' }}>开始记录体重来查看趋势图</span>
        </Empty>
      </Card>
    );
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '体重变化趋势',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `体重: ${context.parsed.y} kg`;
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '日期',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '体重 (kg)',
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <Card className="chart-container">
      <Line options={options} data={chartData} />
    </Card>
  );
}; 
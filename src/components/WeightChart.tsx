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

  // 添加零线数据集
  const chartDataWithZeroLine = {
    ...chartData,
    datasets: [
      ...chartData.datasets,
      {
        label: '零线 (无变化)',
        data: chartData.labels.map(() => 0), // 所有点都是0
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        fill: false,
        yAxisID: 'y2',
        pointRadius: 0, // 不显示点
        pointHoverRadius: 0, // 悬停时不显示点
        showLine: true,
        hidden: false, // 确保显示
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          filter: function(legendItem: any, chartData: any) {
            // 隐藏零线在图例中的显示
            return legendItem.text !== '零线 (无变化)';
          }
        }
      },
      title: {
        display: true,
        text: '体重、BMI和变化速度趋势',
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
            const dataset = context.dataset;
            if (dataset.label === '体重 (kg)') {
              return `体重: ${context.parsed.y} kg`;
            } else if (dataset.label === 'BMI') {
              return `BMI: ${context.parsed.y}`;
            } else if (dataset.label === '变化速度 (kg/天)') {
              return `变化速度: ${context.parsed.y} kg/天`;
            }
            return `${dataset.label}: ${context.parsed.y}`;
          }
        }
      },
      // 移除annotation插件配置，使用数据集方式绘制零线
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '体重 (kg)',
        },
        beginAtZero: false,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'BMI',
        },
        beginAtZero: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '变化速度 (kg/天)',
        },
        beginAtZero: false,
        grid: {
          drawOnChartArea: false,
        },
        // 设置轴的范围，使0作为中准线
        min: -2,
        max: 2,
        // 自定义刻度，确保0在中间
        ticks: {
          stepSize: 0.5,
          // 确保包含0刻度
          values: [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2],
          callback: function(value: any) {
            return value + ' kg/天';
          }
        }
      },
    },
  };

  return (
    <Card className="chart-container">
      <Line options={options} data={chartDataWithZeroLine} />
    </Card>
  );
}; 
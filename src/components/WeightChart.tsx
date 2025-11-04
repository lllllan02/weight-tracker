import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Card, Empty } from "antd";
import { ChartData } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightChartProps {
  chartData: ChartData;
  height: number; // 用户身高，单位：厘米
}

export const WeightChart: React.FC<WeightChartProps> = ({ chartData, height }) => {
  if (!chartData || chartData.labels.length === 0) {
    return (
      <Card className="chart-container">
        <Empty description="暂无体重数据">
          <span style={{ color: "#8c8c8c" }}>开始记录体重来查看趋势图</span>
        </Empty>
      </Card>
    );
  }

  // 添加零线数据集
  const chartDataWithZeroLine = {
    ...chartData,
    datasets: [
      ...chartData.datasets.map(dataset => {
        if (dataset.label === "体重 (kg)") {
          return { ...dataset, label: "体重 (斤)" };
        }
        return dataset;
      }),
      {
        label: "零线 (无变化)",
        data: chartData.labels.map(() => 0), // 所有点都是0
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        fill: false,
        yAxisID: "y2",
        pointRadius: 0, // 不显示点
        pointHoverRadius: 0, // 悬停时不显示点
        showLine: true,
        hidden: false, // 确保显示
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "体重趋势",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            const dataset = context.dataset;
            if (dataset.label === "体重 (斤)") {
              // 将斤转换回公斤计算BMI
              const weightInKg = context.parsed.y / 2;
              const bmi = (weightInKg / Math.pow(height / 100, 2)).toFixed(1);
              return [`体重: ${context.parsed.y.toFixed(1)} 斤`, `BMI: ${bmi}`];
            } else if (dataset.label === "体重变化") {
              const value = context.parsed.y;
              return `变化: ${value > 0 ? "+" : ""}${value.toFixed(1)} 斤`;
            }
            return `${dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "日期",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "体重 (斤)",
        },
        beginAtZero: false,
      },
      y2: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "体重变化 (斤)",
        },
        grid: {
          drawOnChartArea: false,
        },
        // 设置轴的范围，使0作为中准线（斤的范围是公斤的2倍）
        min: -4,
        max: 4,
        // 自定义刻度，确保0在中间
        ticks: {
          stepSize: 1,
          callback: function (value: any) {
            return (value > 0 ? "+" : "") + value + " 斤";
          },
        },
      },
    },
  };

  return (
    <Card className="chart-container">
      <Chart type="bar" options={options} data={chartDataWithZeroLine} />
    </Card>
  );
};

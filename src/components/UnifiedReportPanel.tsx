import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  message,
  Alert,
  Spin,
  Empty,
} from "antd";
import {
  RobotOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import "chartjs-adapter-date-fns";
import { Chart } from "react-chartjs-2";
import { Report, AIAnalysis, TargetPrediction } from "../types";
import {
  generateWeeklyAIAnalysis,
  generateMonthlyAIAnalysis,
  generateAllTimeAIAnalysis,
} from "../utils/api";

ChartJS.register(
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const { Text, Title } = Typography;

interface UnifiedReportPanelProps {
  report: Report;
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  height?: number; // 用户身高，用于计算 BMI
  targetPrediction?: TargetPrediction; // 趋势预测数据
  targetWeight?: number; // 目标体重
}

export const UnifiedReportPanel: React.FC<UnifiedReportPanelProps> = ({
  report,
  loading = false,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
  height = 170, // 默认身高
  targetPrediction,
  targetWeight,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (report.aiAnalysis) {
      setAiAnalysis(report.aiAnalysis);
    } else {
      setAiAnalysis(null);
    }
  }, [report]);

  const getChangeColor = (change: number) => {
    if (change > 0) return "#ff4d4f";
    if (change < 0) return "#52c41a";
    return "#8c8c8c";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return "↗";
    if (change < 0) return "↘";
    return "→";
  };

  const generateChartData = () => {
    if (!report.records || report.records.length === 0) {
      return null;
    }

    const sortedRecords = [...report.records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 使用时间戳作为 x 轴数据
    const weightData = sortedRecords.map((record) => ({
      x: new Date(record.date).getTime(),
      y: record.weight,
    }));

    // 使用后端返回的每日净热量
    // 只显示标记为完整记录的日期（isComplete === true）
    const calorieData = sortedRecords.map((record) => {
      const netCalories = (record as any).netCalories;
      const isComplete = (record as any).isComplete;
      
      // 只有标记为完整记录且有净热量数据时才显示柱子
      const displayValue = (isComplete && netCalories !== null && netCalories !== undefined) ? netCalories : null;
      
      return {
        x: new Date(record.date).getTime(),
        y: displayValue,
      };
    });

    // 根据净热量设置颜色（黄色正值，绿色负值）
    const calorieColors = calorieData.map((item) => {
      if (item.y === null) return "rgba(140, 140, 140, 0.6)"; // 未完整记录 - 灰色
      if (item.y > 0) return "rgba(255, 214, 102, 0.6)"; // 黄色 - 热量盈余
      if (item.y < 0) return "rgba(115, 209, 61, 0.6)"; // 绿色 - 热量亏损
      return "rgba(140, 140, 140, 0.6)"; // 灰色 - 平衡
    });

    // 计算7日移动平均线
    const movingAverageData = sortedRecords.map((record, index) => {
      const startIndex = Math.max(0, index - 6);
      const recentRecords = sortedRecords.slice(startIndex, index + 1);
      const average = recentRecords.reduce((sum, r) => sum + r.weight, 0) / recentRecords.length;
      return {
        x: new Date(record.date).getTime(),
        y: Number(average.toFixed(1)),
      };
    });

    // 识别异常波动点（单日变化 > 4斤）
    const anomalyPoints: Array<{ x: number; y: number; change: number }> = [];
    for (let i = 1; i < sortedRecords.length; i++) {
      const change = Math.abs(sortedRecords[i].weight - sortedRecords[i - 1].weight);
      if (change > 4) { // 4斤
        anomalyPoints.push({
          x: new Date(sortedRecords[i].date).getTime(),
          y: sortedRecords[i].weight,
          change: change,
        });
      }
    }

    // 计算时间范围
    let chartMinTime: number;
    let chartMaxTime: number;

    if (report.type === "weekly") {
      // 周报：显示完整的周一到周日
      // 从 period 中解析周的起始和结束日期
      const periodParts = report.period.split(" - ");
      if (periodParts.length === 2) {
        // 支持中文格式 "2025/10/20" 和标准格式
        const startDate = new Date(periodParts[0].replace(/\//g, '-'));
        const endDate = new Date(periodParts[1].replace(/\//g, '-'));
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          chartMinTime = startDate.getTime();
          chartMaxTime = endDate.getTime();
        } else {
          // 解析失败，使用数据范围
          chartMinTime = weightData[0].x;
          chartMaxTime = weightData[weightData.length - 1].x;
        }
      } else {
        // 兜底：使用数据范围
        chartMinTime = weightData[0].x;
        chartMaxTime = weightData[weightData.length - 1].x;
      }
    } else if (report.type === "monthly") {
      // 月报：显示完整的月份（1号到月底）
      const match = report.period.match(/(\d{4})年(\d{1,2})月/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript月份从0开始
        const startDate = new Date(year, month, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // 月底最后一天
        chartMinTime = startDate.getTime();
        chartMaxTime = endDate.getTime();
      } else {
        // 兜底：使用数据范围
        chartMinTime = weightData[0].x;
        chartMaxTime = weightData[weightData.length - 1].x;
      }
    } else {
      // 全时段报告：使用数据范围
      chartMinTime = weightData[0].x;
      chartMaxTime = weightData[weightData.length - 1].x;
    }

    // 零线数据（覆盖整个时间范围）
    const zeroLineData = [
      { x: chartMinTime, y: 0 },
      { x: chartMaxTime, y: 0 },
    ];

    // 准备数据集
    const datasets: any[] = [
      {
        type: "line" as const,
        label: "体重 (斤)",
        data: weightData,
        borderColor: "#1890ff",
        backgroundColor: "rgba(24, 144, 255, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line" as const,
        label: "7日移动平均",
        data: movingAverageData,
        borderColor: "#722ed1",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [8, 4],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: "y",
        order: 3,
      },
      {
        type: "scatter" as const,
        label: "异常波动",
        data: anomalyPoints,
        backgroundColor: "#ff4d4f",
        borderColor: "#fff",
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: "triangle",
        yAxisID: "y",
        order: 1,
      },
      {
        type: "bar" as const,
        label: "每日净热量",
        data: calorieData,
        backgroundColor: calorieColors,
        borderColor: calorieColors.map((color) => color.replace("0.6", "1")),
        borderWidth: 1,
        yAxisID: "y2",
        order: 4,
      },
      {
        type: "line" as const,
        label: "零线 (无变化)",
        data: zeroLineData,
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        fill: false,
        yAxisID: "y2",
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 5,
      },
    ];


    // 计算自然周边界（周一00:00）
    const weekBoundaries: number[] = [];
    const startDate = new Date(chartMinTime);
    const endDate = new Date(chartMaxTime);
    
    // 找到第一个周一
    let currentDate = new Date(startDate);
    const dayOfWeek = currentDate.getDay();
    // 调整到下一个周一（如果不是周一的话）
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : (8 - dayOfWeek);
    currentDate.setDate(currentDate.getDate() + daysToMonday);
    currentDate.setHours(0, 0, 0, 0);
    
    // 收集所有周一的时间戳
    while (currentDate <= endDate) {
      weekBoundaries.push(currentDate.getTime());
      currentDate.setDate(currentDate.getDate() + 7); // 下一个周一
    }

    return {
      chartData: {
        datasets,
      },
      timeRange: { min: chartMinTime, max: chartMaxTime },
      anomalyCount: anomalyPoints.length,
      anomalyPoints: anomalyPoints,
      weekBoundaries: weekBoundaries,
    };
  };

  const chartResult = generateChartData();
  const chartData = chartResult?.chartData;

  const handleGenerateAIAnalysis = async () => {
    setAiLoading(true);
    try {
      let result;
      const force = !!aiAnalysis;

      if (report.type === "weekly") {
        const dateStr = report.period.split(" - ")[0].replace(/\//g, "-");
        result = await generateWeeklyAIAnalysis(force, dateStr);
      } else if (report.type === "monthly") {
        const match = report.period.match(/(\d{4})年(\d{1,2})月/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          result = await generateMonthlyAIAnalysis(force, year, month);
        } else {
          throw new Error("无法解析报告日期");
        }
      } else {
        // all-time
        result = await generateAllTimeAIAnalysis(force);
      }

      setAiAnalysis(result);
      message.success(force ? "AI 分析已重新生成！" : "AI 分析生成成功！");
    } catch (error) {
      message.error("生成 AI 分析失败，请稍后重试");
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!report || report.records.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>
                暂无数据
              </div>
              <div style={{ fontSize: 14, color: "#999" }}>
                开始记录体重，查看健康趋势
              </div>
            </div>
          }
          style={{ padding: "60px 0" }}
        />
      </Card>
    );
  }

  return (
    <div>
      {/* 报告时间段和导航 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {onPrevious && (
          <Button
            icon={<LeftOutlined />}
            onClick={onPrevious}
            disabled={!canGoPrevious}
            title={report.type === "weekly" ? "上一周" : "上一月"}
          >
            {report.type === "weekly" ? "上一周" : "上一月"}
          </Button>
        )}
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#1890ff",
          }}
        >
          {report.period}
        </div>
        {onNext && (
          <Button
            icon={<RightOutlined />}
            onClick={onNext}
            disabled={!canGoNext}
            title={report.type === "weekly" ? "下一周" : "下一月"}
          >
            {report.type === "weekly" ? "下一周" : "下一月"}
          </Button>
        )}
      </div>

      {/* 数据统计 */}
      <div
        style={{
          background: "#fafafa",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            marginBottom: 16,
          }}
        >
          <div>
            <Text type="secondary">起始体重</Text>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              {report.stats.startWeight.toFixed(1)}斤
            </div>
          </div>
          
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div>
                <Text type="secondary">当前体重</Text>
                <div style={{ fontSize: 18, fontWeight: 500 }}>
                  {report.stats.endWeight.toFixed(1)}斤
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: getChangeColor(report.stats.change),
                }}
              >
                {getChangeIcon(report.stats.change)}{" "}
                {report.stats.change > 0 ? "+" : ""}
                {report.stats.change.toFixed(1)}斤
              </div>
            </div>
          </div>
          
          <div>
            <Text type="secondary">BMI 指数</Text>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              {report.stats.bmi}
            </div>
          </div>
          
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div>
                <Text type="secondary">运动统计</Text>
                <div style={{ fontSize: 18, fontWeight: 500 }}>
                  {report.stats.exerciseCount}次
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                {report.stats.exerciseDuration}分钟
              </div>
            </div>
          </div>
        </div>

        {/* 体重趋势图（包含7日平均线和异常波动标记） */}
        <div style={{ marginBottom: 16, marginTop: 16 }}>
          {chartData ? (
            <div style={{ height: 350 }}>
              <Chart
                type="bar"
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    annotation: {
                      annotations: chartResult?.weekBoundaries?.reduce((acc: any, timestamp: number, index: number) => {
                        acc[`week${index}`] = {
                          type: 'line',
                          xMin: timestamp,
                          xMax: timestamp,
                          borderColor: 'rgba(0, 0, 0, 0.15)',
                          borderWidth: 1,
                          borderDash: [5, 5],
                          label: {
                            display: false,
                          },
                        };
                        return acc;
                      }, {}) || {},
                    },
                    legend: {
                      display: true,
                      position: "top",
                      labels: {
                        filter: function(item: any, chart: any) {
                          // 只显示有数据的数据集
                          const dataset = chart.datasets[item.datasetIndex];
                          return dataset && dataset.data && dataset.data.length > 0;
                        }
                      }
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      callbacks: {
                        label: function (context: any) {
                          const dataset = context.dataset;
                          if (dataset.label === "体重 (斤)") {
                            // 将斤转换回公斤计算BMI
                            const weightInKg = context.parsed.y / 2;
                            const bmi = (
                              weightInKg /
                              Math.pow(height / 100, 2)
                            ).toFixed(1);
                            return [
                              `体重: ${context.parsed.y.toFixed(1)} 斤`,
                              `BMI: ${bmi}`,
                            ];
                          } else if (dataset.label === "7日移动平均") {
                            return `7日平均: ${context.parsed.y.toFixed(1)} 斤`;
                          } else if (dataset.label === "异常波动") {
                            const point = context.raw;
                            return [
                              `⚠️ 异常波动`,
                              `体重: ${point.y.toFixed(1)} 斤`,
                              `单日变化: ${point.change?.toFixed(1)} 斤`,
                            ];
                          } else if (dataset.label === "每日净热量") {
                            const value = context.parsed.y;
                            if (value === null || value === undefined) {
                              return `净热量: 未标记完整`;
                            }
                            return `净热量: ${value > 0 ? "+" : ""}${value.toFixed(0)} 千卡`;
                          }
                          return `${dataset.label}: ${context.parsed.y}`;
                        },
                      },
                    },
                  },
                  interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                  },
                  scales: {
                    x: {
                      type: "time",
                      display: true,
                      title: {
                        display: true,
                        text: "日期",
                      },
                      min: chartResult?.timeRange?.min,
                      max: chartResult?.timeRange?.max,
                      offset: false,
                      bounds: "ticks",
                      time: {
                        unit: (() => {
                          if (report.type === "weekly") return "day";
                          if (report.type === "monthly") return "day";
                          // 全时段：根据数据跨度智能选择
                          if (report.records.length > 0) {
                            const sortedRecords = [...report.records].sort(
                              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                            );
                            const timeSpan = new Date(sortedRecords[sortedRecords.length - 1].date).getTime() - 
                                           new Date(sortedRecords[0].date).getTime();
                            const days = timeSpan / (1000 * 60 * 60 * 24);
                            
                            if (days <= 31) return "day";      // 1个月内：按天
                            if (days <= 90) return "week";     // 3个月内：按周
                            if (days <= 365) return "month";   // 1年内：按月
                            return "month";                     // 超过1年：按月
                          }
                          return "day";
                        })(),
                        displayFormats: {
                          day: "M/d",
                          week: "M/d",
                          month: "yyyy/M",
                        },
                        tooltipFormat: "yyyy年M月d日 HH:mm",
                      },
                      ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: report.type === "weekly" ? false : true,
                        autoSkipPadding: report.type === "monthly" ? 5 : 10,
                        maxTicksLimit: report.type === "weekly" 
                          ? 7 
                          : report.type === "monthly" 
                          ? 15
                          : report.records.length < 30 
                          ? 10 
                          : report.records.length < 100 
                          ? 15 
                          : 20,
                        source: "auto",
                      },
                      grid: {
                        display: false, // 隐藏X轴网格线，使用周分割线代替
                        offset: false,
                      },
                    },
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: {
                        display: true,
                        text: "体重 (斤)",
                      },
                      beginAtZero: false,
                    },
                    y2: {
                      type: "linear",
                      display: true,
                      position: "right",
                      title: {
                        display: true,
                        text: "净热量 (千卡)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                      min: -2000,
                      max: 2000,
                      ticks: {
                        stepSize: 500,
                        callback: function (value: any) {
                          return (value > 0 ? "+" : "") + value;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <Empty description="暂无体重数据" />
          )}
        </div>

        {/* AI 分析 */}
        <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>
              <RobotOutlined /> AI 智能分析
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              AI 会分析体重趋势、运动数据、波动规律等，给出个性化建议
            </Text>
          </div>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleGenerateAIAnalysis}
            loading={aiLoading}
            size="small"
          >
            {aiAnalysis ? "重新生成分析" : "生成 AI 分析"}
          </Button>
        </div>

        {aiAnalysis ? (
          <div>
            <Alert
              message={aiAnalysis.summary}
              type="info"
              style={{ marginBottom: 12 }}
            />

            <div style={{ marginBottom: 12 }}>
              <Text strong>分析洞察：</Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {aiAnalysis.insights.map((insight, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Text strong>改进建议：</Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {aiAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {aiAnalysis.generatedAt && (
              <Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 12, display: "block" }}
              >
                生成于:{" "}
                {new Date(aiAnalysis.generatedAt).toLocaleString("zh-CN")}
              </Text>
            )}
          </div>
        ) : (
          <Alert
            message="点击上方按钮生成 AI 智能分析"
            type="info"
            showIcon
          />
        )}
        </div>
      </div>
    </div>
  );
};


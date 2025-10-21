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
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Report, AIAnalysis } from "../types";
import {
  generateWeeklyAIAnalysis,
  generateMonthlyAIAnalysis,
  generateAllTimeAIAnalysis,
} from "../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
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
}

export const UnifiedReportPanel: React.FC<UnifiedReportPanelProps> = ({
  report,
  loading = false,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
  height = 170, // 默认身高
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

    const labels = sortedRecords.map((record) => {
      const date = new Date(record.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const weights = sortedRecords.map((record) => record.weight);

    // 计算体重变化（与前一天的差值）
    const changes = sortedRecords.map((record, index) => {
      if (index === 0) return 0;
      return Number((record.weight - sortedRecords[index - 1].weight).toFixed(1));
    });

    // 根据变化值设置颜色（红色增加，绿色减少）
    const changeColors = changes.map((change) => {
      if (change > 0) return "rgba(255, 77, 79, 0.6)"; // 红色
      if (change < 0) return "rgba(82, 196, 26, 0.6)"; // 绿色
      return "rgba(140, 140, 140, 0.6)"; // 灰色
    });

    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: "体重 (kg)",
          data: weights,
          borderColor: "#1890ff",
          backgroundColor: "rgba(24, 144, 255, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y",
        },
        {
          type: "bar" as const,
          label: "体重变化",
          data: changes,
          backgroundColor: changeColors,
          borderColor: changeColors.map((color) => color.replace("0.6", "1")),
          borderWidth: 1,
          yAxisID: "y2",
        },
        {
          type: "line" as const,
          label: "零线 (无变化)",
          data: labels.map(() => 0),
          borderColor: "#f59e0b",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0,
          fill: false,
          yAxisID: "y2",
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  };

  const chartData = generateChartData();

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
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
          暂无数据
        </div>
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
              {report.stats.startWeight}kg
            </div>
          </div>
          
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div>
                <Text type="secondary">当前体重</Text>
                <div style={{ fontSize: 18, fontWeight: 500 }}>
                  {report.stats.endWeight}kg
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
                {report.stats.change}kg
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

        {/* 体重趋势图 */}
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
                    legend: {
                      display: true,
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      callbacks: {
                        label: function (context: any) {
                          const dataset = context.dataset;
                          if (dataset.label === "体重 (kg)") {
                            const bmi = (
                              context.parsed.y /
                              Math.pow(height / 100, 2)
                            ).toFixed(1);
                            return [
                              `体重: ${context.parsed.y} kg`,
                              `BMI: ${bmi}`,
                            ];
                          } else if (dataset.label === "体重变化") {
                            const value = context.parsed.y;
                            return `变化: ${value > 0 ? "+" : ""}${value} kg`;
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
                      display: true,
                      title: {
                        display: true,
                        text: "日期",
                      },
                    },
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: {
                        display: true,
                        text: "体重 (kg)",
                      },
                      beginAtZero: false,
                    },
                    y2: {
                      type: "linear",
                      display: true,
                      position: "right",
                      title: {
                        display: true,
                        text: "体重变化 (kg)",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                      min: -2,
                      max: 2,
                      ticks: {
                        stepSize: 0.5,
                        callback: function (value: any) {
                          return (value > 0 ? "+" : "") + value + " kg";
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
          <Title level={5}>
            <RobotOutlined /> AI 分析
          </Title>
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


import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Table,
  Tag,
  Alert,
  Spin,
  Empty,
  Statistic,
  Row,
  Col,
  Divider,
} from "antd";
import {
  FireOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  getWeeklyCalorieDeficitAnalysis,
  getMonthlyCalorieDeficitAnalysis,
} from "../utils/api";

const { Title, Text, Paragraph } = Typography;

interface PeriodData {
  weekLabel?: string;
  monthLabel?: string;
  startWeight: number | null;
  endWeight: number | null;
  weightChange: number | null;
  totalNetCalories: number | null;
  avgDailyDeficit: number | null;
  validDays: number;
  completeDays: number;
  totalDays: number;
  theoreticalWeightChange?: number | null;
  actualWeightChange?: number | null;
  accuracy?: number | null;
}

interface CorrelationAnalysis {
  correlation: number | null;
  correlationStrength: string | null;
  interpretation: string;
  dataPoints: number;
  analysis: PeriodData[];
}

interface AnalysisData {
  type: "weekly" | "monthly";
  weeklyData?: PeriodData[];
  monthlyData?: PeriodData[];
  correlationAnalysis: CorrelationAnalysis;
}

export const CalorieDeficitAnalysisCard: React.FC<{
  type: "weekly" | "monthly";
}> = ({ type }) => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [type]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        type === "weekly"
          ? await getWeeklyCalorieDeficitAnalysis()
          : await getMonthlyCalorieDeficitAnalysis();
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.message || "加载分析数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (correlation: number | null) => {
    if (correlation === null) return "default";
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return "success";
    if (abs >= 0.4) return "warning";
    if (abs >= 0.2) return "processing";
    return "default";
  };

  const formatCalories = (calories: number | null) => {
    if (calories === null) return "-";
    return `${calories > 0 ? "+" : ""}${calories.toLocaleString()}`;
  };

  const formatWeight = (weight: number | null) => {
    if (weight === null) return "-";
    return `${weight}斤`;
  };

  const formatWeightChange = (change: number | null) => {
    if (change === null) return "-";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}斤`;
  };

  if (loading) {
    return (
      <Card>
        <Spin size="large" style={{ display: "block", textAlign: "center", padding: 40 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message="加载失败" description={error} type="error" showIcon />
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  const periodData = type === "weekly" ? analysisData.weeklyData : analysisData.monthlyData;
  const correlation = analysisData.correlationAnalysis;

  const columns = [
    {
      title: type === "weekly" ? "周期" : "月份",
      dataIndex: type === "weekly" ? "weekLabel" : "monthLabel",
      key: "period",
      width: 120,
    },
    {
      title: "起始体重",
      dataIndex: "startWeight",
      key: "startWeight",
      render: (weight: number | null) => formatWeight(weight),
      width: 100,
    },
    {
      title: "结束体重",
      dataIndex: "endWeight",
      key: "endWeight",
      render: (weight: number | null) => formatWeight(weight),
      width: 100,
    },
    {
      title: "体重变化",
      dataIndex: "weightChange",
      key: "weightChange",
      render: (change: number | null) => {
        if (change === null) return "-";
        const color = change > 0 ? "#ff4d4f" : change < 0 ? "#52c41a" : "#8c8c8c";
        return <Text style={{ color }}>{formatWeightChange(change)}</Text>;
      },
      width: 100,
    },
    {
      title: "总热量缺口",
      dataIndex: "totalNetCalories",
      key: "totalNetCalories",
      render: (calories: number | null) => {
        if (calories === null) return "-";
        const color = calories < 0 ? "#52c41a" : calories > 0 ? "#ff4d4f" : "#8c8c8c";
        return <Text style={{ color }}>{formatCalories(calories)} kcal</Text>;
      },
      width: 120,
    },
    {
      title: "日均缺口",
      dataIndex: "avgDailyDeficit",
      key: "avgDailyDeficit",
      render: (deficit: number | null) => {
        if (deficit === null) return "-";
        const color = deficit < 0 ? "#52c41a" : deficit > 0 ? "#ff4d4f" : "#8c8c8c";
        return <Text style={{ color }}>{formatCalories(deficit)} kcal</Text>;
      },
      width: 120,
    },
    {
      title: "有效天数",
      dataIndex: "validDays",
      key: "validDays",
      render: (valid: number, record: PeriodData) => (
        <Text>
          {valid}/{record.totalDays}
        </Text>
      ),
      width: 100,
    },
  ];

  // 如果有理论值对比，添加额外列
  if (correlation.analysis && correlation.analysis.length > 0 && correlation.analysis[0].theoreticalWeightChange !== undefined) {
    columns.push({
      title: "理论变化",
      dataIndex: "theoreticalWeightChange",
      key: "theoreticalWeightChange",
      render: (change: number | null) => formatWeightChange(change),
      width: 100,
    });
    columns.push({
      title: "准确度",
      dataIndex: "accuracy",
      key: "accuracy",
      render: (accuracy: number | null) => {
        if (accuracy === null) return "-";
        const color = accuracy >= 80 ? "#52c41a" : accuracy >= 60 ? "#faad14" : "#ff4d4f";
        return <Tag color={color}>{accuracy}%</Tag>;
      },
      width: 100,
    });
  }

  return (
    <Card
      title={
        <span>
          <FireOutlined style={{ marginRight: 8 }} />
          {type === "weekly" ? "每周" : "每月"}热量缺口与体重变化分析
        </span>
      }
    >
      {/* 相关性分析摘要 */}
      {correlation.correlation !== null && (
        <div style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="相关系数"
                value={correlation.correlation}
                precision={3}
                valueStyle={{
                  color: correlation.correlation > 0 ? "#52c41a" : "#ff4d4f",
                }}
                prefix={<LineChartOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="相关性强度"
                value={correlation.correlationStrength || "无"}
                valueStyle={{
                  color:
                    correlation.correlationStrength === "强相关"
                      ? "#52c41a"
                      : correlation.correlationStrength === "中等相关"
                      ? "#faad14"
                      : "#8c8c8c",
                }}
                prefix={
                  correlation.correlationStrength === "强相关" ? (
                    <CheckCircleOutlined />
                  ) : (
                    <WarningOutlined />
                  )
                }
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="数据点数"
                value={correlation.dataPoints}
                suffix="个周期"
              />
            </Col>
          </Row>

          <Divider />

          <Alert
            message="相关性分析"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  {correlation.interpretation}
                </Paragraph>
                {correlation.correlation !== null && (
                  <div>
                    <Tag color={getCorrelationColor(correlation.correlation)}>
                      相关系数: {correlation.correlation.toFixed(3)}
                    </Tag>
                    {Math.abs(correlation.correlation) >= 0.7 && (
                      <Tag color="success">
                        <CheckCircleOutlined /> 热量记录准确
                      </Tag>
                    )}
                    {Math.abs(correlation.correlation) < 0.4 && correlation.correlation !== 0 && (
                      <Tag color="warning">
                        <WarningOutlined /> 建议检查热量记录准确性
                      </Tag>
                    )}
                  </div>
                )}
              </div>
            }
            type={
              correlation.correlation !== null && Math.abs(correlation.correlation) >= 0.7
                ? "success"
                : correlation.correlation !== null && Math.abs(correlation.correlation) >= 0.4
                ? "info"
                : "warning"
            }
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )}

      {correlation.correlation === null && (
        <Alert
          message="数据不足"
          description={correlation.interpretation}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 详细数据表格 */}
      {(() => {
        // 如果有相关性分析数据，使用分析数据（包含理论体重变化），否则使用原始数据
        const tableData = correlation.analysis && correlation.analysis.length > 0
          ? correlation.analysis
          : periodData || [];
        
        return tableData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={tableData.map((item, index) => ({
              ...item,
              key: index,
            }))}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 800 }}
          />
        ) : (
          <Empty description="暂无数据" />
        );
      })()}

      {/* 说明 */}
      <Divider />
      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
        <Paragraph style={{ marginBottom: 4 }}>
          <strong>说明：</strong>
        </Paragraph>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            热量缺口 = 摄入热量 - (基础代谢 + 运动消耗)，负值表示缺口，正值表示盈余
          </li>
          <li>
            理论体重变化 = 总热量缺口 ÷ 7700 × 2（1kg脂肪≈7700kcal，体重单位为斤）
          </li>
          <li>
            相关系数接近1表示热量缺口与体重变化正相关，说明热量记录较准确
          </li>
          <li>准确度 = 理论值与实际值的匹配程度，越高说明热量记录越准确</li>
        </ul>
      </div>
    </Card>
  );
};

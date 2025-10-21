import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Divider,
  message,
  Alert,
  Spin,
  Tag,
} from "antd";
import {
  RobotOutlined,
  BulbOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Report, AIAnalysis } from "../types";
import {
  generateWeeklyAIAnalysis,
  generateMonthlyAIAnalysis,
  generateAllTimeAIAnalysis,
} from "../utils/api";

const { Text, Title } = Typography;

interface UnifiedReportPanelProps {
  report: Report;
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export const UnifiedReportPanel: React.FC<UnifiedReportPanelProps> = ({
  report,
  loading = false,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
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

        <Divider />

        {/* 系统洞察 */}
        <div style={{ marginBottom: 16 }}>
        <Title level={5}>
          <BulbOutlined /> 数据概览
        </Title>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {report.insights.map((insight, index) => (
            <Tag key={index} color="blue">
              {insight}
            </Tag>
          ))}
          </div>
        </div>

        <Divider />

        {/* AI 分析 */}
        <div>
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


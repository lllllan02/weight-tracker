import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Typography,
  Divider,
  message,
  Alert,
  Spin,
  Tag,
} from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  TrophyOutlined,
  RiseOutlined,
  RobotOutlined,
  BulbOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Report, AIAnalysis } from "../types";
import {
  generateWeeklyAIAnalysis,
  generateMonthlyAIAnalysis,
} from "../utils/api";

const { Text, Title } = Typography;

interface ReportCardProps {
  report: Report;
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  loading = false,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 当报告加载时，检查是否有已保存的 AI 分析
  useEffect(() => {
    if (report.aiAnalysis) {
      setAiAnalysis(report.aiAnalysis);
    } else {
      setAiAnalysis(null);
    }
  }, [report]);

  const getReportIcon = () => {
    return report.type === "weekly" ? (
      <CalendarOutlined />
    ) : (
      <FileTextOutlined />
    );
  };

  const getReportTitle = () => {
    return report.type === "weekly" ? "周报" : "月报";
  };

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

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleGenerateAIAnalysis = async () => {
    setAiLoading(true);
    try {
      let result;
      const force = !!aiAnalysis; // 如果已有分析，则强制重新生成
      
      if (report.type === "weekly") {
        // 从 period 中提取日期，格式如 "2025/10/20 - 2025/10/26"
        const dateStr = report.period.split(' - ')[0].replace(/\//g, '-');
        result = await generateWeeklyAIAnalysis(force, dateStr);
      } else {
        // 从 period 中提取年月，格式如 "2025年10月"
        const match = report.period.match(/(\d{4})年(\d{1,2})月/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          result = await generateMonthlyAIAnalysis(force, year, month);
        } else {
          throw new Error("无法解析报告日期");
        }
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text strong>{report.period}</Text>
            <br />
            <Text type="secondary">记录数: {report.records.length}</Text>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: getChangeColor(report.stats.change),
              }}
            >
              {getChangeIcon(report.stats.change)}{" "}
              {report.stats.change > 0 ? "+" : ""}
              {report.stats.change}kg
            </div>
            <Text type="secondary">体重变化</Text>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {onPrevious && (
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={onPrevious}
                  size="small"
                  title={report.type === "weekly" ? "上一周" : "上一月"}
                  disabled={!canGoPrevious}
                />
              )}
              <span>
                {getReportIcon()} {getReportTitle()} - {report.period}
              </span>
              {onNext && (
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={onNext}
                  size="small"
                  title={report.type === "weekly" ? "下一周" : "下一月"}
                  disabled={!canGoNext}
                />
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button
            key="ai"
            type={aiAnalysis ? "default" : "primary"}
            icon={<RobotOutlined />}
            onClick={handleGenerateAIAnalysis}
            loading={aiLoading}
            disabled={report.records.length === 0}
          >
            {aiAnalysis ? "重新生成分析" : "生成 AI 分析"}
          </Button>,
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 16 }}>
          {/* 统计概览 - 统一网格布局 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
              padding: "16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            {/* 第一行 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                起始体重
              </div>
              <div
                style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}
              >
                {report.stats.startWeight}kg
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                结束体重
              </div>
              <div
                style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}
              >
                {report.stats.endWeight}kg
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                体重变化
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: getChangeColor(report.stats.change),
                }}
              >
                {getChangeIcon(report.stats.change)}{" "}
                {report.stats.change > 0 ? "+" : ""}
                {report.stats.change}kg
              </div>
            </div>

            {/* 第二行 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                平均体重
              </div>
              <div
                style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}
              >
                {report.stats.average}kg
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                最高体重
              </div>
              <div
                style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}
              >
                {report.stats.max}kg
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                最低体重
              </div>
              <div
                style={{ fontSize: 24, fontWeight: "bold", color: "#13c2c2" }}
              >
                {report.stats.min}kg
              </div>
            </div>
          </div>

          {/* 每周平均体重（仅月报） */}
          {report.type === "monthly" && report.stats.weeklyAverages && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>
                <RiseOutlined style={{ marginRight: 8 }} />
                每周平均体重趋势
              </Title>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {report.stats.weeklyAverages.map((avg, index) => (
                  <div key={index} style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#1890ff",
                      }}
                    >
                      {avg > 0 ? `${avg}kg` : "-"}
                    </div>
                    <Text type="secondary">第{index + 1}周</Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* AI 分析结果 */}
          {aiAnalysis ? (
            <>
              <Alert
                message={
                  <span>
                    <RobotOutlined style={{ marginRight: 8 }} />
                    AI 智能分析
                  </span>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 15 }}>
                        总结
                      </Text>
                      <div
                        style={{
                          marginTop: 8,
                          padding: "12px",
                          backgroundColor: "#f0f5ff",
                          borderRadius: "6px",
                          borderLeft: "4px solid #1890ff",
                        }}
                      >
                        <Text>{aiAnalysis.summary}</Text>
                      </div>
                    </div>

                    {aiAnalysis.insights &&
                      aiAnalysis.insights.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 15 }}>
                            <TrophyOutlined style={{ marginRight: 8 }} />
                            数据洞察
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              marginTop: 8,
                            }}
                          >
                            {aiAnalysis.insights.map((insight, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  padding: "10px 12px",
                                  backgroundColor: "#f6ffed",
                                  borderRadius: "6px",
                                  border: "1px solid #b7eb8f",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#52c41a",
                                    fontWeight: "bold",
                                    marginRight: 8,
                                    minWidth: "20px",
                                  }}
                                >
                                  {index + 1}.
                                </span>
                                <Text style={{ flex: 1, lineHeight: "1.5" }}>
                                  {insight}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {aiAnalysis.suggestions &&
                      aiAnalysis.suggestions.length > 0 && (
                        <div>
                          <Text strong style={{ fontSize: 15 }}>
                            <BulbOutlined style={{ marginRight: 8 }} />
                            个性化建议
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              marginTop: 8,
                            }}
                          >
                            {aiAnalysis.suggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  padding: "10px 12px",
                                  backgroundColor: "#fff7e6",
                                  borderRadius: "6px",
                                  border: "1px solid #ffd591",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#faad14",
                                    fontWeight: "bold",
                                    marginRight: 8,
                                    minWidth: "20px",
                                  }}
                                >
                                  {index + 1}.
                                </span>
                                <Text style={{ flex: 1, lineHeight: "1.5" }}>
                                  {suggestion}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                }
                type="info"
                style={{ marginBottom: 24 }}
              />
              <Divider />
            </>
          ) : (
            aiLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  marginBottom: 24,
                }}
              >
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">AI 正在分析您的数据...</Text>
                </div>
              </div>
            )
          )}

          {/* 记录列表 */}
          {report.records.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={5}>详细记录</Title>
                <div
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  {report.records.map((record, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderBottom:
                          index < report.records.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
                      }}
                    >
                      <div>
                        <Text strong>
                          {new Date(record.date).toLocaleDateString("zh-CN")}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {new Date(record.date).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          minWidth: 100,
                          paddingRight: 8,
                        }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {record.weight}kg
                        </Text>
                        <br />
                        <Tag
                          color={record.fasting === "空腹" ? "green" : "orange"}
                          style={{ marginTop: 4 }}
                        >
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

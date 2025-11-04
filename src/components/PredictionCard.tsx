import React, { useState } from "react";
import { Card, Tag, Empty, Descriptions, Alert, Space, Button, Tooltip, message } from "antd";
import { RiseOutlined, FallOutlined, CalendarOutlined, LineChartOutlined, DashboardOutlined, DownOutlined, UpOutlined, QuestionCircleOutlined, RobotOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { TargetPrediction, PredictionMethod } from "../types";
import dayjs from "dayjs";
import { generateAIPrediction } from "../utils/api";

interface PredictionCardProps {
  targetPrediction?: TargetPrediction;
  targetWeight?: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  targetPrediction,
  targetWeight,
}) => {
  const [showAllModels, setShowAllModels] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<PredictionMethod | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 生成 AI 预测
  const handleGenerateAIPrediction = async () => {
    setLoadingAI(true);
    try {
      const response = await generateAIPrediction();
      if (response.success) {
        setAiPrediction(response.prediction);
        message.success('AI 预测生成成功！');
      } else {
        message.error(response.error || 'AI 预测生成失败');
      }
    } catch (error: any) {
      console.error('AI 预测失败:', error);
      message.error(error.message || 'AI 预测生成失败，请稍后重试');
    } finally {
      setLoadingAI(false);
    }
  };

  if (!targetPrediction || !targetWeight) {
    return (
      <Card
        title={
          <span>
            <LineChartOutlined style={{ marginRight: 8, color: "#722ed1" }} />
            趋势预测
          </span>
        }
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
                暂无预测数据
              </div>
              <div style={{ fontSize: 13, color: "#999" }}>
                设置目标体重并记录足够的数据后，系统将自动生成趋势预测
              </div>
            </div>
          }
          style={{ padding: "20px 0" }}
        />
      </Card>
    );
  }

  if (targetPrediction.achieved) {
    return (
      <Card
        title={
          <span>
            <LineChartOutlined style={{ marginRight: 8, color: "#52c41a" }} />
            趋势预测
          </span>
        }
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <Alert
          message="🎉 恭喜！您已达成目标体重"
          type="success"
          showIcon
          style={{ marginBottom: 0 }}
        />
      </Card>
    );
  }

  const { predictions } = targetPrediction;

  if (!predictions || predictions.length === 0) {
    return (
      <Card
        title={
          <span>
            <LineChartOutlined style={{ marginRight: 8, color: "#722ed1" }} />
            趋势预测
          </span>
        }
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <Alert
          message="数据不足"
          description="需要至少2条体重记录才能生成预测。继续记录体重，系统将自动分析趋势。"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const weightDirection = targetPrediction.weightDifference! > 0 ? "增重" : "减重";
  const isGaining = targetPrediction.weightDifference! > 0;

  const TrendIcon = isGaining ? RiseOutlined : FallOutlined;
  const trendColor = isGaining ? "#fa8c16" : "#1890ff";
  
  // 如果有 AI 预测，将其插入到第一位
  const allPredictions = aiPrediction ? [aiPrediction, ...predictions] : predictions;
  
  // 只显示推荐模型或全部模型
  const displayedPredictions = showAllModels ? allPredictions : [allPredictions[0]];
  
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LineChartOutlined style={{ color: "#722ed1" }} />
          <span>达标预测</span>
          <Tag color={isGaining ? "orange" : "blue"}>
            {weightDirection}
          </Tag>
        </div>
      }
      style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* 紧凑的目标信息 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "12px 16px",
          background: "#fafafa",
          borderRadius: 8
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#999" }}>还需{weightDirection}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: isGaining ? "#fa8c16" : "#1890ff" }}>
              {Math.abs(targetPrediction.weightDifference!)}斤
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#999" }}>
              {targetPrediction.currentWeight}斤 → {targetPrediction.targetWeight}斤
            </div>
          </div>
        </div>

        {/* 预测模型 */}
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {displayedPredictions.map((pred, index) => {
            const isAI = pred.methodKey === 'ai';
            return (
              <Card
                key={index}
                size="small"
                style={{
                  background: index === 0 ? "#fafafa" : "#fff",
                  border: index === 0 ? "2px solid #722ed1" : "1px solid #f0f0f0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      {isAI && <RobotOutlined style={{ color: "#722ed1", fontSize: 16 }} />}
                      <Tag color={index === 0 ? "purple" : "default"}>
                        {pred.method}
                      </Tag>
                      {index === 0 && <Tag color="purple">推荐</Tag>}
                      {isAI && <Tag color="gold">智能</Tag>}
                      {pred.description && (
                        <Tooltip title={pred.description}>
                          <QuestionCircleOutlined style={{ color: "#999", fontSize: 14 }} />
                        </Tooltip>
                      )}
                    </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: 13 }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        预计达成：
                      </span>
                      <span style={{ fontWeight: 600, color: "#722ed1", fontSize: 13 }}>
                        {dayjs(pred.predictedDate).format("YYYY-MM-DD")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: 13 }}>还需天数：</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        {pred.daysRemaining}天
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: 13 }}>每日变化：</span>
                      <span style={{ fontWeight: 600, color: trendColor, fontSize: 13 }}>
                        {pred.dailyChange > 0 ? "+" : ""}{pred.dailyChange}斤
                      </span>
                    </div>
                  </div>
                </div>
                <TrendIcon style={{ fontSize: 16, color: trendColor, marginLeft: 8 }} />
              </div>
            </Card>
          );
          })}
        </Space>

        {/* 操作按钮区 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          {/* AI 预测按钮 */}
          {!aiPrediction && (
            <Button
              type="primary"
              size="small"
              onClick={handleGenerateAIPrediction}
              loading={loadingAI}
              icon={<ThunderboltOutlined />}
              style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none"
              }}
            >
              生成 AI 智能预测
            </Button>
          )}
          
          {/* 展开/折叠按钮 */}
          {allPredictions.length > 1 && (
            <Button
              type="link"
              size="small"
              onClick={() => setShowAllModels(!showAllModels)}
              style={{ padding: 0, height: "auto", marginLeft: aiPrediction ? 0 : "auto" }}
              icon={showAllModels ? <UpOutlined /> : <DownOutlined />}
            >
              {showAllModels ? "收起其他模型" : `查看其他${allPredictions.length - 1}个预测模型`}
            </Button>
          )}
        </div>
      </Space>
    </Card>
  );
};


import React from "react";
import { Card, Tag, Empty, Descriptions, Alert, Space } from "antd";
import { RiseOutlined, FallOutlined, CalendarOutlined, LineChartOutlined, DashboardOutlined } from "@ant-design/icons";
import { TargetPrediction } from "../types";
import dayjs from "dayjs";

interface PredictionCardProps {
  targetPrediction?: TargetPrediction;
  targetWeight?: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  targetPrediction,
  targetWeight,
}) => {
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
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 目标信息 */}
        <Descriptions column={2} size="small">
          <Descriptions.Item label="当前体重">
            {targetPrediction.currentWeight}kg
          </Descriptions.Item>
          <Descriptions.Item label="目标体重">
            {targetPrediction.targetWeight}kg
          </Descriptions.Item>
          <Descriptions.Item label={`还需${weightDirection}`} span={2}>
            <Tag color={isGaining ? "orange" : "blue"} style={{ fontSize: 14 }}>
              {Math.abs(targetPrediction.weightDifference!)}kg
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* 预测方法对比 */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#666" }}>
            <DashboardOutlined style={{ marginRight: 6 }} />
            预测模型对比
          </div>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {predictions.map((pred, index) => {
              const TrendIcon = isGaining ? RiseOutlined : FallOutlined;
              const trendColor = isGaining ? "#fa8c16" : "#1890ff";
              
              return (
                <Card
                  key={index}
                  size="small"
                  style={{
                    background: index === 0 ? "#fafafa" : "#fff",
                    border: index === 0 ? "2px solid #722ed1" : "1px solid #f0f0f0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Space>
                      <Tag color={index === 0 ? "purple" : "default"}>
                        {pred.method}
                      </Tag>
                      {index === 0 && <Tag color="purple">推荐</Tag>}
                    </Space>
                    <TrendIcon style={{ fontSize: 16, color: trendColor }} />
                  </div>
                  
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {pred.description && (
                      <div style={{ fontSize: 12, color: "#8c8c8c", fontStyle: "italic", marginBottom: 4 }}>
                        💡 {pred.description}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        预计达成日期：
                      </span>
                      <span style={{ fontWeight: 600, color: "#722ed1" }}>
                        {dayjs(pred.predictedDate).format("YYYY年MM月DD日")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>预计天数：</span>
                      <span style={{ fontWeight: 600 }}>
                        {pred.daysRemaining}天
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>平均每日变化：</span>
                      <span style={{ fontWeight: 600, color: trendColor }}>
                        {pred.dailyChange > 0 ? "+" : ""}{pred.dailyChange}kg
                      </span>
                    </div>
                    {pred.avgCalorieDeficit && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>平均热量赤字：</span>
                        <span style={{ fontWeight: 600, color: "#fa8c16" }}>
                          {pred.avgCalorieDeficit > 0 ? "+" : ""}{pred.avgCalorieDeficit} kcal/天
                        </span>
                      </div>
                    )}
                    {pred.decayFactor && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>速度衰减系数：</span>
                        <span style={{ fontWeight: 600 }}>
                          {(pred.decayFactor * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        </div>

        {/* 提示信息 */}
        <Alert
          message="预测模型说明"
          description={
            <div style={{ fontSize: 12 }}>
              <p style={{ marginBottom: 4 }}>• 动态代谢模型：考虑体重变化导致的基础代谢率变化，最科学准确</p>
              <p style={{ marginBottom: 4 }}>• 指数衰减模型：考虑减重速度逐渐放缓的生理现象</p>
              <p style={{ marginBottom: 0 }}>• 线性回归：基于历史趋势线的简单预测</p>
            </div>
          }
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />
      </Space>
    </Card>
  );
};


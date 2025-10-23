import React from "react";
import { Card, Progress, Typography, Tooltip, Empty } from "antd";
import { AimOutlined, TrophyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { WeightStats, Milestone } from "../types";
import dayjs from "dayjs";

const { Text } = Typography;

interface TargetProgressProps {
  stats: WeightStats;
  targetWeight?: number;
  milestones?: Milestone[];
}

export const TargetProgress: React.FC<TargetProgressProps> = ({
  stats,
  targetWeight,
  milestones = [],
}) => {
  if (!targetWeight || targetWeight <= 0) {
    return (
      <Card
        title={
          <span>
            <AimOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            目标进度
          </span>
        }
        style={{ marginBottom: 0 }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
                还未设置目标体重
              </div>
              <div style={{ fontSize: 13, color: "#999" }}>
                在下方"阶段目标"中添加目标，开启健康之旅
              </div>
            </div>
          }
          style={{ padding: "20px 0" }}
        />
      </Card>
    );
  }

  const getProgressColor = () => {
    if (stats.targetProgress >= 80) return "#52c41a"; // 深绿色 - 即将胜利！
    if (stats.targetProgress >= 60) return "#73d13d"; // 浅绿色 - 很棒！
    if (stats.targetProgress >= 40) return "#faad14"; // 黄色 - 加油！
    if (stats.targetProgress >= 20) return "#ff7a45"; // 橙色 - 继续努力
    return "#ff4d4f"; // 红色 - 刚开始
  };

  const getProgressStatus = () => {
    if (stats.targetProgress >= 100) return "success";
    if (stats.targetProgress >= 60) return "active";
    return "normal";
  };

  const getTargetDirection = () => {
    // 基于初始体重和目标体重的关系判断方向
    return targetWeight > stats.initialWeight ? "增重" : "减重";
  };

  const getRemainingText = () => {
    if (Math.abs(stats.targetRemaining) <= 0.5) {
      return "目标达成！";
    }
    const direction = getTargetDirection();
    return `还需${direction} ${Math.abs(stats.targetRemaining)}kg`;
  };

  // 计算阶段目标在进度条上的位置
  const calculateMilestonePosition = (milestoneWeight: number) => {
    const totalChange = Math.abs(stats.initialWeight - targetWeight);
    const milestoneChange = Math.abs(stats.initialWeight - milestoneWeight);
    return Math.min(100, (milestoneChange / totalChange) * 100);
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AimOutlined style={{ color: "#1890ff" }} />
          <span>目标进度</span>
          <span style={{ color: "#1890ff", fontWeight: "bold", marginLeft: 8 }}>
            {stats.current}kg
          </span>
          <span style={{ color: getProgressColor(), fontSize: 12 }}>
            {getRemainingText()}
          </span>
        </div>
      }
      style={{ marginBottom: 0, padding: 0 }}
      styles={{ body: { padding: 16 } }}
    >
      <div>
        {/* 进度条容器 */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          {/* 进度条 - 使用渐变色 */}
          <Progress
            percent={Math.min(100, stats.targetProgress)}
            status={getProgressStatus()}
            strokeColor={{
              '0%': stats.targetProgress < 20 ? '#ff4d4f' : 
                    stats.targetProgress < 40 ? '#ff7a45' :
                    stats.targetProgress < 60 ? '#faad14' :
                    stats.targetProgress < 80 ? '#73d13d' : '#52c41a',
              '100%': stats.targetProgress < 40 ? '#ff7a45' :
                      stats.targetProgress < 60 ? '#faad14' :
                      stats.targetProgress < 80 ? '#73d13d' : '#52c41a'
            }}
            format={(percent) => `${percent?.toFixed(1)}%`}
            showInfo={false}
            strokeWidth={12}
          />
          
          {/* 阶段目标标记 */}
          {milestones.map((milestone) => {
            const position = calculateMilestonePosition(milestone.targetWeight);
            const isAchieved = !!milestone.achievedDate;
            
            return (
              <Tooltip
                key={milestone.id}
                title={
                  <div>
                    <div>{milestone.targetWeight}kg</div>
                    {milestone.note && <div>{milestone.note}</div>}
                    {isAchieved && (
                      <div>✓ {dayjs(milestone.achievedDate).format("YYYY-MM-DD")}</div>
                    )}
                  </div>
                }
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${position}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: isAchieved ? "#52c41a" : "#fff",
                    border: `2px solid ${isAchieved ? "#52c41a" : "#1890ff"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {isAchieved && (
                    <CheckCircleOutlined
                      style={{ color: "#fff", fontSize: 12 }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* 体重范围和进度信息 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span style={{ color: "#666" }}>初始: {stats.initialWeight}kg</span>
          <span style={{ color: getProgressColor(), fontWeight: "bold" }}>
            {stats.targetProgress.toFixed(1)}% 完成
          </span>
          <span style={{ color: "#666" }}>
            目标: {targetWeight}kg ({getTargetDirection()})
          </span>
        </div>
      </div>

      {stats.targetProgress >= 100 && (
        <div style={{ textAlign: "center", color: "#52c41a", fontSize: 16 }}>
          <TrophyOutlined style={{ marginRight: 4 }} />
          目标达成！
        </div>
      )}
    </Card>
  );
};

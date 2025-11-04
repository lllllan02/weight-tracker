import React, { useState, useEffect } from "react";
import { Card, Typography, Progress, Alert, Spin, Empty, Tag } from "antd";
import {
  TrophyOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { Chart } from "react-chartjs-2";
import { getExerciseAnalysis } from "../utils/api";
import { ExerciseAnalysis } from "../types";

const { Title, Text } = Typography;

export const ExerciseEffectivenessCard: React.FC = () => {
  const [analysis, setAnalysis] = useState<ExerciseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getExerciseAnalysis();
      setAnalysis(data);
    } catch (error) {
      console.error("加载运动效果分析失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取评级颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return '#52c41a';
      case 'good': return '#1890ff';
      case 'fair': return '#faad14';
      case 'poor': return '#ff7a45';
      default: return '#d9d9d9';
    }
  };

  // 获取评级标签
  const getLevelText = (level: string) => {
    switch (level) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '尚可';
      case 'poor': return '较差';
      default: return '无数据';
    }
  };


  // 生成运动频率与体重变化关系图
  const generateFrequencyChart = () => {
    if (!analysis || analysis.frequencyImpact.periods.length === 0) {
      return null;
    }

    const periods = analysis.frequencyImpact.periods;
    
    return {
      labels: periods.map(p => `第${p.week}周`),
      datasets: [
        {
          type: 'line' as const,
          label: '体重变化 (斤)',
          data: periods.map(p => p.weightChange),
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
        },
        {
          type: 'bar' as const,
          label: '运动次数',
          data: periods.map(p => p.exerciseCount),
          backgroundColor: 'rgba(82, 196, 26, 0.6)',
          yAxisID: 'y1',
        },
      ],
    };
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

  if (!analysis) {
    return (
      <Card>
        <Empty description="加载运动效果分析失败" />
      </Card>
    );
  }

  const chartData = generateFrequencyChart();

  return (
    <Card>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
            <TrophyOutlined /> 运动效果评估
          </Title>
          {analysis.efficiencyScore.exerciseDaysPerWeek !== undefined && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              每周运动 {analysis.efficiencyScore.exerciseDaysPerWeek} 天
            </Text>
          )}
        </div>
        <Tag color={getLevelColor(analysis.efficiencyScore.level)} style={{ fontSize: 15, padding: '4px 16px' }}>
          {getLevelText(analysis.efficiencyScore.level)}
        </Tag>
      </div>

      {/* 核心评分区域 + 24小时效果 */}
      <div style={{ 
        display: 'flex', 
        gap: 20, 
        padding: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        marginBottom: 20,
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
      }}>
        {/* 总分圆环 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Progress
            type="circle"
            width={110}
            percent={analysis.efficiencyScore.score}
            strokeWidth={8}
            strokeColor={{
              '0%': '#ffffff',
              '100%': '#ffffff',
            }}
            trailColor="rgba(255, 255, 255, 0.3)"
            format={(percent) => (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{percent}</div>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', marginTop: -4 }}>总分</div>
              </div>
            )}
          />
        </div>

        {/* 评分因素 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <Text style={{ fontSize: 14, color: '#333' }}>运动频率</Text>
            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
              {analysis.efficiencyScore.factors.frequency}<Text type="secondary" style={{ fontSize: 13 }}>/40</Text>
            </Text>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <Text style={{ fontSize: 14, color: '#333' }}>运动一致性</Text>
            <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
              {analysis.efficiencyScore.factors.consistency}<Text type="secondary" style={{ fontSize: 13 }}>/30</Text>
            </Text>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <Text style={{ fontSize: 14, color: '#333' }}>体重影响</Text>
            <Text strong style={{ fontSize: 16, color: '#fa8c16' }}>
              {analysis.efficiencyScore.factors.weightImpact}<Text type="secondary" style={{ fontSize: 13 }}>/30</Text>
            </Text>
          </div>
        </div>

        {/* 24小时效果 */}
        {analysis.weightChangeAfterExercise.data.length > 0 && (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 280
          }}>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClockCircleOutlined style={{ color: '#fff', fontSize: 14 }} />
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>24小时效果</Text>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ 
                flex: 1,
                textAlign: 'center', 
                padding: '12px 8px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff', marginBottom: 2 }}>
                  {analysis.weightChangeAfterExercise.summary.total}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>总次数</div>
              </div>
              <div style={{ 
                flex: 1,
                textAlign: 'center', 
                padding: '12px 8px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a', marginBottom: 2 }}>
                  {analysis.weightChangeAfterExercise.summary.positive}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>有效</div>
              </div>
              <div style={{ 
                flex: 1,
                textAlign: 'center', 
                padding: '12px 8px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: analysis.weightChangeAfterExercise.summary.avgChange <= 0 ? '#52c41a' : '#ff4d4f',
                  marginBottom: 2
                }}>
                  {analysis.weightChangeAfterExercise.summary.avgChange <= 0 ? '↓' : '↑'}
                  {Math.abs(analysis.weightChangeAfterExercise.summary.avgChange).toFixed(1)}斤
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>平均变化</div>
              </div>
            </div>
            {analysis.weightChangeAfterExercise.summary.positive / analysis.weightChangeAfterExercise.summary.total >= 0.7 && (
              <div style={{ 
                marginTop: 10, 
                padding: '6px 10px', 
                background: 'rgba(82, 196, 26, 0.15)', 
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <Text style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>
                  ✓ {((analysis.weightChangeAfterExercise.summary.positive / analysis.weightChangeAfterExercise.summary.total) * 100).toFixed(0)}% 运动有效
                </Text>
              </div>
            )}
          </div>
        )}

        {/* 说明文字（如果没有24小时数据才显示） */}
        {analysis.weightChangeAfterExercise.data.length === 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            minWidth: 200
          }}>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.6 }}>
              {analysis.efficiencyScore.description}
            </Text>
          </div>
        )}
      </div>

      {/* 运动频率影响 - 全宽大图 */}
      {chartData && analysis.frequencyImpact.periods.length >= 2 && (
        <div style={{ 
          padding: '24px',
          background: '#fafafa',
          borderRadius: 12,
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LineChartOutlined style={{ color: '#1890ff', fontSize: 18 }} />
              <Text strong style={{ fontSize: 16 }}>运动频率影响</Text>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>分析周数 </Text>
                <Text strong style={{ fontSize: 14 }}>{analysis.frequencyImpact.summary.totalWeeks}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>周均运动 </Text>
                <Text strong style={{ fontSize: 14 }}>{analysis.frequencyImpact.summary.avgExercisePerWeek}次</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>周均变化 </Text>
                <Text strong style={{ 
                  fontSize: 14,
                  color: analysis.frequencyImpact.summary.avgWeightChangePerWeek <= 0 ? '#52c41a' : '#ff4d4f' 
                }}>
                  {analysis.frequencyImpact.summary.avgWeightChangePerWeek <= 0 ? '↓' : '↑'}
                  {Math.abs(analysis.frequencyImpact.summary.avgWeightChangePerWeek).toFixed(1)}斤
                </Text>
              </div>
            </div>
          </div>
          
          <div style={{ height: 280, marginBottom: 16 }}>
            <Chart
              type="bar"
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      boxWidth: 14,
                      padding: 15,
                      font: { size: 12 }
                    }
                  },
                  tooltip: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                },
                scales: {
                  x: {
                    ticks: { font: { size: 11 } },
                    grid: { display: false }
                  },
                  y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                      display: true,
                      text: '体重变化 (斤)',
                      font: { size: 12 }
                    },
                    ticks: { font: { size: 11 } }
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: '运动次数',
                      font: { size: 12 }
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: { font: { size: 11 } }
                  },
                },
              }}
            />
          </div>

          {analysis.frequencyImpact.correlation !== null && (
            <Alert
              message={analysis.frequencyImpact.insight}
              type={
                analysis.frequencyImpact.correlation < -0.5 ? 'success' :
                analysis.frequencyImpact.correlation < -0.2 ? 'info' :
                'warning'
              }
              showIcon
            />
          )}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: '#bfbfbf', textAlign: 'right' }}>
        {new Date(analysis.generatedAt).toLocaleString('zh-CN', { 
          month: 'numeric', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })} 更新
      </div>
    </Card>
  );
};


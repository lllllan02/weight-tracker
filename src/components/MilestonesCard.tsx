import React, { useState, useEffect } from "react";
import { Card, Button, List, Tag, Modal, Form, InputNumber, Input, message, Popconfirm, Empty } from "antd";
import { PlusOutlined, TrophyOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, FireOutlined } from "@ant-design/icons";
import { Milestone, UserProfile } from "../types";
import { getMilestones, addMilestone, updateMilestone, deleteMilestone } from "../utils/milestones-api";
import dayjs from "dayjs";

interface MilestonesCardProps {
  currentWeight: number;
  onMilestoneChange: () => void;
  profile?: UserProfile;
}

export const MilestonesCard: React.FC<MilestonesCardProps> = ({
  currentWeight,
  onMilestoneChange,
  profile,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const data = await getMilestones();
      setMilestones(data);
    } catch (error) {
      message.error("加载阶段目标失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    form.setFieldsValue({
      targetWeight: milestone.targetWeight,
      note: milestone.note || "",
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestone(id);
      message.success("删除成功");
      await loadMilestones();
      onMilestoneChange();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, values);
        message.success("更新成功");
      } else {
        await addMilestone(values);
        message.success("添加成功");
      }

      setIsModalVisible(false);
      await loadMilestones();
      onMilestoneChange();
    } catch (error) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 按目标体重排序
  const sortedMilestones = [...milestones].sort((a, b) => b.targetWeight - a.targetWeight);

  // 统计达成情况
  const achievedCount = milestones.filter((m) => m.achievedDate).length;
  const totalCount = milestones.length;

  // 计算目标体重的基础代谢率
  // targetWeight 单位为斤，需要转换为公斤（1公斤 = 2斤）
  const calculateTargetBMR = (targetWeight: number): number | null => {
    if (!profile?.birthYear || !profile?.gender || !profile?.height) {
      return null;
    }

    // 根据出生年份计算当前年龄
    const currentYear = new Date().getFullYear();
    const age = currentYear - profile.birthYear;

    if (age <= 0 || age > 150) {
      return null;
    }

    // 使用 Mifflin-St Jeor 公式
    const weightInKg = targetWeight / 2; // 斤转公斤
    const baseBMR = 10 * weightInKg + 6.25 * profile.height - 5 * age;

    if (profile.gender === 'male') {
      return Math.round(baseBMR + 5);
    } else if (profile.gender === 'female') {
      return Math.round(baseBMR - 161);
    }

    return null;
  };

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrophyOutlined style={{ color: "#faad14" }} />
            <span>阶段目标</span>
            <Tag color={achievedCount === totalCount && totalCount > 0 ? "success" : "processing"}>
              {achievedCount}/{totalCount} 已达成
            </Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
          >
            添加目标
          </Button>
        }
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          minWidth: 300,
        }}
      >
        <List
          loading={loading}
          dataSource={sortedMilestones}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <div style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
                      还没有设置阶段目标
                    </div>
                    <div style={{ fontSize: 13, color: "#999" }}>
                      点击上方 "添加目标" 按钮创建你的第一个目标
                    </div>
                  </div>
                }
                style={{ padding: "20px 0" }}
              />
            ),
          }}
          renderItem={(milestone) => {
            const isAchieved = !!milestone.achievedDate;
            const progress = currentWeight <= milestone.targetWeight;
            const targetBMR = calculateTargetBMR(milestone.targetWeight);

            return (
              <List.Item
                style={{
                  background: isAchieved ? "#f6ffed" : "#fff",
                  padding: "16px",
                  marginBottom: 8,
                  borderRadius: 8,
                  border: isAchieved ? "2px solid #52c41a" : "1px solid #f0f0f0",
                  position: "relative",
                }}
              >
                {/* 右上角操作按钮 */}
                {!isAchieved && (
                  <div style={{ 
                    position: "absolute", 
                    top: 12, 
                    right: 12, 
                    display: "flex", 
                    gap: 4,
                    zIndex: 1
                  }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(milestone)}
                    />
                    <Popconfirm
                      title="确定删除这个目标吗？"
                      onConfirm={() => handleDelete(milestone.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        type="text" 
                        size="small"
                        danger 
                        icon={<DeleteOutlined />} 
                      />
                    </Popconfirm>
                  </div>
                )}

                <List.Item.Meta
                  avatar={
                    isAchieved ? (
                      <CheckCircleOutlined
                        style={{ fontSize: 24, color: "#52c41a" }}
                      />
                    ) : (
                      <TrophyOutlined
                        style={{
                          fontSize: 24,
                          color: progress ? "#1890ff" : "#d9d9d9",
                        }}
                      />
                    )
                  }
                  title={
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8,
                      paddingRight: isAchieved ? 0 : 80  // 为右上角按钮留出空间
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>
                        {milestone.targetWeight.toFixed(1)} 斤
                      </span>
                      {isAchieved && (
                        <Tag color="success">
                          已达成 {dayjs(milestone.achievedDate).format("YYYY-MM-DD")}
                        </Tag>
                      )}
                      {!isAchieved && progress && (
                        <Tag color="processing">已完成</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: 14, color: "#666", wordBreak: "keep-all", whiteSpace: "normal" }}>
                      {milestone.note && <div style={{ marginBottom: 4 }}>{milestone.note}</div>}
                      {!isAchieved && (
                        <div style={{ marginTop: 4 }}>
                          距离目标：{Math.abs(currentWeight - milestone.targetWeight).toFixed(1)} 斤
                        </div>
                      )}
                      {targetBMR && (
                        <div style={{ 
                          marginTop: 8, 
                          padding: "6px 10px",
                          background: "#fff7e6",
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap"
                        }}>
                          <FireOutlined style={{ color: "#fa8c16", fontSize: 14 }} />
                          <span style={{ color: "#fa8c16", fontWeight: 600 }}>
                            基础代谢：{targetBMR} kcal/天
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        title={editingMilestone ? "编辑阶段目标" : "添加阶段目标"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="targetWeight"
            label="目标体重 (kg)"
            rules={[
              { required: true, message: "请输入目标体重" },
              { type: "number", min: 20, max: 300, message: "体重范围应在20-300kg之间" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="例如: 65"
              precision={1}
            />
          </Form.Item>
          <Form.Item name="note" label="备注（可选）">
            <Input.TextArea
              placeholder="例如: 第一阶段目标"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};


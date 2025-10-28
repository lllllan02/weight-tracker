import React, { useState, useEffect } from "react";
import { Card, Button, Form, InputNumber, Select, message, Space, Divider } from "antd";
import { SettingOutlined, UserOutlined, FireOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { UserProfile, WeightStats, Milestone } from "../types";
import { getProfile, updateProfile } from "../utils/api";
import { getMilestones } from "../utils/milestones-api";

const { Option } = Select;

interface ProfileSettingsCardProps {
  onProfileChange: () => void;
  stats?: WeightStats;
}

export const ProfileSettingsCard: React.FC<ProfileSettingsCardProps> = ({
  onProfileChange,
  stats,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    height: 170,
    theme: "light",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    loadProfile();
    loadNextMilestone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stats?.current) {
      loadNextMilestone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.current]);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      form.setFieldsValue({
        height: data.height,
        birthYear: data.birthYear,
        gender: data.gender,
      });
    } catch (error) {
      message.error("加载个人资料失败");
    }
  };

  const loadNextMilestone = async () => {
    try {
      const milestones = await getMilestones();
      if (!stats?.current || !milestones || milestones.length === 0) {
        setNextMilestone(null);
        return;
      }

      // 找到未达成的、距离当前体重最近的阶段目标
      const unachievedMilestones = milestones
        .filter((m: Milestone) => !m.achievedDate)
        .sort((a: Milestone, b: Milestone) => {
          const diffA = Math.abs(a.targetWeight - stats.current);
          const diffB = Math.abs(b.targetWeight - stats.current);
          return diffA - diffB;
        });

      if (unachievedMilestones.length > 0) {
        setNextMilestone(unachievedMilestones[0]);
      } else {
        setNextMilestone(null);
      }
    } catch (error) {
      console.error("加载阶段目标失败:", error);
    }
  };

  // 计算目标体重的基础代谢率
  const calculateTargetBMR = (targetWeight: number): number | null => {
    if (!profile?.birthYear || !profile?.gender || !profile?.height) {
      return null;
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - profile.birthYear;

    if (age <= 0 || age > 150) {
      return null;
    }

    const baseBMR = 10 * targetWeight + 6.25 * profile.height - 5 * age;

    if (profile.gender === 'male') {
      return Math.round(baseBMR + 5);
    } else if (profile.gender === 'female') {
      return Math.round(baseBMR - 161);
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const updatedProfile: UserProfile = {
        ...profile,
        height: values.height,
        birthYear: values.birthYear || undefined,
        gender: values.gender || undefined,
      };

      await updateProfile(updatedProfile);
      message.success("保存成功");
      setProfile(updatedProfile);
      setIsEditing(false);
      await loadNextMilestone();
      onProfileChange();
    } catch (error) {
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      height: profile.height,
      birthYear: profile.birthYear,
      gender: profile.gender,
    });
    setIsEditing(false);
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined style={{ color: "#1890ff" }} />
          <span>个人资料</span>
        </div>
      }
      extra={
        !isEditing && (
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => setIsEditing(true)}
            size="small"
          >
            编辑资料
          </Button>
        )
      }
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              height: profile.height,
              birthYear: profile.birthYear,
              gender: profile.gender,
            }}
          >
          <Form.Item
          name="height"
          label="身高 (cm)"
          rules={[
            { required: true, message: "请输入身高" },
            {
              type: "number",
              min: 100,
              max: 250,
              message: "身高范围应在100-250cm之间",
            },
          ]}
        >
          <InputNumber
            placeholder="例如: 170"
            style={{ width: "100%" }}
            min={100}
            max={250}
            disabled={!isEditing}
          />
        </Form.Item>

        <Form.Item
          name="birthYear"
          label="出生年份"
          rules={[
            {
              type: "number",
              min: 1900,
              max: new Date().getFullYear(),
              message: `出生年份范围应在1900-${new Date().getFullYear()}之间`,
            },
          ]}
        >
          <InputNumber
            placeholder="例如: 1990"
            style={{ width: "100%" }}
            min={1900}
            max={new Date().getFullYear()}
            disabled={!isEditing}
          />
        </Form.Item>

        <Form.Item name="gender" label="性别">
          <Select placeholder="请选择性别" allowClear disabled={!isEditing}>
            <Option value="male">男性</Option>
            <Option value="female">女性</Option>
          </Select>
        </Form.Item>

        {isEditing && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>
              💡 出生年份和性别用于计算基础代谢率（BMR）
            </div>
            <Space>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                保存
              </Button>
              <Button onClick={handleCancel}>取消</Button>
            </Space>
          </>
        )}

        {!isEditing && stats?.currentBMR && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              💡 基础代谢率
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* 当前基础代谢 - 紧凑显示 */}
              <div style={{ 
                background: "#fff7e6", 
                border: "1px solid #ffd591",
                borderRadius: 6, 
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FireOutlined style={{ color: "#fa8c16", fontSize: 14 }} />
                  <span style={{ fontSize: 13, color: "#666" }}>当前</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fa8c16" }}>
                  {stats.currentBMR} <span style={{ fontSize: 12, fontWeight: 400 }}>kcal/天</span>
                </div>
              </div>

              {/* 下一阶段基础代谢 - 紧凑显示 */}
              {nextMilestone && calculateTargetBMR(nextMilestone.targetWeight) && (
                <div style={{ 
                  background: "#f6ffed", 
                  border: "1px solid #b7eb8f",
                  borderRadius: 6, 
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowRightOutlined style={{ color: "#52c41a", fontSize: 12 }} />
                    <span style={{ fontSize: 13, color: "#666" }}>
                      {nextMilestone.targetWeight}kg
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#52c41a" }}>
                    {calculateTargetBMR(nextMilestone.targetWeight)} <span style={{ fontSize: 12, fontWeight: 400 }}>kcal/天</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
          </Form>
        </div>
      </div>
    </Card>
  );
};


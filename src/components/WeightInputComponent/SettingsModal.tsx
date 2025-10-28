import React from "react";
import { Modal, Form, InputNumber, Select } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { UserProfile } from "../../types";

const { Option } = Select;

interface SettingsModalProps {
  isVisible: boolean;
  onOk: () => void;
  onCancel: () => void;
  profile: UserProfile;
  form: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onOk,
  onCancel,
  profile,
  form,
}) => {
  return (
    <Modal
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          个人设置
        </span>
      }
      open={isVisible}
      onOk={onOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
    >
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
          />
        </Form.Item>

        <Form.Item
          name="gender"
          label="性别"
        >
          <Select placeholder="请选择性别" allowClear>
            <Option value="male">男性</Option>
            <Option value="female">女性</Option>
          </Select>
        </Form.Item>

        <div style={{ color: "#999", fontSize: 14, marginTop: -8 }}>
          💡 提示：出生年份和性别用于计算基础代谢率（BMR）
        </div>
        <div style={{ color: "#999", fontSize: 14, marginTop: 8 }}>
          💡 提示：请在下方"阶段目标"中设置减重目标
        </div>
      </Form>
    </Modal>
  );
};

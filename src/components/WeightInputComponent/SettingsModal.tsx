import React from "react";
import { Modal, Form, InputNumber } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { UserProfile } from "../../types";

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
        <div style={{ color: "#999", fontSize: 14, marginTop: -8 }}>
          💡 提示：请在下方"阶段目标"中设置减重目标
        </div>
      </Form>
    </Modal>
  );
};

import React from "react";
import { Modal, Form, InputNumber, Input } from "antd";
import { Dayjs } from "dayjs";
import { TimeSlot } from "./constants";

interface WeightRecordModalProps {
  isVisible: boolean;
  onOk: () => void;
  onCancel: () => void;
  loading: boolean;
  selectedDate: Dayjs;
  selectedTimeSlot: TimeSlot;
  form: any;
  isEditing?: boolean;
}

export const WeightRecordModal: React.FC<WeightRecordModalProps> = ({
  isVisible,
  onOk,
  onCancel,
  loading,
  selectedDate,
  selectedTimeSlot,
  form,
  isEditing = false,
}) => {
  return (
    <Modal
      title={
        <span
          style={{
            fontWeight: 800,
            fontSize: 24,
            color: "#1677ff",
            letterSpacing: 1,
          }}
        >
          {isEditing ? "编辑" : "添加"}体重记录 -{" "}
          {selectedDate.format("YYYY-MM-DD")} {selectedTimeSlot.label}
        </span>
      }
      open={isVisible}
      onOk={onOk}
      onCancel={onCancel}
      okText={<span style={{ fontSize: 18, fontWeight: 600 }}>保存</span>}
      cancelText={<span style={{ fontSize: 16 }}>取消</span>}
      styles={{
        body: {
          padding: 32,
          paddingTop: 24,
          borderRadius: 20,
          background: "#f8fafc",
        },
      }}
      style={{
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(22,119,255,0.10)",
      }}
      okButtonProps={{
        style: {
          height: 44,
          fontSize: 18,
          borderRadius: 12,
          background: "#1677ff",
          border: "none",
        },
        loading: loading,
      }}
      cancelButtonProps={{
        style: { height: 44, fontSize: 16, borderRadius: 12 },
      }}
      width={440}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="weight"
          label={<span style={{ fontWeight: 600 }}>体重 (斤)</span>}
          rules={[
            { required: true, message: "请输入体重" },
            {
              type: "number",
              min: 40,
              max: 600,
              message: "体重范围应在40-600斤之间",
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          <InputNumber
            autoFocus
            placeholder="例如: 131.0"
            style={{
              width: "100%",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              height: 44,
              fontSize: 16,
            }}
            className="weight-input-number"
            precision={1}
            min={40}
            max={600}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label={<span style={{ fontWeight: 600 }}>备注 (可选)</span>}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            placeholder="例如: 运动后"
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              minHeight: 48,
              fontSize: 15,
            }}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

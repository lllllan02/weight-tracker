import React, { useState } from "react";
import { Button, InputNumber, Switch, message } from "antd";
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { WeightRecord, TimeSlot } from "../../types";

interface TimeSlotCardProps {
  slot: TimeSlot;
  selectedDate: Dayjs;
  hasRecord: boolean;
  record?: WeightRecord;
  onAddRecord: (date: Dayjs, slot: TimeSlot) => void;
  onEditRecord: (date: Dayjs, slot: TimeSlot) => void;
  onSaveRecord: (date: Dayjs, slot: TimeSlot, weight: number, fasting: boolean) => void;
  onCancelEdit: () => void;
  onDeleteRecord: (date: Dayjs, slot: TimeSlot) => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  selectedDate,
  hasRecord,
  record,
  onAddRecord,
  onEditRecord,
  onSaveRecord,
  onCancelEdit,
  onDeleteRecord,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(record?.weight || 0);
  const [editFasting, setEditFasting] = useState(record?.fasting === "空腹" || false);
  
  const isToday = selectedDate.isSame(dayjs(), "day");
  const isPast = selectedDate.isBefore(dayjs(), "day");

  const handleEdit = () => {
    setIsEditing(true);
    // 如果是新增记录，设置默认值
    if (hasRecord && record) {
      setEditWeight(record.weight);
      setEditFasting(record.fasting === "空腹");
    } else {
      // 新增记录时设置默认值
      setEditWeight(0);
      setEditFasting(false);
    }
  };

  const handleSave = () => {
    if (editWeight > 0) {
      onSaveRecord(selectedDate, slot, editWeight, editFasting);
      setIsEditing(false);
    } else {
      // 提示用户输入有效的体重
      message.error("请输入有效的体重数值");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    onCancelEdit();
  };

  const handleDelete = () => {
    if (hasRecord && record) {
      onDeleteRecord(selectedDate, slot);
    }
  };

  return (
    <div
      style={{
        border: hasRecord
          ? `2px solid ${slot.color}`
          : `1px solid ${slot.color}30`,
        borderRadius: 12,
        background: hasRecord ? `${slot.color}05` : "#fafbfc",
        padding: "16px",
        textAlign: "center",
        position: "relative",
        minHeight: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: hasRecord
          ? `0 4px 12px ${slot.color}15`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.3s ease",
        borderStyle: hasRecord ? "solid" : "dashed",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: slot.color,
            marginBottom: 10,
            letterSpacing: 0.5,
          }}
        >
          {slot.label}
        </div>

        {isEditing ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <InputNumber
                value={editWeight}
                onChange={(value) => setEditWeight(value || 0)}
                placeholder="体重"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  height: 36,
                  fontSize: 16,
                }}
                precision={1}
                min={20}
                max={300}
              />
            </div>
            <div style={{ marginBottom: 12, textAlign: "center" }}>
              <Switch
                checked={editFasting}
                onChange={setEditFasting}
                checkedChildren="空腹"
                unCheckedChildren="非空腹"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
        ) : hasRecord ? (
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: slot.color,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              {record?.weight}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#666",
                marginBottom: 6,
                fontWeight: 500,
                background: "rgba(255,255,255,0.8)",
                padding: "3px 8px",
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {record?.fasting}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 14,
              color: "#ccc",
              fontWeight: 500,
              marginBottom: 6,
              fontStyle: "italic",
            }}
          >
            暂无记录
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleSave}
            style={{
              borderRadius: 8,
              background: "#52c41a",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              height: 32,
              fontSize: 12,
              flex: 1,
            }}
          >
            保存
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancel}
            style={{
              borderRadius: 8,
              borderColor: "#d9d9d9",
              color: "#666",
              fontWeight: 600,
              height: 32,
              fontSize: 12,
              flex: 1,
            }}
          >
            取消
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type={hasRecord ? "primary" : "dashed"}
            size="small"
            icon={hasRecord ? <EditOutlined /> : <PlusOutlined />}
            onClick={() =>
              hasRecord
                ? handleEdit()
                : handleEdit() // 新增记录也直接进入编辑模式
            }
            disabled={!isPast && !isToday}
            style={{
              borderRadius: 8,
              borderColor: slot.color,
              background: hasRecord ? slot.color : "transparent",
              color: hasRecord ? "#fff" : slot.color,
              fontWeight: 600,
              height: 32,
              fontSize: 12,
              boxShadow: hasRecord ? `0 2px 8px ${slot.color}25` : "none",
              borderWidth: hasRecord ? 0 : 1.5,
              flex: 1,
            }}
          >
            {hasRecord ? "编辑" : "添加"}
          </Button>
          {hasRecord && (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              disabled={!isPast && !isToday}
              style={{
                borderRadius: 8,
                borderColor: "#ff4d4f",
                color: "#ff4d4f",
                fontWeight: 600,
                height: 32,
                fontSize: 12,
                borderWidth: 1.5,
                minWidth: 32,
              }}
              danger
            />
          )}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Card, Tag, Checkbox } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { WeightRecord, CalendarData } from "../../types";
import { TIME_SLOTS, TimeSlot } from "./constants";
import { TimeSlotCard } from "./TimeSlotCard";

interface DayRecordCardProps {
  selectedDate: Dayjs;
  calendarData: CalendarData;
  onAddRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
  onEditRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
  onSaveRecord: (date: Dayjs, timeSlot: TimeSlot, weight: number, fasting: boolean) => void;
  onCancelEdit: () => void;
  onExerciseChange: (date: Dayjs, exercise: boolean) => void;
  onDeleteRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
}

export const DayRecordCard: React.FC<DayRecordCardProps> = ({
  selectedDate,
  calendarData,
  onAddRecord,
  onEditRecord,
  onSaveRecord,
  onCancelEdit,
  onExerciseChange,
  onDeleteRecord,
}) => {
  const { dayRecords = {}, exerciseRecords = {} } = calendarData;

  // 检查某个时间段是否已有记录
  const hasRecord = (date: Dayjs, timeSlot: TimeSlot): boolean => {
    const dateKey = date.format("YYYY-MM-DD");
    return !!dayRecords[dateKey]?.[timeSlot.key];
  };

  // 获取某个时间段的记录
  const getRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    const dateKey = date.format("YYYY-MM-DD");
    return dayRecords[dateKey]?.[timeSlot.key] as WeightRecord | undefined;
  };

  // 获取当天的运动状态
  const getExerciseStatus = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    return exerciseRecords[dateKey] || false;
  };

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
              {selectedDate.format("MM月DD日")}
            </span>
            <span style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
              {selectedDate.format("dddd")}
            </span>
          </div>
          {selectedDate.isSame(dayjs(), "day") && (
            <Tag
              color="#1677ff"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                border: "none",
                background: "#e6f7ff",
                color: "#1677ff",
                fontWeight: 600,
              }}
            >
              今天
            </Tag>
          )}
        </div>
      }
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: selectedDate.isSame(dayjs(), "day")
          ? "2px solid #1677ff"
          : "1px solid #f0f0f0",
        background: "#fff",
      }}
      styles={{ body: { padding: "16px 12px" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TIME_SLOTS.map((slot) => {
          const hasRecordForSlot = hasRecord(selectedDate, slot);
          const record = getRecord(selectedDate, slot);

          return (
            <TimeSlotCard
              key={slot.key}
              slot={slot}
              selectedDate={selectedDate}
              hasRecord={hasRecordForSlot}
              record={record}
              onAddRecord={onAddRecord}
              onEditRecord={onEditRecord}
              onSaveRecord={onSaveRecord}
              onCancelEdit={onCancelEdit}
              onDeleteRecord={onDeleteRecord}
            />
          );
        })}

        {/* 运动选项 */}
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 12,
            background: "#fafbfc",
            padding: "16px",
            textAlign: "center",
            position: "relative",
            minHeight: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.3s ease",
            borderStyle: "dashed",
          }}
        >
          <Checkbox
            checked={getExerciseStatus(selectedDate)}
            onChange={(e) => onExerciseChange(selectedDate, e.target.checked)}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1890ff",
            }}
          >
            🏃‍♂️ 今天有运动
          </Checkbox>
        </div>
      </div>
    </Card>
  );
};
